import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BorrowRequest,
  Category,
  ChatAudience,
  ClothingItem,
  CurrentUser,
  GroupChat,
  Location,
  OffCampusAddress,
  Person,
  WearLogEntry,
} from './types'
import {
  ME,
  seedBorrowRequests,
  seedChats,
  seedItems,
  seedOffCampusDistances,
  seedPeople,
  seedUser,
  seedWearLog,
} from './data/seed'
import { BUILDINGS, type Building } from './data/buildings'
import { matchSchoolDomain } from './data/communities'
import { isBackendEnabled } from './lib/supabaseClient'
import * as backend from './lib/backendApi'
import { coordsFor, haversineMeters } from './lib/proximity'

function id() {
  return crypto.randomUUID()
}

// Local demo only: the same distances friend_distances() returns, computed
// from building coordinates (and rounded to 100 m the same way).
function localDistances(user: CurrentUser, people: Person[], buildings: Building[]): Record<string, number> {
  const mine = coordsFor(user, buildings)
  const out: Record<string, number> = {}
  if (!mine) return out
  for (const p of people) {
    const theirs = coordsFor(p, buildings)
    if (theirs) out[p.id] = Math.round(haversineMeters(mine, theirs) / 100) * 100
    else if (seedOffCampusDistances[p.id] !== undefined) out[p.id] = seedOffCampusDistances[p.id]
  }
  return out
}

// Local demo only: the code a real deployment would have emailed.
let demoSchoolCode: { email: string; code: string } | null = null

function report(action: string, err: unknown) {
  // Local state has already been updated optimistically by the time this
  // fires — we log rather than roll back so a flaky connection doesn't
  // yank the UI out from under someone mid-flow. Surface it for real once
  // there's a toast/notification system.
  console.error(`[backend] ${action} failed:`, err)
}

type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

interface BlueprintState {
  // auth / backend — no-ops when isBackendEnabled is false (see supabaseClient.ts)
  authStatus: AuthStatus
  authUserId: string | null
  authError: string | null
  initAuth: () => void
  // Resolves with whether the new account must confirm its email before it
  // can sign in (Supabase "Confirm email" setting).
  signUp: (input: { email: string; password: string; name: string; handle: string }) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>

  user: CurrentUser
  people: Person[] // your accepted friends once a backend is connected
  items: ClothingItem[]
  borrowRequests: BorrowRequest[]
  chats: GroupChat[] // fit checks you're a member of
  publicChats: GroupChat[] // public fit checks from people outside them
  wearLog: WearLogEntry[]
  buildings: Building[] // from the buildings table once a backend is connected
  distances: Record<string, number> // friend id -> meters (rounded to 100)
  refreshDistances: () => void
  refreshPublicChats: () => void

  // friend graph — no-ops against local mock data (the 4 seed people are
  // already "friends" there); real once a backend is connected
  friendRequestsIncoming: Person[]
  friendRequestsOutgoingIds: string[]
  discoverablePeople: Person[]
  refreshFriendData: () => void
  sendFriendRequest: (personId: string) => void
  respondToFriendRequest: (personId: string, decision: 'accepted' | 'declined') => void
  // Live-updates friend requests/friends while the Friends screen is open;
  // returns an unsubscribe function. No-op (returns a no-op) locally.
  subscribeToFriendsRealtime: () => () => void

  // onboarding
  completeOnboarding: () => void
  setPublic: (isPublic: boolean) => void
  connectShop: () => void
  connectGmail: () => void
  setProfile: (patch: Partial<Pick<CurrentUser, 'name' | 'handle' | 'bio'>>) => void
  setLocation: (loc: Location, offCampusAddress: OffCampusAddress | null) => void
  setPhone: (phone: string) => void
  // School community: emails a code to a .edu address, then checks it.
  // In the local demo nothing is emailed — demoCode is returned instead so
  // the screen can show it.
  sendSchoolCode: (email: string) => Promise<{ demoCode?: string }>
  verifySchoolCode: (code: string) => Promise<backend.VerifyResult>
  upgradeToPlus: () => void
  // Local-preview immediately, then uploads to Storage and persists the
  // real URL when a backend is connected. No-op upload (preview only,
  // lost on reload) in local demo mode — there's nowhere to persist it.
  uploadAvatar: (file: File) => Promise<void>

