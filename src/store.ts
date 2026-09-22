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

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

interface BlueprintState {
  user: CurrentUser
  people: Person[]
  items: ClothingItem[]
  borrowRequests: BorrowRequest[]
  chats: GroupChat[]
  wearLog: WearLogEntry[]

  // onboarding
  completeOnboarding: () => void
  setPublic: (isPublic: boolean) => void
  connectShop: () => void
  connectGmail: () => void
  setProfile: (patch: Partial<Pick<CurrentUser, 'name' | 'handle' | 'school' | 'classYear'>>) => void
  upgradeToPlus: () => void

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

  // borrowing
  sendBorrowRequest: (input: {
    itemId: string
    whenNeeded: BorrowRequest['whenNeeded']
    note: string
  }) => void
  respondToBorrowRequest: (requestId: string, decision: 'approved' | 'declined') => void
  markReturned: (requestId: string) => void

  // chats / fit checks
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
}

export const useStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      user: seedUser,
      people: seedPeople,
      items: seedItems,
      borrowRequests: seedBorrowRequests,
      chats: seedChats,
      wearLog: seedWearLog,

      completeOnboarding: () => set((s) => ({ user: { ...s.user, hasCompletedOnboarding: true } })),
      setPublic: (isPublic) => set((s) => ({ user: { ...s.user, isPublic } })),
      connectShop: () => {
        set((s) => ({ user: { ...s.user, hasConnectedShop: true } }))
        const now = new Date().toISOString()
        const imported: ClothingItem = {
          id: id('item'),
          ownerId: ME,
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
        }
        set((s) => ({ items: [imported, ...s.items] }))
      },
      connectGmail: () => {
        set((s) => ({ user: { ...s.user, hasConnectedGmail: true } }))
        const now = new Date().toISOString()
        const imported: ClothingItem = {
          id: id('item'),
          ownerId: ME,
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
        }
        set((s) => ({ items: [imported, ...s.items] }))
      },
      setProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      upgradeToPlus: () => set((s) => ({ user: { ...s.user, isPremium: true } })),

      addItem: (input) => {
        const newId = id('item')
        const item: ClothingItem = {
          id: newId,
          ownerId: ME,
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
        }
        set((s) => ({ items: [item, ...s.items] }))
        return newId
      },
      logWear: (itemId) => {
        const month = new Date().toISOString().slice(0, 7)
        set((s) => ({
          items: s.items.map((i) =>
            i.id === itemId ? { ...i, wearCount: i.wearCount + 1, lastWornAt: new Date().toISOString() } : i,
          ),
          wearLog: (() => {
            const existing = s.wearLog.find((w) => w.itemId === itemId && w.month === month)
            if (existing) {
              return s.wearLog.map((w) => (w === existing ? { ...w, count: w.count + 1 } : w))
            }
            return [...s.wearLog, { itemId, month, count: 1 }]
          })(),
        }))
      },
      toggleLendable: (itemId) =>
        set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, lendable: !i.lendable } : i)) })),

      sendBorrowRequest: (input) => {
        const item = get().items.find((i) => i.id === input.itemId)
        if (!item) return
        const req: BorrowRequest = {
          id: id('req'),
          itemId: input.itemId,
          ownerId: item.ownerId,
          requesterId: ME,
          status: 'waiting',
          whenNeeded: input.whenNeeded,
          note: input.note,
          createdAt: new Date().toISOString(),
          dateRangeLabel: input.whenNeeded,
        }
        set((s) => ({ borrowRequests: [req, ...s.borrowRequests] }))
      },
      respondToBorrowRequest: (requestId, decision) =>
        set((s) => ({
          borrowRequests: s.borrowRequests.map((r) => (r.id === requestId ? { ...r, status: decision } : r)),
          items:
            decision === 'approved'
              ? s.items.map((i) =>
                  i.id === s.borrowRequests.find((r) => r.id === requestId)?.itemId
                    ? { ...i, timesLent: i.timesLent + 1 }
                    : i,
                )
              : s.items,
        })),
      markReturned: (requestId) =>
        set((s) => ({
          borrowRequests: s.borrowRequests.map((r) => (r.id === requestId ? { ...r, status: 'returned' } : r)),
        })),

      startFitCheck: (input) => {
        const newId = id('chat')
        const chat: GroupChat = {
          id: newId,
          title: input.eventName,
          eventName: input.eventName,
          location: input.location,
          eventTime: input.eventTime,
          memberIds: [ME, 'jules', 'amara', 'tessa', 'priya'],
          status: 'voting',
          options: [
            { id: id('opt'), label: 'Option A', itemIds: input.optionAItemIds, votes: 0 },
            { id: id('opt'), label: 'Option B', itemIds: input.optionBItemIds, votes: 0 },
          ],
          comments: [],
          decidedOptionId: null,
          votingClosesLabel: 'midnight',
          lastMessagePreview: 'You started a fit check',
          lastMessageAt: new Date().toISOString(),
        }
        set((s) => ({ chats: [chat, ...s.chats] }))
        return newId
      },
      castVote: (chatId, optionId) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? { ...c, options: c.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) }
              : c,
          ),
        })),
      addComment: (chatId, text) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  comments: [...c.comments, { id: id('c'), authorId: ME, text, createdAt: new Date().toISOString() }],
                  lastMessagePreview: `You: ${text}`,
                  lastMessageAt: new Date().toISOString(),
                }
              : c,
          ),
        })),
      decideChat: (chatId) =>
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c
            const winner = c.options.reduce((a, b) => (b.votes > a.votes ? b : a))
            return { ...c, status: 'decided', decidedOptionId: winner.id, votingClosesLabel: 'closed' }
          }),
        })),
    }),
    { name: 'blueprint-mvp-store' },
  ),
)
