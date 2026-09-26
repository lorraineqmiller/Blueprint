import type {
  BorrowRequest,
  ClothingItem,
  CurrentUser,
  GroupChat,
  Person,
  WearLogEntry,
} from '../types'

export const ME = 'anna'

export const seedUser: CurrentUser = {
  id: ME,
  name: 'Anna Yang',
  handle: '@xoxoannayang',
  school: 'Columbia University',
  classYear: 'Class of 2028',
  building: 'John Jay Hall',
  floor: '10',
  avatarUrl: null,
  isPublic: true,
  isPremium: false,
  hasCompletedOnboarding: false,
  hasConnectedShop: false,
  hasConnectedGmail: false,
}

export const seedPeople: Person[] = [
  { id: 'priya', name: 'Priya R.', handle: '@priyar', school: 'Columbia University', classYear: 'Class of 2027', building: 'John Jay Hall', floor: '10', isPublic: true, avatarUrl: null },
  { id: 'tessa', name: 'Tessa L.', handle: '@tessal', school: 'Barnard College', classYear: 'Class of 2028', building: 'Sulzberger Hall', floor: '7', isPublic: true, avatarUrl: null },
  { id: 'amara', name: 'Amara O.', handle: '@amarao', school: 'Columbia University', classYear: 'Class of 2026', building: 'Plimpton Hall', floor: '4', isPublic: true, avatarUrl: null },
  { id: 'jules', name: 'Jules T.', handle: '@julest', school: 'Columbia University', classYear: 'Class of 2028', building: 'John Jay Hall', floor: '3', isPublic: true, avatarUrl: null },
]

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const seedItems: ClothingItem[] = [
  // Anna's closet
  { id: 'item-tee', ownerId: ME, name: 'Boxy White Tee', brand: 'Uniqlo U', category: 'Tops', size: 'S', color: 'White', priceCents: 2500, wearCount: 41, lastWornAt: daysAgo(1), lendable: true, addedAt: daysAgo(240), source: 'manual', timesLent: 2, alwaysReturned: true, imageUrl: null },
  { id: 'item-denim', ownerId: ME, name: 'Wide-Leg Dark Denim', brand: "Levi's 501", category: 'Bottoms', size: '28', color: 'Indigo', priceCents: 9800, wearCount: 38, lastWornAt: daysAgo(3), lendable: true, addedAt: daysAgo(210), source: 'shop', timesLent: 1, alwaysReturned: true, imageUrl: null },
  { id: 'item-sneakers', ownerId: ME, name: 'Court Sneakers', brand: 'Adidas Stan Smith', category: 'Shoes', size: '8', color: 'White', priceCents: 9000, wearCount: 52, lastWornAt: daysAgo(0), lendable: false, addedAt: daysAgo(300), source: 'manual', timesLent: 0, alwaysReturned: true, imageUrl: null },
  { id: 'item-cap', ownerId: ME, name: 'Trucker Cap', brand: 'American Needle', category: 'Accessories', size: 'One size', color: 'Navy', priceCents: 3200, wearCount: 46, lastWornAt: daysAgo(2), lendable: true, addedAt: daysAgo(260), source: 'manual', timesLent: 3, alwaysReturned: true, imageUrl: null },
  { id: 'item-halter', ownerId: ME, name: 'Halter Knit + Floral Mini', brand: 'Reformation', category: 'Dresses', size: 'S', color: 'Black Floral', priceCents: 18800, wearCount: 6, lastWornAt: daysAgo(14), lendable: true, addedAt: daysAgo(90), source: 'gmail', timesLent: 1, alwaysReturned: true, imageUrl: null },
  { id: 'item-stilettos', ownerId: ME, name: 'Floral Stilettos', brand: 'Jeffrey Campbell', category: 'Shoes', size: '8', color: 'Floral', priceCents: 11000, wearCount: 6, lastWornAt: daysAgo(77), lendable: true, addedAt: daysAgo(200), source: 'manual', timesLent: 0, alwaysReturned: true, imageUrl: null },
  { id: 'item-slipdress', ownerId: ME, name: 'Satin Slip Dress', brand: 'Motel Rocks', category: 'Dresses', size: 'S', color: 'Champagne', priceCents: 6900, wearCount: 9, lastWornAt: daysAgo(42), lendable: true, addedAt: daysAgo(180), source: 'manual', timesLent: 1, alwaysReturned: true, imageUrl: null },
  { id: 'item-blazer', ownerId: ME, name: 'Oversized Blazer', brand: 'Zara', category: 'Outerwear', size: 'M', color: 'Black', priceCents: 8900, wearCount: 12, lastWornAt: daysAgo(63), lendable: true, addedAt: daysAgo(150), source: 'gmail', timesLent: 2, alwaysReturned: true, imageUrl: null },
  { id: 'item-joggers', ownerId: ME, name: 'Cinched Joggers', brand: 'Aritzia', category: 'Bottoms', size: 'S', color: 'Grey', priceCents: 6800, wearCount: 3, lastWornAt: daysAgo(5), lendable: false, addedAt: daysAgo(20), source: 'shop', timesLent: 0, alwaysReturned: true, imageUrl: null },

  // Friends' closets (lendable pool)
  { id: 'item-docboots', ownerId: 'tessa', name: 'Doc Boots', brand: 'Dr. Martens 1460', category: 'Shoes', size: '8', color: 'Black', priceCents: 17000, wearCount: 30, lastWornAt: daysAgo(2), lendable: true, addedAt: daysAgo(400), source: 'manual', timesLent: 5, alwaysReturned: true, imageUrl: null },
  { id: 'item-trench', ownerId: 'amara', name: 'Cropped Trench', brand: 'Aritzia', category: 'Outerwear', size: 'S', color: 'Camel', priceCents: 22000, wearCount: 18, lastWornAt: daysAgo(6), lendable: true, addedAt: daysAgo(320), source: 'manual', timesLent: 3, alwaysReturned: true, imageUrl: null },
  { id: 'item-scarf', ownerId: 'jules', name: 'Silk Scarf', brand: 'Vintage Hermès', category: 'Accessories', size: '—', color: 'Multi', priceCents: 45000, wearCount: 9, lastWornAt: daysAgo(30), lendable: true, addedAt: daysAgo(500), source: 'manual', timesLent: 4, alwaysReturned: true, imageUrl: null },
  { id: 'item-cardigan', ownerId: 'priya', name: 'Oat Cardigan', brand: 'COS', category: 'Tops', size: 'M', color: 'Oat', priceCents: 9000, wearCount: 21, lastWornAt: daysAgo(4), lendable: true, addedAt: daysAgo(280), source: 'manual', timesLent: 5, alwaysReturned: true, imageUrl: null },
  { id: 'item-satinslip', ownerId: 'jules', name: 'Red Satin Slip', brand: 'Réalisation Par', category: 'Dresses', size: 'S', color: 'Red', priceCents: 24000, wearCount: 7, lastWornAt: daysAgo(20), lendable: true, addedAt: daysAgo(210), source: 'manual', timesLent: 2, alwaysReturned: true, imageUrl: null },
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

export const seedChats: GroupChat[] = [
  {
    id: 'chat-sat-night',
    title: 'Sat Night Crew',
    eventName: 'Warehouse Party',
    location: 'Bushwick',
    eventTime: 'Fri 10pm',
    memberIds: [ME, 'jules', 'amara', 'tessa', 'priya'],
    status: 'voting',
    options: [
      { id: 'opt-a', label: 'Halter Knit + Floral Mini', itemIds: ['item-halter', 'item-docboots'], votes: 4 },
      { id: 'opt-b', label: 'Ruffle Top + Black Slip Skirt', itemIds: ['item-slipdress'], votes: 2, ownerNote: 'borrowed piece' },
    ],
    comments: [
      { id: 'c1', authorId: 'jules', text: 'option A. the jacket is the whole outfit', createdAt: daysAgo(0) },
      { id: 'c2', authorId: 'amara', text: "A but swap the sneakers for Tessa's boots", createdAt: daysAgo(0) },
    ],
    decidedOptionId: null,
    votingClosesLabel: '9:30',
    lastMessagePreview: 'Jules: option two is INSANE, wear the jacket',
    lastMessageAt: daysAgo(0),
  },
  {
    id: 'chat-formal-szn',
    title: 'Formal SZN',
    eventName: 'Spring Formal',
    location: 'The Bowery',
    eventTime: 'Fri',
    memberIds: [ME, 'tessa', 'amara'],
    status: 'decided',
    options: [
      { id: 'opt-c', label: 'Oversized Blazer + Slip Dress', itemIds: ['item-blazer', 'item-slipdress'], votes: 6 },
      { id: 'opt-d', label: "Borrowed Doc Boots Look", itemIds: ['item-docboots'], votes: 1 },
    ],
    comments: [{ id: 'c3', authorId: 'amara', text: 'renting is a scam when Tessa owns it', createdAt: daysAgo(1) }],
    decidedOptionId: 'opt-c',
    votingClosesLabel: 'closed',
    lastMessagePreview: 'Amara: renting is a scam when Tessa owns it',
    lastMessageAt: daysAgo(1),
  },
  {
    id: 'chat-brunch-council',
    title: 'Brunch Council',
    eventName: 'Graduation Brunch',
    location: 'Campus',
    eventTime: 'Sun 11am',
    memberIds: [ME, 'priya', 'jules'],
    status: 'decided',
    options: [{ id: 'opt-e', label: 'Oat Cardigan Look', itemIds: ['item-cardigan'], votes: 5 }],
    comments: [{ id: 'c4', authorId: 'priya', text: 'wear the oat cardigan, it’s cold', createdAt: daysAgo(3) }],
    decidedOptionId: 'opt-e',
    votingClosesLabel: 'closed',
    lastMessagePreview: 'Priya: wear the oat cardigan, it’s cold',
    lastMessageAt: daysAgo(3),
  },
]
