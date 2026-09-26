import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BorrowRequest,
  Category,
  ClothingItem,
  CurrentUser,
  GroupChat,
  Person,
  WearLogEntry,
} from './types'
import { ME, seedBorrowRequests, seedChats, seedItems, seedPeople, seedUser, seedWearLog } from './data/seed'
import { isBackendEnabled } from './lib/supabaseClient'
import * as backend from './lib/backendApi'

function id() {
  return crypto.randomUUID()
}

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
  signUp: (input: { email: string; password: string; name: string; handle: string; school: string }) => Promise<void>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>

  user: CurrentUser
  people: Person[] // your accepted friends once a backend is connected
  items: ClothingItem[]
  borrowRequests: BorrowRequest[]
  chats: GroupChat[]
  wearLog: WearLogEntry[]

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
  setProfile: (patch: Partial<Pick<CurrentUser, 'name' | 'handle' | 'school' | 'classYear' | 'building' | 'floor'>>) => void
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
      wearLog: seedWearLog,

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
            const [user, myItems, discoverable, borrowRequests, chats, friends] = await Promise.all([
              backend.fetchProfile(userId),
              backend.fetchMyItems(userId),
              backend.fetchDiscoverableItems(userId),
              backend.fetchBorrowRequests(userId),
              backend.fetchMyChats(userId),
              backend.fetchFriends(userId),
            ])
            const items = [...myItems, ...discoverable]
            const wearLog = await backend.fetchWearLog(myItems.map((i) => i.id))
            set({
              user,
              items,
              wearLog,
              borrowRequests,
              chats,
              people: friends,
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
          await backend.signUp(input)
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
          .catch((e) => report('respondToFriendRequest', e))
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
          if (patch.school !== undefined) dbPatch.school = patch.school
          if (patch.classYear !== undefined) dbPatch.class_year = patch.classYear
          if (patch.building !== undefined) dbPatch.building = patch.building
          if (patch.floor !== undefined) dbPatch.floor = patch.floor
          backend.updateProfile(get().authUserId!, dbPatch).catch((e) => report('setProfile', e))
        }
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
        const next = !get().items.find((i) => i.id === itemId)?.lendable
        set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, lendable: !i.lendable } : i)) }))
        if (isBackendEnabled) backend.updateItemLendable(itemId, next).catch((e) => report('toggleLendable', e))
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
        const optionA = { id: id(), label: 'Option A', itemIds: input.optionAItemIds, votes: 0 }
        const optionB = { id: id(), label: 'Option B', itemIds: input.optionBItemIds, votes: 0 }
        const chat: GroupChat = {
          id: newId,
          title: input.eventName,
          eventName: input.eventName,
          location: input.location,
          eventTime: input.eventTime,
          memberIds,
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
            set((s) => ({
              chats: s.chats.some((c) => c.id === chatId) ? s.chats.map((c) => (c.id === chatId ? fresh : c)) : [fresh, ...s.chats],
            }))
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
      // When a real backend is configured, auth + hydration are the source
      // of truth on every load — don't let a stale localStorage snapshot
      // from a previous session (or the local demo data) shadow it.
      partialize: (s): Partial<BlueprintState> => (isBackendEnabled ? {} : s),
    },
  ),
)