  // wardrobe
  addItem: (input: {
    name: string
    brand: string
    category: Category
    size: string
    color: string
    priceDollars: number
    source: 'manual' | 'shop' | 'gmail'
  }) => string
  logWear: (itemId: string) => void
  toggleLendable: (itemId: string) => void
  setItemPrivate: (itemId: string, isPrivate: boolean) => void
  uploadItemImage: (itemId: string, file: File) => Promise<void>

  // borrowing
  sendBorrowRequest: (input: {
    itemId: string
    whenNeeded: BorrowRequest['whenNeeded']
    note: string
  }) => void
  respondToBorrowRequest: (requestId: string, decision: 'approved' | 'declined') => void
  markReturned: (requestId: string) => void

  // chats / fit checks — real-time and backed by the friend graph once a
  // backend is connected; local mock data otherwise.
  startFitCheck: (input: {
    eventName: string
    location: string
    eventTime: string
    optionAItemIds: string[]
    optionBItemIds: string[]
    audience: ChatAudience
  }) => string
  castVote: (chatId: string, optionId: string) => void
  addComment: (chatId: string, text: string) => void
  decideChat: (chatId: string) => void
  // Subscribes to live votes/comments for one chat; returns an unsubscribe
  // function. No-op (returns a no-op) when no backend is connected.
  subscribeToChatRealtime: (chatId: string) => () => void
}

