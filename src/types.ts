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
}

export interface Person {
  id: string
  name: string
  handle: string
  school: string
  classYear: string
  distanceLabel: string
  isPublic: boolean
}

export type BorrowStatus = 'waiting' | 'approved' | 'declined' | 'returned'

export interface BorrowRequest {
  id: string
  itemId: string
  ownerId: string
  requesterId: string
  status: BorrowStatus
  whenNeeded: 'Tonight' | 'This Weekend' | 'Next Week'
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
  isPublic: boolean
  isPremium: boolean
  hasCompletedOnboarding: boolean
  hasConnectedShop: boolean
  hasConnectedGmail: boolean
}
