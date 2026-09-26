export type Category = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Shoes' | 'Accessories'

export interface ClothingItem {
  id: string
  ownerId: string
  name: string
  brand: string
  category: Category
  size: string
  color: string
  priceCents: number
  wearCount: number
  lastWornAt: string | null // ISO date
  lendable: boolean
  addedAt: string
  source: 'manual' | 'shop' | 'gmail'
  timesLent: number
  alwaysReturned: boolean
  imageUrl: string | null
}

export interface Person {
  id: string
  name: string
  handle: string
  school: string
  classYear: string
  building: string // e.g. "Sulzberger Hall" — self-reported, not GPS
  floor: string // e.g. "7"
  isPublic: boolean
  avatarUrl: string | null
}

export type BorrowStatus = 'waiting' | 'approved' | 'declined' | 'returned'

export interface BorrowRequest {
  id: string
  itemId: string
  ownerId: string
  requesterId: string
  status: BorrowStatus
  whenNeeded: string // preset label ("Tonight") or a formatted custom date
  note: string
  createdAt: string
  dateRangeLabel: string
}

export interface VoteOption {
  id: string
  label: string
  itemIds: string[]
  votes: number
  ownerNote?: string
}

export interface ChatComment {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export type ChatStatus = 'voting' | 'decided'

export interface GroupChat {
  id: string
  title: string
  eventName: string
  location: string
  eventTime: string
  memberIds: string[]
  status: ChatStatus
  options: VoteOption[]
  comments: ChatComment[]
  decidedOptionId: string | null
  votingClosesLabel: string
  lastMessagePreview: string
  lastMessageAt: string
}

export interface WearLogEntry {
  itemId: string
  month: string // 'YYYY-MM'
  count: number
}

export interface CurrentUser {
  id: string
  name: string
  handle: string
  school: string
  classYear: string
  building: string
  floor: string
  avatarUrl: string | null
  isPublic: boolean
  isPremium: boolean
  hasCompletedOnboarding: boolean
  hasConnectedShop: boolean
  hasConnectedGmail: boolean
}
