import type {
  BorrowRequest,
  ClothingItem,
  CurrentUser,
  FitCheck,
  FriendGroup,
  Person,
  WearLogEntry,
} from '../types'
import { COLUMBIA_BARNARD } from './communities'

export const ME = 'anna'

export const seedUser: CurrentUser = {
  id: ME,
  name: 'Anna Yang',
  handle: '@xoxoannayang',
  bio: 'thrift > fast fashion. will lend you my blazer.',
  school: 'Columbia University',
  communityId: COLUMBIA_BARNARD,
  buildingId: 'john-jay',
  offCampus: false,
  phone: '',
  offCampusAddress: null,
  schoolEmail: 'ay2401@columbia.edu',
  pendingSchoolEmail: null,
  avatarUrl: null,
  isPublic: true,
  isPremium: false,
  hasCompletedOnboarding: false,
  hasConnectedShop: false,
  hasConnectedGmail: false,
}

export const seedPeople: Person[] = [
  { id: 'priya', name: 'Priya R.', handle: '@priyar', bio: 'lab rat, cardigan collector', school: 'Columbia University', communityId: COLUMBIA_BARNARD, buildingId: 'john-jay', offCampus: false, isPublic: true, avatarUrl: null },
  { id: 'tessa', name: 'Tessa L.', handle: '@tessal', bio: '', school: 'Barnard College', communityId: COLUMBIA_BARNARD, buildingId: 'sulzberger', offCampus: false, isPublic: false, avatarUrl: null },
  { id: 'amara', name: 'Amara O.', handle: '@amarao', bio: 'renting is a scam', school: 'Columbia University', communityId: COLUMBIA_BARNARD, buildingId: 'plimpton', offCampus: false, isPublic: true, avatarUrl: null },
  { id: 'jules', name: 'Jules T.', handle: '@julest', bio: 'gigs most weekends', school: 'Columbia University', communityId: COLUMBIA_BARNARD, buildingId: null, offCampus: true, isPublic: true, avatarUrl: null },
]

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const seedItems: ClothingItem[] = [
  // Anna's closet
  { id: 'item-tee', ownerId: ME, name: 'Boxy White Tee', brand: 'Uniqlo U', category: 'Tops', size: 'S', color: 'White', priceCents: 2500, wearCount: 41, lastWornAt: daysAgo(1), lendable: true, addedAt: daysAgo(240), source: 'manual', timesLent: 2, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-denim', ownerId: ME, name: 'Wide-Leg Dark Denim', brand: "Levi's 501", category: 'Bottoms', size: '28', color: 'Indigo', priceCents: 9800, wearCount: 38, lastWornAt: daysAgo(3), lendable: true, addedAt: daysAgo(210), source: 'shop', timesLent: 1, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-sneakers', ownerId: ME, name: 'Court Sneakers', brand: 'Adidas Stan Smith', category: 'Shoes', size: '8', color: 'White', priceCents: 9000, wearCount: 52, lastWornAt: daysAgo(0), lendable: false, addedAt: daysAgo(300), source: 'manual', timesLent: 0, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-cap', ownerId: ME, name: 'Trucker Cap', brand: 'American Needle', category: 'Accessories', size: 'One size', color: 'Navy', priceCents: 3200, wearCount: 46, lastWornAt: daysAgo(2), lendable: true, addedAt: daysAgo(260), source: 'manual', timesLent: 3, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-halter', ownerId: ME, name: 'Halter Knit + Floral Mini', brand: 'Reformation', category: 'Dresses', size: 'S', color: 'Black Floral', priceCents: 18800, wearCount: 6, lastWornAt: daysAgo(14), lendable: true, addedAt: daysAgo(90), source: 'gmail', timesLent: 1, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-stilettos', ownerId: ME, name: 'Floral Stilettos', brand: 'Jeffrey Campbell', category: 'Shoes', size: '8', color: 'Floral', priceCents: 11000, wearCount: 6, lastWornAt: daysAgo(77), lendable: true, addedAt: daysAgo(200), source: 'manual', timesLent: 0, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-slipdress', ownerId: ME, name: 'Satin Slip Dress', brand: 'Motel Rocks', category: 'Dresses', size: 'S', color: 'Champagne', priceCents: 6900, wearCount: 9, lastWornAt: daysAgo(42), lendable: true, addedAt: daysAgo(180), source: 'manual', timesLent: 1, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-blazer', ownerId: ME, name: 'Oversized Blazer', brand: 'Zara', category: 'Outerwear', size: 'M', color: 'Black', priceCents: 8900, wearCount: 12, lastWornAt: daysAgo(63), lendable: true, addedAt: daysAgo(150), source: 'gmail', timesLent: 2, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-joggers', ownerId: ME, name: 'Cinched Joggers', brand: 'Aritzia', category: 'Bottoms', size: 'S', color: 'Grey', priceCents: 6800, wearCount: 3, lastWornAt: daysAgo(5), lendable: false, addedAt: daysAgo(20), source: 'shop', timesLent: 0, alwaysReturned: true, imageUrl: null, isPrivate: true },

  // Friends' closets (lendable pool)
  { id: 'item-docboots', ownerId: 'tessa', name: 'Doc Boots', brand: 'Dr. Martens 1460', category: 'Shoes', size: '8', color: 'Black', priceCents: 17000, wearCount: 30, lastWornAt: daysAgo(2), lendable: true, addedAt: daysAgo(400), source: 'manual', timesLent: 5, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-trench', ownerId: 'amara', name: 'Cropped Trench', brand: 'Aritzia', category: 'Outerwear', size: 'S', color: 'Camel', priceCents: 22000, wearCount: 18, lastWornAt: daysAgo(6), lendable: true, addedAt: daysAgo(320), source: 'manual', timesLent: 3, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-scarf', ownerId: 'jules', name: 'Silk Scarf', brand: 'Vintage Hermès', category: 'Accessories', size: '—', color: 'Multi', priceCents: 45000, wearCount: 9, lastWornAt: daysAgo(30), lendable: true, addedAt: daysAgo(500), source: 'manual', timesLent: 4, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-cardigan', ownerId: 'priya', name: 'Oat Cardigan', brand: 'COS', category: 'Tops', size: 'M', color: 'Oat', priceCents: 9000, wearCount: 21, lastWornAt: daysAgo(4), lendable: true, addedAt: daysAgo(280), source: 'manual', timesLent: 5, alwaysReturned: true, imageUrl: null, isPrivate: false },
  { id: 'item-satinslip', ownerId: 'jules', name: 'Red Satin Slip', brand: 'Réalisation Par', category: 'Dresses', size: 'S', color: 'Red', priceCents: 24000, wearCount: 7, lastWornAt: daysAgo(20), lendable: true, addedAt: daysAgo(210), source: 'manual', timesLent: 2, alwaysReturned: true, imageUrl: null, isPrivate: false },
]

// last 6 months of wear-log history, seeded so the chart + impact numbers feel real
const monthLabel = (offset: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const seedWearLog: WearLogEntry[] = [
  { itemId: 'item-tee', month: monthLabel(5), count: 55 },
  { itemId: 'item-tee', month: monthLabel(4), count: 58 },
  { itemId: 'item-tee', month: monthLabel(3), count: 60 },
  { itemId: 'item-tee', month: monthLabel(2), count: 56 },
  { itemId: 'item-tee', month: monthLabel(1), count: 64 },
  { itemId: 'item-tee', month: monthLabel(0), count: 63 },
]

export const seedBorrowRequests: BorrowRequest[] = [
  { id: 'req-1', itemId: 'item-blazer', ownerId: ME, requesterId: 'jules', status: 'waiting', whenNeeded: 'This Weekend', note: 'gig at Baby’s All Right — it NEEDS the jacket', createdAt: daysAgo(1), dateRangeLabel: 'Fri → Sat' },
  { id: 'req-2', itemId: 'item-slipdress', ownerId: ME, requesterId: 'tessa', status: 'waiting', whenNeeded: 'Next Week', note: 'gallery opening, will steam + return Sunday', createdAt: daysAgo(0), dateRangeLabel: 'Next weekend' },
  { id: 'req-3', itemId: 'item-halter', ownerId: ME, requesterId: 'priya', status: 'waiting', whenNeeded: 'Tonight', note: 'the lab is freezing and this is the warmest thing on campus', createdAt: daysAgo(0), dateRangeLabel: 'Mon → Fri' },
  { id: 'req-4', itemId: 'item-joggers', ownerId: ME, requesterId: 'amara', status: 'returned', whenNeeded: 'This Weekend', note: 'returning clean Sunday', createdAt: daysAgo(10), dateRangeLabel: 'Last Mon → Wed' },
]

const hoursFromNow = (n: number) => new Date(Date.now() + n * 3600_000).toISOString()

export const seedFriendGroups: FriendGroup[] = [
  { id: 'group-sat-night', name: 'Sat Night Crew', memberIds: ['jules', 'amara', 'tessa', 'priya'] },
  { id: 'group-roomies', name: '', memberIds: ['priya', 'jules'] },
]

export const seedFitChecks: FitCheck[] = [
  {
    id: 'fc-warehouse',
    eventName: 'Warehouse Party',
    vibe: 'Grunge but make it going-out',
    weather: 'Outdoor · Cold',
    endsAt: hoursFromNow(3),
    memberIds: [ME, 'jules', 'amara', 'tessa', 'priya'],
    createdBy: ME,
    audience: 'group',
    groupId: 'group-sat-night',
    mode: 'vote',
    status: 'voting',
    options: [
      { id: 'opt-a', label: 'Option A', itemIds: ['item-halter', 'item-docboots'], imageUrl: null, votes: 3 },
      { id: 'opt-b', label: 'Option B', itemIds: ['item-slipdress', 'item-blazer'], imageUrl: null, votes: 2 },
      { id: 'opt-c', label: 'Option C', itemIds: ['item-tee', 'item-denim', 'item-sneakers'], imageUrl: null, votes: 0 },
    ],
    suggestions: [],
    comments: [
      { id: 'c1', authorId: 'jules', text: 'A. the boots are the whole outfit', createdAt: daysAgo(0) },
      { id: 'c2', authorId: 'amara', text: 'B if it ends up raining', createdAt: daysAgo(0) },
    ],
    decidedOptionId: null,
    decidedSuggestionId: null,
    myVoteOptionId: null,
    lastMessagePreview: 'Amara: B if it ends up raining',
    lastMessageAt: daysAgo(0),
  },
  {
    id: 'fc-brunch',
    eventName: 'Sunday Brunch',
    vibe: 'Effortless, nothing too loud',
    weather: 'Outdoor',
    endsAt: hoursFromNow(20),
    memberIds: [ME],
    createdBy: ME,
    audience: 'friends',
    groupId: null,
    mode: 'ideas',
    status: 'voting',
    options: [],
    suggestions: [
      { id: 'sug-1', authorId: 'priya', itemIds: ['item-tee', 'item-denim'], lendItemIds: ['item-cardigan'], note: 'your tee + denim, and borrow my oat cardigan', createdAt: daysAgo(0) },
      { id: 'sug-2', authorId: 'tessa', itemIds: ['item-slipdress'], lendItemIds: [], note: 'slip dress, sneakers, done', createdAt: daysAgo(0) },
    ],
    comments: [],
    decidedOptionId: null,
    decidedSuggestionId: null,
    myVoteOptionId: null,
    lastMessagePreview: 'Tessa suggested a look',
    lastMessageAt: daysAgo(0),
  },
  {
    id: 'fc-formal',
    eventName: 'Spring Formal',
    vibe: 'Black tie optional',
    weather: 'Indoor',
    endsAt: daysAgo(1),
    memberIds: [ME, 'tessa', 'amara'],
    createdBy: ME,
    audience: 'friends',
    groupId: null,
    mode: 'vote',
    status: 'decided',
    options: [
      { id: 'opt-d', label: 'Option A', itemIds: ['item-blazer', 'item-slipdress'], imageUrl: null, votes: 6 },
      { id: 'opt-e', label: 'Option B', itemIds: ['item-docboots', 'item-halter'], imageUrl: null, votes: 1 },
    ],
    suggestions: [],
    comments: [{ id: 'c3', authorId: 'amara', text: 'renting is a scam when Tessa owns it', createdAt: daysAgo(1) }],
    decidedOptionId: 'opt-d',
    decidedSuggestionId: null,
    myVoteOptionId: 'opt-d',
    lastMessagePreview: 'Amara: renting is a scam when Tessa owns it',
    lastMessageAt: daysAgo(1),
  },
  {
    id: 'fc-priya-career-fair',
    eventName: 'Career Fair',
    vibe: 'Business casual, but still me',
    weather: 'Indoor · Cold',
    endsAt: hoursFromNow(10),
    memberIds: ['priya'],
    createdBy: 'priya',
    audience: 'friends',
    groupId: null,
    mode: 'ideas',
    status: 'voting',
    options: [],
    suggestions: [],
    comments: [{ id: 'c5', authorId: 'priya', text: 'I own nothing professional help', createdAt: daysAgo(0) }],
    decidedOptionId: null,
    decidedSuggestionId: null,
    myVoteOptionId: null,
    lastMessagePreview: 'Priya: I own nothing professional help',
    lastMessageAt: daysAgo(0),
  },
  {
    id: 'fc-amara-gallery',
    eventName: 'Gallery Opening',
    vibe: 'Artsy, monochrome',
    weather: 'Indoor',
    endsAt: hoursFromNow(6),
    memberIds: ['amara'],
    createdBy: 'amara',
    audience: 'friends',
    groupId: null,
    mode: 'vote',
    status: 'voting',
    options: [
      { id: 'opt-f', label: 'Option A', itemIds: ['item-trench'], imageUrl: null, votes: 2 },
      { id: 'opt-g', label: 'Option B', itemIds: ['item-scarf'], imageUrl: null, votes: 1 },
    ],
    suggestions: [],
    comments: [],
    decidedOptionId: null,
    decidedSuggestionId: null,
    myVoteOptionId: null,
    lastMessagePreview: 'Amara started a fit check',
    lastMessageAt: daysAgo(0),
  },
]

// Off-campus friends have no shared coordinates (their address is private
// to them), so in the demo their distance is just stated, the way the
// friend_distances() RPC would return it.
export const seedOffCampusDistances: Record<string, number> = { jules: 1100 }
