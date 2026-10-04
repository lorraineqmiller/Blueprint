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
  isPrivate: boolean // only the owner can see it; never lendable
}

// Where someone lives, at building granularity. Friends see this; nobody
// sees an off-campus address except its owner.
export interface Location {
  buildingId: string | null // a row in BUILDINGS / the buildings table
  offCampus: boolean
}

export interface Person extends Location {
  id: string
  name: string
  handle: string
  bio: string
  school: string // set only by verifying a school email; '' otherwise
  communityId: string | null
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

// 'public' is only available to public profiles — anyone signed in can
// view and vote. 'friends' is the creator's friends only.
export type ChatAudience = 'friends' | 'public'

export interface GroupChat {
  id: string
  title: string
  eventName: string
  location: string
  eventTime: string
  memberIds: string[]
  createdBy: string
  audience: ChatAudience
  // Names for everyone involved, so a public fit check from a non-friend
  // can still label its comments. Falls back to the friends list if absent.
  participants?: { id: string; name: string; avatarUrl: string | null }[]
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

export interface OffCampusAddress {
  address: string
  lat: number
  lng: number
}

export interface CurrentUser extends Location {
  id: string
  name: string
  handle: string
  bio: string
  school: string
  communityId: string | null
  // Private to the user — never on another person's Person record.
  phone: string
  offCampusAddress: OffCampusAddress | null
  schoolEmail: string | null // verified school email
  pendingSchoolEmail: string | null // code sent, not yet entered
  avatarUrl: string | null
  isPublic: boolean
  isPremium: boolean
  hasCompletedOnboarding: boolean
  hasConnectedShop: boolean
  hasConnectedGmail: boolean
}
