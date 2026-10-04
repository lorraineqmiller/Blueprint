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
  label: string // 'Option A'..'Option D'
  itemIds: string[] // pieces from the closet (yours, or a friend's you'd borrow)
  imageUrl: string | null // an uploaded fit pic / mirror selfie
  votes: number
}

// Ideas mode: a friend's suggested look. itemIds come from the asker's
// closet; lendItemIds are pieces from the suggester's own closet they're
// offering to lend for it.
export interface FitSuggestion {
  id: string
  authorId: string
  itemIds: string[]
  lendItemIds: string[]
  note: string
  createdAt: string
}

export interface ChatComment {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export type FitCheckStatus = 'voting' | 'decided'

// community — your verified school community (public profiles only)
// friends   — all your friends
// group     — one of your friend groups
export type FitCheckAudience = 'community' | 'friends' | 'group'

// vote  — up to 4 options to vote on
// ideas — no options; friends suggest looks from your closet (and theirs)
export type FitCheckMode = 'vote' | 'ideas'

export interface FitCheck {
  id: string
  eventName: string
  vibe: string // dress code / theme / vibe
  weather: string
  endsAt: string | null // ISO; voting and suggestions close on their own
  memberIds: string[]
  createdBy: string
  audience: FitCheckAudience
  groupId: string | null
  mode: FitCheckMode
  // Names for everyone involved, so a community fit check from a
  // non-friend can still label its comments and suggestions.
  participants?: { id: string; name: string; avatarUrl: string | null }[]
  status: FitCheckStatus
  options: VoteOption[]
  suggestions: FitSuggestion[]
  comments: ChatComment[]
  decidedOptionId: string | null
  decidedSuggestionId: string | null
  myVoteOptionId: string | null
  lastMessagePreview: string
  lastMessageAt: string
}

// A list of friends you regularly ask for outfit advice. Only you can see
// your groups. An unnamed group is shown by its members' names.
export interface FriendGroup {
  id: string
  name: string
  memberIds: string[]
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