export const useStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      authStatus: isBackendEnabled ? 'loading' : 'authenticated',
      authUserId: isBackendEnabled ? null : ME,
      authError: null,

      user: seedUser,
      people: seedPeople,
      items: seedItems,
      borrowRequests: seedBorrowRequests,
      chats: seedChats,
      publicChats: [],
      wearLog: seedWearLog,
      buildings: BUILDINGS,
      distances: localDistances(seedUser, seedPeople, BUILDINGS),

      friendRequestsIncoming: [],
      friendRequestsOutgoingIds: [],
      discoverablePeople: [],

      initAuth: () => {
        if (!isBackendEnabled) return // already 'authenticated' against local mock data
        backend.onAuthStateChange(async (userId) => {
          if (!userId) {
            set({ authStatus: 'anonymous', authUserId: null })
            return
          }
          try {
            const [user, myItems, visible, borrowRequests, chats, friends, buildings, distances] = await Promise.all([
              backend.fetchProfile(userId),
              backend.fetchMyItems(userId),
              backend.fetchVisibleItems(userId),
              backend.fetchBorrowRequests(userId),
              backend.fetchMyChats(userId),
              backend.fetchFriends(userId),
              backend.fetchBuildings(),
              backend.fetchFriendDistances(),
            ])
            const items = [...myItems, ...visible]
            const wearLog = await backend.fetchWearLog(myItems.map((i) => i.id))
            set({
              user,
              items,
              wearLog,
              borrowRequests,
              chats,
              people: friends,
              buildings: buildings.length > 0 ? buildings : BUILDINGS,
              distances,
              authStatus: 'authenticated',
              authUserId: userId,
            })
            get().refreshFriendData()
          } catch (err) {
            report('hydrate', err)
            set({ authStatus: 'anonymous', authUserId: null, authError: 'Could not load your account. Try signing in again.' })
          }
        })
      },

      signUp: async (input) => {
        set({ authError: null })
        try {
          return await backend.signUp(input)
        } catch (err) {
          set({ authError: err instanceof Error ? err.message : 'Sign up failed' })
          throw err
        }
      },
      signIn: async (input) => {
        set({ authError: null })
        try {
          await backend.signIn(input)
        } catch (err) {
          set({ authError: err instanceof Error ? err.message : 'Sign in failed' })
          throw err
        }
      },
      signOut: async () => {
        if (isBackendEnabled) await backend.signOut()
      },

      refreshFriendData: () => {
        if (!isBackendEnabled) return
        const userId = get().authUserId
        if (!userId) return
        Promise.all([backend.fetchIncomingRequests(userId), backend.fetchOutgoingRequestIds(userId), backend.fetchDiscoverablePeople(userId)])
          .then(([incoming, outgoingIds, discoverable]) =>
            set({ friendRequestsIncoming: incoming, friendRequestsOutgoingIds: outgoingIds, discoverablePeople: discoverable }),
          )
          .catch((e) => report('refreshFriendData', e))
      },
      sendFriendRequest: (personId) => {
        if (!isBackendEnabled) return
        const userId = get().authUserId
        if (!userId) return
        set((s) => ({ friendRequestsOutgoingIds: [...s.friendRequestsOutgoingIds, personId] }))
        backend
          .sendFriendRequest(userId, personId)
          .catch((e) => report('sendFriendRequest', e))
      },
      respondToFriendRequest: (personId, decision) => {
        if (!isBackendEnabled) return
        const userId = get().authUserId
        if (!userId) return
        const person = get().friendRequestsIncoming.find((p) => p.id === personId)
        set((s) => ({
          friendRequestsIncoming: s.friendRequestsIncoming.filter((p) => p.id !== personId),
          people: decision === 'accepted' && person ? [...s.people, person] : s.people,
        }))
        backend
          .respondToFriendRequest(personId, userId, decision)
          .then(async () => {
            if (decision !== 'accepted') return
            // Their location and closet only became readable just now.
            const [friends, visible] = await Promise.all([backend.fetchFriends(userId), backend.fetchVisibleItems(userId)])
            set((s) => ({ people: friends, items: [...s.items.filter((i) => i.ownerId === userId), ...visible] }))
            get().refreshDistances()
          })
          .catch((e) => report('respondToFriendRequest', e))
      },
      refreshDistances: () => {
        if (!isBackendEnabled) {
          set((s) => ({ distances: localDistances(s.user, s.people, s.buildings) }))
          return
        }
        backend
          .fetchFriendDistances()
          .then((distances) => set({ distances }))
          .catch((e) => report('refreshDistances', e))
      },
      refreshPublicChats: () => {
        if (!isBackendEnabled) return
        const userId = get().authUserId
        if (!userId) return
        backend
          .fetchPublicChats(userId)
          .then(async (publicChats) => {
            set({ publicChats })
            // Outfit photos in a stranger's public fit check aren't in the
            // store yet (they're not a friend's items).
            const known = new Set(get().items.map((i) => i.id))
            const missing = [...new Set(publicChats.flatMap((c) => c.options.flatMap((o) => o.itemIds)))].filter((id) => !known.has(id))
            const fetched = await backend.fetchItemsByIds(missing)
            if (fetched.length) set((s) => ({ items: [...s.items, ...fetched.filter((i) => !s.items.some((x) => x.id === i.id))] }))
          })
          .catch((e) => report('refreshPublicChats', e))
      },
      subscribeToFriendsRealtime: () => {
        if (!isBackendEnabled) return () => {}
        const userId = get().authUserId
        if (!userId) return () => {}
        return backend.subscribeToFriendships(userId, () => get().refreshFriendData())
      },

      completeOnboarding: () => {
        set((s) => ({ user: { ...s.user, hasCompletedOnboarding: true } }))
        if (isBackendEnabled) backend.updateProfile(get().authUserId!, { has_completed_onboarding: true }).catch((e) => report('completeOnboarding', e))
      },
      setPublic: (isPublic) => {
        set((s) => ({ user: { ...s.user, isPublic } }))
        if (isBackendEnabled) backend.updateProfile(get().authUserId!, { is_public: isPublic }).catch((e) => report('setPublic', e))
      },
      connectShop: () => {
        set((s) => ({ user: { ...s.user, hasConnectedShop: true } }))
        const newId = id()
        const now = new Date().toISOString()
        const imported: ClothingItem = {
          id: newId,
          ownerId: get().authUserId ?? ME,
          name: 'Ribbed Tank',
          brand: 'Aritzia',
          category: 'Tops',
          size: 'S',
          color: 'Black',
          priceCents: 3800,
          wearCount: 0,
          lastWornAt: null,
          lendable: false,
          addedAt: now,
          source: 'shop',
          timesLent: 0,
          alwaysReturned: true,
          imageUrl: null,
          isPrivate: false,
        }
        set((s) => ({ items: [imported, ...s.items] }))
        if (isBackendEnabled) {
          backend.updateProfile(get().authUserId!, { has_connected_shop: true }).catch((e) => report('connectShop', e))
          backend
            .insertItem(newId, get().authUserId!, { name: imported.name, brand: imported.brand, category: imported.category, size: imported.size, color: imported.color, priceCents: imported.priceCents, source: 'shop' })
            .catch((e) => report('connectShop:item', e))
        }
      },
      connectGmail: () => {
        set((s) => ({ user: { ...s.user, hasConnectedGmail: true } }))
        const newId = id()
        const now = new Date().toISOString()
        const imported: ClothingItem = {
          id: newId,
          ownerId: get().authUserId ?? ME,
          name: 'Suede Ballet Flats',
          brand: 'Everlane',
          category: 'Shoes',
          size: '8',
          color: 'Taupe',
          priceCents: 12000,
          wearCount: 0,
          lastWornAt: null,
          lendable: false,
          addedAt: now,
          source: 'gmail',
          timesLent: 0,
          alwaysReturned: true,
          imageUrl: null,
          isPrivate: false,
        }
        set((s) => ({ items: [imported, ...s.items] }))
        if (isBackendEnabled) {
          backend.updateProfile(get().authUserId!, { has_connected_gmail: true }).catch((e) => report('connectGmail', e))
          backend
            .insertItem(newId, get().authUserId!, { name: imported.name, brand: imported.brand, category: imported.category, size: imported.size, color: imported.color, priceCents: imported.priceCents, source: 'gmail' })
            .catch((e) => report('connectGmail:item', e))
        }
      },
      setProfile: (patch) => {
        set((s) => ({ user: { ...s.user, ...patch } }))
        if (isBackendEnabled) {
          const dbPatch: Record<string, unknown> = {}
          if (patch.name !== undefined) dbPatch.name = patch.name
          if (patch.handle !== undefined) dbPatch.handle = patch.handle
          if (patch.bio !== undefined) dbPatch.bio = patch.bio
          backend.updateProfile(get().authUserId!, dbPatch).catch((e) => report('setProfile', e))
        }
      },
      setLocation: (loc, offCampusAddress) => {
        const address = loc.offCampus ? offCampusAddress : null
        set((s) => ({ user: { ...s.user, ...loc, offCampusAddress: address } }))
        if (!isBackendEnabled) {
          get().refreshDistances()
          return
        }
        backend
          .saveLocation(get().authUserId!, loc, address)
          .then(() => get().refreshDistances())
          .catch((e) => report('setLocation', e))
      },
      setPhone: (phone) => {
        set((s) => ({ user: { ...s.user, phone } }))
        if (isBackendEnabled) backend.savePhone(get().authUserId!, phone).catch((e) => report('setPhone', e))
      },
      sendSchoolCode: async (email) => {
        const normalized = email.trim().toLowerCase()
        if (isBackendEnabled) {
          await backend.sendSchoolCode(normalized)
          set((s) => ({ user: { ...s.user, pendingSchoolEmail: normalized } }))
          return {}
        }
        if (!matchSchoolDomain(normalized)) {
          throw new Error("That school isn't on Blueprint yet — right now it's Columbia and Barnard emails only.")
        }
        const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
        demoSchoolCode = { email: normalized, code }
        set((s) => ({ user: { ...s.user, pendingSchoolEmail: normalized } }))
        return { demoCode: code }
      },
      verifySchoolCode: async (code) => {
        if (isBackendEnabled) {
          const result = await backend.verifySchoolCode(code)
          if (result === 'verified') {
            const user = await backend.fetchProfile(get().authUserId!)
            set({ user })
            get().refreshFriendData()
          }
          return result
        }
        if (!demoSchoolCode) return 'no_pending'
        if (code.trim() !== demoSchoolCode.code) return 'incorrect'
        const match = matchSchoolDomain(demoSchoolCode.email)!
        const email = demoSchoolCode.email
        demoSchoolCode = null
        set((s) => ({
          user: { ...s.user, schoolEmail: email, pendingSchoolEmail: null, communityId: match.communityId, school: match.schoolName },
        }))
        return 'verified'
      },
      uploadAvatar: async (file) => {
        const previewUrl = URL.createObjectURL(file)
        set((s) => ({ user: { ...s.user, avatarUrl: previewUrl } }))
        if (!isBackendEnabled) return
        try {
          const userId = get().authUserId!
          const url = await backend.uploadAvatarPhoto(userId, file)
          await backend.updateProfile(userId, { avatar_url: url })
          set((s) => ({ user: { ...s.user, avatarUrl: url } }))
        } catch (e) {
          report('uploadAvatar', e)
        }
      },
      upgradeToPlus: () => {
        set((s) => ({ user: { ...s.user, isPremium: true } }))
        if (isBackendEnabled) backend.updateProfile(get().authUserId!, { is_premium: true }).catch((e) => report('upgradeToPlus', e))
      },

      addItem: (input) => {
        const newId = id()
        const ownerId = get().authUserId ?? ME
        const item: ClothingItem = {
          id: newId,
          ownerId,
          name: input.name,
          brand: input.brand,
          category: input.category,
          size: input.size,
          color: input.color,
          priceCents: Math.round(input.priceDollars * 100),
          wearCount: 0,
          lastWornAt: null,
          lendable: false,
          addedAt: new Date().toISOString(),
          source: input.source,
          timesLent: 0,
          alwaysReturned: true,
          imageUrl: null,
          isPrivate: false,
        }
        set((s) => ({ items: [item, ...s.items] }))
        if (isBackendEnabled) {
          backend
            .insertItem(newId, ownerId, {
              name: input.name,
              brand: input.brand,
              category: input.category,
              size: input.size,
              color: input.color,
              priceCents: item.priceCents,
              source: input.source,
            })
            .catch((e) => report('addItem', e))
        }
        return newId
      },
      logWear: (itemId) => {
        const month = new Date().toISOString().slice(0, 7)
        const now = new Date().toISOString()
        const priorEntry = get().wearLog.find((w) => w.itemId === itemId && w.month === month)
        const newWearCount = (get().items.find((i) => i.id === itemId)?.wearCount ?? 0) + 1
        set((s) => ({
          items: s.items.map((i) => (i.id === itemId ? { ...i, wearCount: i.wearCount + 1, lastWornAt: now } : i)),
          wearLog: priorEntry
            ? s.wearLog.map((w) => (w === priorEntry ? { ...w, count: w.count + 1 } : w))
            : [...s.wearLog, { itemId, month, count: 1 }],
        }))
        if (isBackendEnabled) {
          backend.updateItemAfterWear(itemId, newWearCount, now).catch((e) => report('logWear:item', e))
          backend.bumpWearLog(itemId, month, priorEntry?.count ?? 0).catch((e) => report('logWear:wearLog', e))
        }
      },
      toggleLendable: (itemId) => {
        const item = get().items.find((i) => i.id === itemId)
        if (!item || item.isPrivate) return // private items can't be lent — nobody else can see them
        const next = !item.lendable
        set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, lendable: next } : i)) }))
        if (isBackendEnabled) backend.updateItemLendable(itemId, next).catch((e) => report('toggleLendable', e))
      },
      setItemPrivate: (itemId, isPrivate) => {
        set((s) => ({
          items: s.items.map((i) => (i.id === itemId ? { ...i, isPrivate, lendable: isPrivate ? false : i.lendable } : i)),
        }))
        if (isBackendEnabled) backend.updateItemPrivacy(itemId, isPrivate).catch((e) => report('setItemPrivate', e))
      },
      uploadItemImage: async (itemId, file) => {
        const previewUrl = URL.createObjectURL(file)
        set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, imageUrl: previewUrl } : i)) }))
        if (!isBackendEnabled) return
        try {
          const ownerId = get().authUserId!
          const url = await backend.uploadItemPhoto(ownerId, itemId, file)
          await backend.updateItemImage(itemId, url)
          set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, imageUrl: url } : i)) }))
        } catch (e) {
          report('uploadItemImage', e)
        }
      },

      sendBorrowRequest: (input) => {
        const item = get().items.find((i) => i.id === input.itemId)
        if (!item) return
        const requesterId = get().authUserId ?? ME
        const newId = id()
        const req: BorrowRequest = {
          id: newId,
          itemId: input.itemId,
          ownerId: item.ownerId,
          requesterId,
          status: 'waiting',
          whenNeeded: input.whenNeeded,
          note: input.note,
          createdAt: new Date().toISOString(),
          dateRangeLabel: input.whenNeeded,
        }
        set((s) => ({ borrowRequests: [req, ...s.borrowRequests] }))
        if (isBackendEnabled) {
          backend
            .insertBorrowRequest(newId, { itemId: input.itemId, ownerId: item.ownerId, requesterId, whenNeeded: input.whenNeeded, note: input.note })
            .catch((e) => report('sendBorrowRequest', e))
        }
      },
      respondToBorrowRequest: (requestId, decision) => {
        const item = get().items.find((i) => i.id === get().borrowRequests.find((r) => r.id === requestId)?.itemId)
        const nextTimesLent = decision === 'approved' && item ? item.timesLent + 1 : item?.timesLent
        set((s) => ({
          borrowRequests: s.borrowRequests.map((r) => (r.id === requestId ? { ...r, status: decision } : r)),
          items:
            decision === 'approved'
              ? s.items.map((i) => (i.id === item?.id ? { ...i, timesLent: i.timesLent + 1 } : i))
              : s.items,
        }))
        if (isBackendEnabled) {
          backend.updateBorrowRequestStatus(requestId, decision).catch((e) => report('respondToBorrowRequest', e))
          if (decision === 'approved' && item && nextTimesLent !== undefined) {
            backend.incrementTimesLent(item.id, nextTimesLent).catch((e) => report('respondToBorrowRequest:timesLent', e))
          }
        }
      },
      markReturned: (requestId) => {
        set((s) => ({
          borrowRequests: s.borrowRequests.map((r) => (r.id === requestId ? { ...r, status: 'returned' } : r)),
        }))
        if (isBackendEnabled) backend.updateBorrowRequestStatus(requestId, 'returned').catch((e) => report('markReturned', e))
      },

      startFitCheck: (input) => {
        const newId = id()
        const me = get().authUserId ?? ME
        const memberIds = isBackendEnabled ? [me, ...get().people.map((p) => p.id)] : [me, 'jules', 'amara', 'tessa', 'priya']
        // Public fit checks are a public-profile feature (the DB enforces it too).
        const audience: ChatAudience = get().user.isPublic ? input.audience : 'friends'
        const optionA = { id: id(), label: 'Option A', itemIds: input.optionAItemIds, votes: 0 }
        const optionB = { id: id(), label: 'Option B', itemIds: input.optionBItemIds, votes: 0 }
        const chat: GroupChat = {
          id: newId,
          title: input.eventName,
          eventName: input.eventName,
          location: input.location,
          eventTime: input.eventTime,
          memberIds,
          createdBy: me,
          audience,
          status: 'voting',
          options: [optionA, optionB],
          comments: [],
          decidedOptionId: null,
          votingClosesLabel: 'midnight',
          lastMessagePreview: 'You started a fit check',
          lastMessageAt: new Date().toISOString(),
        }
        set((s) => ({ chats: [chat, ...s.chats] }))
        if (isBackendEnabled) {
          backend
            .insertChat({
              id: newId,
              title: chat.title,
              eventName: input.eventName,
              location: input.location,
              eventTime: input.eventTime,
              createdBy: me,
              audience,
              memberIds,
              options: [optionA, optionB],
            })
            .catch((e) => report('startFitCheck', e))
        }
        return newId
      },
      castVote: (chatId, optionId) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? { ...c, options: c.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) }
              : c,
          ),
        }))
        if (isBackendEnabled) {
          const userId = get().authUserId
          if (userId) backend.castVoteRemote(chatId, userId, optionId).catch((e) => report('castVote', e))
        }
      },
      addComment: (chatId, text) => {
        const newId = id()
        const authorId = get().authUserId ?? ME
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  comments: [...c.comments, { id: newId, authorId, text, createdAt: new Date().toISOString() }],
                  lastMessagePreview: `You: ${text}`,
                  lastMessageAt: new Date().toISOString(),
                }
              : c,
          ),
        }))
        if (isBackendEnabled) {
          backend.insertChatComment(newId, chatId, authorId, text).catch((e) => report('addComment', e))
        }
      },
      decideChat: (chatId) => {
        const chat = get().chats.find((c) => c.id === chatId)
        if (!chat) return
        const winner = chat.options.reduce((a, b) => (b.votes > a.votes ? b : a))
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, status: 'decided', decidedOptionId: winner.id, votingClosesLabel: 'closed' } : c,
          ),
        }))
        if (isBackendEnabled) backend.updateChatDecided(chatId, winner.id).catch((e) => report('decideChat', e))
      },
      subscribeToChatRealtime: (chatId) => {
        if (!isBackendEnabled) return () => {}
        const refetch = async () => {
          try {
            const fresh = await backend.fetchChatDetail(chatId)
            if (!fresh) return
            const upsert = (list: GroupChat[]) =>
              list.some((c) => c.id === chatId) ? list.map((c) => (c.id === chatId ? fresh : c)) : [fresh, ...list]
            const isMember = fresh.memberIds.includes(get().authUserId ?? '')
            set((s) => (isMember ? { chats: upsert(s.chats) } : { publicChats: upsert(s.publicChats) }))
          } catch (err) {
            report('subscribeToChatRealtime:refetch', err)
          }
        }
        refetch()
        return backend.subscribeToChat(chatId, refetch)
      },
    }),
    {
      name: 'blueprint-mvp-store',
      // v2: location/community/privacy fields (0007). Older local-demo
      // snapshots don't have them, so they're dropped for fresh seed data.
      version: 2,
      migrate: () => ({}) as BlueprintState,
      // When a real backend is configured, auth + hydration are the source
      // of truth on every load — don't let a stale localStorage snapshot
      // from a previous session (or the local demo data) shadow it.
      partialize: (s): Partial<BlueprintState> => (isBackendEnabled ? {} : s),
    },
  ),
)
