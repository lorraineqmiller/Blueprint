// Thin data-access layer over Supabase. Every function here assumes
// `isBackendEnabled` is true (the store only calls into this module in that
// case) and does the snake_case <-> camelCase mapping so the rest of the app
// keeps using the same shapes from src/types.ts regardless of where the data
// comes from.
import { supabase } from './supabaseClient'
import type { Building } from '../data/buildings'
import type {
  BorrowRequest,
  Category,
  ClothingItem,
  CurrentUser,
  FitCheck,
  FitCheckAudience,
  FitCheckMode,
  FriendGroup,
  Location,
  OffCampusAddress,
  Person,
  WearLogEntry,
} from '../types'

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

// ── auth ────────────────────────────────────────────────────────────────

// Any email works — school membership is a separate verification step
// (sendSchoolCode / verifySchoolCode below). Returns whether the account
// still needs its email confirmed before it can sign in (true when
// "Confirm email" is on in Supabase Auth settings).
export async function signUp(input: { email: string; password: string; name: string; handle: string }) {
  const { data, error } = await db().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, handle: input.handle }, emailRedirectTo: `${window.location.origin}/onboarding` },
  })
  if (error) throw error
  return { needsEmailConfirmation: !data.session }
}

// Security-definer RPC (0007) so it sees every profile, private ones
// included, even before there's a session.
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const { data, error } = await db().rpc('is_handle_available', { p_handle: handle })
  if (error) throw error
  return data as boolean
}

export async function signIn(input: { email: string; password: string }) {
  const { data, error } = await db().auth.signInWithPassword(input)
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await db().auth.signOut()
  if (error) throw error
}

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await db().auth.getSession()
  return data.session?.user.id ?? null
}

export function onAuthStateChange(cb: (userId: string | null) => void) {
  const { data } = db().auth.onAuthStateChange((_event, session) => cb(session?.user.id ?? null))
  return () => data.subscription.unsubscribe()
}

// ── mapping ─────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string
  name: string
  handle: string
  bio: string
  school: string
  community_id: string | null
  avatar_url: string | null
  is_public: boolean
  is_premium: boolean
  has_completed_onboarding: boolean
  has_connected_shop: boolean
  has_connected_gmail: boolean
}

type LocationRow = { user_id: string; building_id: string | null; off_campus: boolean }
type PrivateRow = {
  phone: string
  off_campus_address: string
  off_campus_lat: number | null
  off_campus_lng: number | null
}
type SchoolEmailRow = { email: string | null; verified_at: string | null; pending_email: string | null }

function locationFromRow(row: LocationRow | undefined | null): Location {
  return { buildingId: row?.building_id ?? null, offCampus: row?.off_campus ?? false }
}

function profileToUser(
  row: ProfileRow,
  loc: LocationRow | null,
  priv: PrivateRow | null,
  school: SchoolEmailRow | null,
): CurrentUser {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio,
    school: row.school,
    communityId: row.community_id,
    ...locationFromRow(loc),
    phone: priv?.phone ?? '',
    offCampusAddress:
      priv && priv.off_campus_lat !== null && priv.off_campus_lng !== null
        ? { address: priv.off_campus_address, lat: priv.off_campus_lat, lng: priv.off_campus_lng }
        : null,
    schoolEmail: school?.verified_at ? school.email : null,
    pendingSchoolEmail: school?.pending_email ?? null,
    avatarUrl: row.avatar_url,
    isPublic: row.is_public,
    isPremium: row.is_premium,
    hasCompletedOnboarding: row.has_completed_onboarding,
    hasConnectedShop: row.has_connected_shop,
    hasConnectedGmail: row.has_connected_gmail,
  }
}

// Location is only readable for friends (RLS on profile_locations), so for
// anyone else it simply comes back unset.
function profileToPerson(row: ProfileRow, loc?: LocationRow): Person {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio,
    school: row.school,
    communityId: row.community_id,
    ...locationFromRow(loc),
    avatarUrl: row.avatar_url,
    isPublic: row.is_public,
  }
}

type ItemRow = {
  id: string
  owner_id: string
  name: string
  brand: string
  category: string
  size: string
  color: string
  price_cents: number
  wear_count: number
  last_worn_at: string | null
  lendable: boolean
  source: string
  times_lent: number
  always_returned: boolean
  created_at: string
  image_url: string | null
  is_private: boolean
}

function itemFromRow(row: ItemRow): ClothingItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    brand: row.brand,
    category: row.category as Category,
    size: row.size,
    color: row.color,
    priceCents: row.price_cents,
    wearCount: row.wear_count,
    lastWornAt: row.last_worn_at,
    lendable: row.lendable,
    addedAt: row.created_at,
    source: row.source as ClothingItem['source'],
    timesLent: row.times_lent,
    alwaysReturned: row.always_returned,
    imageUrl: row.image_url,
    isPrivate: row.is_private,
  }
}

type BorrowRequestRow = {
  id: string
  item_id: string
  owner_id: string
  requester_id: string
  status: BorrowRequest['status']
  when_needed: BorrowRequest['whenNeeded']
  note: string
  created_at: string
}

function borrowRequestFromRow(row: BorrowRequestRow): BorrowRequest {
  return {
    id: row.id,
    itemId: row.item_id,
    ownerId: row.owner_id,
    requesterId: row.requester_id,
    status: row.status,
    whenNeeded: row.when_needed,
    note: row.note,
    createdAt: row.created_at,
    dateRangeLabel: row.when_needed,
  }
}

// ── profile ─────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<CurrentUser> {
  const [profile, loc, priv, school] = await Promise.all([
    db().from('profiles').select('*').eq('id', userId).single(),
    db().from('profile_locations').select('*').eq('user_id', userId).maybeSingle(),
    db().from('profile_private').select('*').eq('user_id', userId).maybeSingle(),
    db().rpc('my_school_email').maybeSingle(),
  ])
  for (const r of [profile, loc, priv, school]) if (r.error) throw r.error
  return profileToUser(
    profile.data as ProfileRow,
    loc.data as LocationRow | null,
    priv.data as PrivateRow | null,
    school.data as SchoolEmailRow | null,
  )
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  const { error } = await db().from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

export async function fetchProfilesByIds(ids: string[]): Promise<Person[]> {
  if (ids.length === 0) return []
  const [profiles, locs] = await Promise.all([
    db().from('profiles').select('*').in('id', ids),
    db().from('profile_locations').select('*').in('user_id', ids),
  ])
  if (profiles.error) throw profiles.error
  if (locs.error) throw locs.error
  const locById = new Map((locs.data as LocationRow[]).map((l) => [l.user_id, l]))
  return (profiles.data as ProfileRow[]).map((p) => profileToPerson(p, locById.get(p.id)))
}

// ── location ────────────────────────────────────────────────────────────

export async function fetchBuildings(): Promise<Building[]> {
  const { data, error } = await db().from('buildings').select('*').order('name')
  if (error) throw error
  return (data as { id: string; community_id: string; school: string; name: string; lat: number; lng: number }[]).map((b) => ({
    id: b.id,
    communityId: b.community_id,
    school: b.school,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
  }))
}

// The building (or just "off campus") goes where friends can read it; the
// exact address and its coordinates go in the owner-only table.
export async function saveLocation(userId: string, loc: Location, offCampusAddress: OffCampusAddress | null) {
  const { error: e1 } = await db()
    .from('profile_locations')
    .upsert({ user_id: userId, building_id: loc.buildingId, off_campus: loc.offCampus, updated_at: new Date().toISOString() })
  if (e1) throw e1
  const { error: e2 } = await db()
    .from('profile_private')
    .upsert({
      user_id: userId,
      off_campus_address: offCampusAddress?.address ?? '',
      off_campus_lat: offCampusAddress?.lat ?? null,
      off_campus_lng: offCampusAddress?.lng ?? null,
    })
  if (e2) throw e2
}

export async function savePhone(userId: string, phone: string) {
  const { error } = await db().from('profile_private').upsert({ user_id: userId, phone })
  if (error) throw error
}

export async function fetchFriendDistances(): Promise<Record<string, number>> {
  const { data, error } = await db().rpc('friend_distances')
  if (error) throw error
  return Object.fromEntries((data as { friend_id: string; meters: number }[]).map((r) => [r.friend_id, r.meters]))
}

// ── school community ────────────────────────────────────────────────────

export async function sendSchoolCode(email: string) {
  const { error } = await db().functions.invoke('send-school-verification', { body: { email } })
  if (error) {
    // FunctionsHttpError carries the function's own JSON error message.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null)
    throw new Error(body?.error ?? "Couldn't send the code. Try again.")
  }
}

export type VerifyResult = 'verified' | 'incorrect' | 'expired' | 'too_many_attempts' | 'no_pending' | 'email_taken' | 'unsupported_domain'

export async function verifySchoolCode(code: string): Promise<VerifyResult> {
  const { data, error } = await db().rpc('verify_school_email', { p_code: code })
  if (error) throw error
  return data as VerifyResult
}

// ── items ───────────────────────────────────────────────────────────────

export async function fetchMyItems(userId: string): Promise<ClothingItem[]> {
  const { data, error } = await db()
    .from('items')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ItemRow[]).map(itemFromRow)
}

// Everyone else's items this user can see. RLS (0007) does the real
// filtering: friends' non-private items, plus anything that's part of a fit
// check they can see — no friendship filter needed here.
export async function fetchVisibleItems(excludeUserId: string): Promise<ClothingItem[]> {
  const { data, error } = await db().from('items').select('*').neq('owner_id', excludeUserId)
  if (error) throw error
  return (data as ItemRow[]).map(itemFromRow)
}

export async function fetchItemsByIds(ids: string[]): Promise<ClothingItem[]> {
  if (ids.length === 0) return []
  const { data, error } = await db().from('items').select('*').in('id', ids)
  if (error) throw error
  return (data as ItemRow[]).map(itemFromRow)
}

export async function insertItem(
  id: string,
  ownerId: string,
  input: { name: string; brand: string; category: Category; size: string; color: string; priceCents: number; source: ClothingItem['source'] },
): Promise<void> {
  const { error } = await db()
    .from('items')
    .insert({
      id,
      owner_id: ownerId,
      name: input.name,
      brand: input.brand,
      category: input.category,
      size: input.size,
      color: input.color,
      price_cents: input.priceCents,
      source: input.source,
    })
  if (error) throw error
}

export async function updateItemAfterWear(itemId: string, wearCount: number, lastWornAt: string) {
  const { error } = await db().from('items').update({ wear_count: wearCount, last_worn_at: lastWornAt }).eq('id', itemId)
  if (error) throw error
}

export async function updateItemLendable(itemId: string, lendable: boolean) {
  const { error } = await db().from('items').update({ lendable }).eq('id', itemId)
  if (error) throw error
}

// Making an item private also takes it off lending (a DB check enforces it).
export async function updateItemPrivacy(itemId: string, isPrivate: boolean) {
  const patch = isPrivate ? { is_private: true, lendable: false } : { is_private: false }
  const { error } = await db().from('items').update(patch).eq('id', itemId)
  if (error) throw error
}

export async function updateItemImage(itemId: string, imageUrl: string) {
  const { error } = await db().from('items').update({ image_url: imageUrl }).eq('id', itemId)
  if (error) throw error
}

// ── photo upload ────────────────────────────────────────────────────────
// One shared public-read bucket; RLS scopes writes to each user's own
// folder (see 0006_photos.sql), so the path itself is the access control.
const PHOTO_BUCKET = 'public-media'

function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase()
  return file.type.split('/')[1] || 'jpg'
}

async function uploadPhoto(path: string, file: File): Promise<string> {
  const { error } = await db().storage.from(PHOTO_BUCKET).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = db().storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadItemPhoto(userId: string, itemId: string, file: File): Promise<string> {
  return uploadPhoto(`${userId}/items/${itemId}.${fileExtension(file)}`, file)
}

export async function uploadAvatarPhoto(userId: string, file: File): Promise<string> {
  return uploadPhoto(`${userId}/avatar.${fileExtension(file)}`, file)
}

export async function incrementTimesLent(itemId: string, timesLent: number) {
  const { error } = await db().from('items').update({ times_lent: timesLent }).eq('id', itemId)
  if (error) throw error
}

// ── wear log ────────────────────────────────────────────────────────────

export async function fetchWearLog(itemIds: string[]): Promise<WearLogEntry[]> {
  if (itemIds.length === 0) return []
  const { data, error } = await db().from('wear_log').select('*').in('item_id', itemIds)
  if (error) throw error
  return (data as { item_id: string; month: string; count: number }[]).map((r) => ({
    itemId: r.item_id,
    month: r.month.slice(0, 7),
    count: r.count,
  }))
}

export async function bumpWearLog(itemId: string, month: string, currentCount: number) {
  const { error } = await db()
    .from('wear_log')
    .upsert({ item_id: itemId, month: `${month}-01`, count: currentCount + 1 }, { onConflict: 'item_id,month' })
  if (error) throw error
}

// ── borrow requests ─────────────────────────────────────────────────────

export async function fetchBorrowRequests(userId: string): Promise<BorrowRequest[]> {
  const { data, error } = await db()
    .from('borrow_requests')
    .select('*')
    .or(`owner_id.eq.${userId},requester_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as BorrowRequestRow[]).map(borrowRequestFromRow)
}

export async function insertBorrowRequest(
  id: string,
  input: {
    itemId: string
    ownerId: string
    requesterId: string
    whenNeeded: BorrowRequest['whenNeeded']
    note: string
  },
): Promise<void> {
  const { error } = await db()
    .from('borrow_requests')
    .insert({
      id,
      item_id: input.itemId,
      owner_id: input.ownerId,
      requester_id: input.requesterId,
      when_needed: input.whenNeeded,
      note: input.note,
    })
  if (error) throw error
}

export async function updateBorrowRequestStatus(requestId: string, status: BorrowRequest['status']) {
  const { error } = await db().from('borrow_requests').update({ status }).eq('id', requestId)
  if (error) throw error
}

// ── friendships ─────────────────────────────────────────────────────────

export async function fetchFriends(userId: string): Promise<Person[]> {
  const { data, error } = await db()
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (error) throw error
  const friendIds = (data as { requester_id: string; addressee_id: string }[]).map((r) =>
    r.requester_id === userId ? r.addressee_id : r.requester_id,
  )
  return fetchProfilesByIds(friendIds)
}

export async function fetchIncomingRequests(userId: string): Promise<Person[]> {
  const { data, error } = await db().from('friendships').select('requester_id').eq('status', 'pending').eq('addressee_id', userId)
  if (error) throw error
  return fetchProfilesByIds((data as { requester_id: string }[]).map((r) => r.requester_id))
}

export async function fetchOutgoingRequestIds(userId: string): Promise<string[]> {
  const { data, error } = await db().from('friendships').select('addressee_id').eq('requester_id', userId).eq('status', 'pending')
  if (error) throw error
  return (data as { addressee_id: string }[]).map((r) => r.addressee_id)
}

// Everyone you're not already connected to — private profiles included,
// since you have to be able to find someone to send them a request. Their
// closet and location stay hidden until they accept.
export async function fetchDiscoverablePeople(userId: string): Promise<Person[]> {
  const { data: existing, error: e1 } = await db()
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (e1) throw e1
  // Excludes accepted friends (already connected) and anyone who requested
  // *you* (they belong in Friend Requests, not Suggestions). Someone *you*
  // sent a pending request to stays in the list — the UI shows them as
  // "Requested" via friendRequestsOutgoingIds — so a request doesn't make
  // the suggestion disappear, it just changes the button.
  const excludeIds = new Set<string>()
  for (const r of existing as { requester_id: string; addressee_id: string; status: string }[]) {
    const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id
    if (r.status === 'accepted' || (r.status === 'pending' && r.addressee_id === userId)) {
      excludeIds.add(otherId)
    }
  }
  const { data, error } = await db().from('profiles').select('*').neq('id', userId)
  if (error) throw error
  return (data as ProfileRow[]).filter((p) => !excludeIds.has(p.id)).map((p) => profileToPerson(p))
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { error } = await db().from('friendships').insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
  if (error) throw error
}

// Declining removes the request outright rather than storing a 'declined'
// status — there's no product reason yet to remember a decline, and it lets
// the same two people re-request later without a stale row in the way.
export async function respondToFriendRequest(requesterId: string, addresseeId: string, decision: 'accepted' | 'declined') {
  if (decision === 'declined') {
    const { error } = await db().from('friendships').delete().eq('requester_id', requesterId).eq('addressee_id', addresseeId)
    if (error) throw error
    return
  }
  const { error } = await db().from('friendships').update({ status: 'accepted' }).eq('requester_id', requesterId).eq('addressee_id', addresseeId)
  if (error) throw error
}

// ── fit checks (the chats tables) ───────────────────────────────────────

type ChatRow = {
  id: string
  event_name: string
  vibe: string
  weather: string
  ends_at: string | null
  status: FitCheck['status']
  decided_option_id: string | null
  decided_suggestion_id: string | null
  created_by: string
  audience: FitCheckAudience
  group_id: string | null
  mode: FitCheckMode
  created_at: string
}
type ChatMemberRow = { chat_id: string; user_id: string }
type ChatOptionRow = { id: string; chat_id: string; label: string; item_ids: string[]; image_path: string | null; position: number }
type VoteRow = { chat_id: string; user_id: string; option_id: string }
type ChatCommentRow = { id: string; chat_id: string; author_id: string; text: string; created_at: string }
type SuggestionRow = {
  id: string
  chat_id: string
  author_id: string
  item_ids: string[]
  lend_item_ids: string[]
  note: string
  created_at: string
}

// Fit pics live in a private bucket; viewers get short-lived signed URLs.
const FIT_PHOTO_BUCKET = 'fit-photos'
const SIGNED_URL_SECONDS = 60 * 60

async function signFitPhotos(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()
  const { data, error } = await db().storage.from(FIT_PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) throw error
  return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as [string, string]] : [])))
}

async function fetchFitCheckBundle(userId: string, chatIds: string[]): Promise<FitCheck[]> {
  if (chatIds.length === 0) return []
  const [chatsRes, membersRes, optionsRes, votesRes, commentsRes, suggestionsRes] = await Promise.all([
    db().from('chats').select('*').in('id', chatIds),
    db().from('chat_members').select('*').in('chat_id', chatIds),
    db().from('chat_options').select('*').in('chat_id', chatIds).order('position'),
    db().from('votes').select('*').in('chat_id', chatIds),
    db().from('chat_comments').select('*').in('chat_id', chatIds).order('created_at'),
    db().from('fit_suggestions').select('*').in('chat_id', chatIds).order('created_at'),
  ])
  for (const r of [chatsRes, membersRes, optionsRes, votesRes, commentsRes, suggestionsRes]) if (r.error) throw r.error
  const chats = chatsRes.data as ChatRow[]
  const members = membersRes.data as ChatMemberRow[]
  const options = optionsRes.data as ChatOptionRow[]
  const votes = votesRes.data as VoteRow[]
  const comments = commentsRes.data as ChatCommentRow[]
  const suggestions = suggestionsRes.data as SuggestionRow[]

  const participantIds = new Set<string>()
  for (const c of chats) participantIds.add(c.created_by)
  for (const m of members) participantIds.add(m.user_id)
  for (const cm of comments) participantIds.add(cm.author_id)
  for (const sg of suggestions) participantIds.add(sg.author_id)
  const [participants, photoUrls] = await Promise.all([
    fetchProfilesByIds([...participantIds]),
    signFitPhotos(options.map((o) => o.image_path).filter((p): p is string => Boolean(p))),
  ])
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name.split(' ')[0] ?? 'Someone'

  return chats.map((c) => {
    const chatComments = comments.filter((cm) => cm.chat_id === c.id)
    const chatSuggestions = suggestions.filter((sg) => sg.chat_id === c.id)
    const chatVotes = votes.filter((v) => v.chat_id === c.id)
    const lastComment = chatComments[chatComments.length - 1]
    const lastSuggestion = chatSuggestions[chatSuggestions.length - 1]
    const latest =
      lastSuggestion && (!lastComment || lastSuggestion.created_at > lastComment.created_at)
        ? { at: lastSuggestion.created_at, text: `${nameOf(lastSuggestion.author_id)} suggested a look` }
        : lastComment
          ? { at: lastComment.created_at, text: `${nameOf(lastComment.author_id)}: ${lastComment.text}` }
          : { at: c.created_at, text: `${nameOf(c.created_by)} started a fit check` }
    return {
      id: c.id,
      eventName: c.event_name,
      vibe: c.vibe,
      weather: c.weather,
      endsAt: c.ends_at,
      memberIds: members.filter((m) => m.chat_id === c.id).map((m) => m.user_id),
      createdBy: c.created_by,
      audience: c.audience,
      groupId: c.group_id,
      mode: c.mode,
      participants: participants.map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl })),
      status: c.status,
      options: options
        .filter((o) => o.chat_id === c.id)
        .map((o) => ({
          id: o.id,
          label: o.label,
          itemIds: o.item_ids,
          imageUrl: o.image_path ? (photoUrls.get(o.image_path) ?? null) : null,
          votes: chatVotes.filter((v) => v.option_id === o.id).length,
        })),
      suggestions: chatSuggestions.map((sg) => ({
        id: sg.id,
        authorId: sg.author_id,
        itemIds: sg.item_ids,
        lendItemIds: sg.lend_item_ids,
        note: sg.note,
        createdAt: sg.created_at,
      })),
      comments: chatComments.map((cm) => ({ id: cm.id, authorId: cm.author_id, text: cm.text, createdAt: cm.created_at })),
      decidedOptionId: c.decided_option_id,
      decidedSuggestionId: c.decided_suggestion_id,
      myVoteOptionId: chatVotes.find((v) => v.user_id === userId)?.option_id ?? null,
      lastMessagePreview: latest.text,
      lastMessageAt: latest.at,
    }
  })
}

// Every fit check this user can see — RLS (can_view_chat) does the
// filtering: their own, their groups', their friends', and public-profile
// ones from their school community.
export async function fetchFitChecks(userId: string, limit = 50): Promise<FitCheck[]> {
  const { data, error } = await db().from('chats').select('id').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return fetchFitCheckBundle(userId, (data as { id: string }[]).map((r) => r.id))
}

export async function fetchFitCheck(userId: string, chatId: string): Promise<FitCheck | null> {
  const [fc] = await fetchFitCheckBundle(userId, [chatId])
  return fc ?? null
}

export async function insertFitCheck(input: {
  id: string
  createdBy: string
  eventName: string
  vibe: string
  weather: string
  endsAt: string | null
  audience: FitCheckAudience
  groupId: string | null
  mode: FitCheckMode
  memberIds: string[]
  options: { id: string; label: string; itemIds: string[]; photo: File | null }[]
}) {
  const { error: e1 } = await db().from('chats').insert({
    id: input.id,
    title: input.eventName,
    event_name: input.eventName,
    vibe: input.vibe,
    weather: input.weather,
    ends_at: input.endsAt,
    audience: input.audience,
    group_id: input.groupId,
    mode: input.mode,
    created_by: input.createdBy,
  })
  if (e1) throw e1
  const { error: e2 } = await db()
    .from('chat_members')
    .insert(input.memberIds.map((userId) => ({ chat_id: input.id, user_id: userId })))
  if (e2) throw e2
  if (input.options.length === 0) return

  // Upload fit pics first (the storage policy only needs the chat row), so
  // each option row lands with its photo already in place.
  const rows = await Promise.all(
    input.options.map(async (o, position) => {
      let image_path: string | null = null
      if (o.photo) {
        image_path = `${input.id}/${o.id}.${fileExtension(o.photo)}`
        const { error } = await db().storage.from(FIT_PHOTO_BUCKET).upload(image_path, o.photo, { contentType: o.photo.type })
        if (error) throw error
      }
      return { id: o.id, chat_id: input.id, label: o.label, item_ids: o.itemIds, image_path, position }
    }),
  )
  const { error: e3 } = await db().from('chat_options').insert(rows)
  if (e3) throw e3
}

export async function castVoteRemote(chatId: string, userId: string, optionId: string) {
  const { error } = await db()
    .from('votes')
    .upsert({ chat_id: chatId, user_id: userId, option_id: optionId }, { onConflict: 'chat_id,user_id' })
  if (error) throw error
}

export async function insertChatComment(id: string, chatId: string, authorId: string, text: string) {
  const { error } = await db().from('chat_comments').insert({ id, chat_id: chatId, author_id: authorId, text })
  if (error) throw error
}

export async function insertSuggestion(input: {
  id: string
  chatId: string
  authorId: string
  itemIds: string[]
  lendItemIds: string[]
  note: string
}) {
  const { error } = await db().from('fit_suggestions').insert({
    id: input.id,
    chat_id: input.chatId,
    author_id: input.authorId,
    item_ids: input.itemIds,
    lend_item_ids: input.lendItemIds,
    note: input.note,
  })
  if (error) throw error
}

export async function updateFitCheckDecided(chatId: string, pick: { optionId: string } | { suggestionId: string }) {
  const { error } = await db()
    .from('chats')
    .update({
      status: 'decided',
      decided_option_id: 'optionId' in pick ? pick.optionId : null,
      decided_suggestion_id: 'suggestionId' in pick ? pick.suggestionId : null,
    })
    .eq('id', chatId)
  if (error) throw error
}

// Live votes/comments/suggestions for one fit check. RLS still applies
// per-subscriber, so this only fires for fit checks the caller can see.
export function subscribeToFitCheck(chatId: string, onChange: () => void) {
  const channel = db()
    .channel(`fit-check-${chatId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `chat_id=eq.${chatId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_comments', filter: `chat_id=eq.${chatId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'fit_suggestions', filter: `chat_id=eq.${chatId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` }, onChange)
    .subscribe()
  return () => {
    db().removeChannel(channel)
  }
}

// ── friend groups ───────────────────────────────────────────────────────

export async function fetchFriendGroups(userId: string): Promise<FriendGroup[]> {
  const { data, error } = await db()
    .from('friend_groups')
    .select('id, name, friend_group_members(user_id)')
    .eq('owner_id', userId)
    .order('created_at')
  if (error) throw error
  return (data as { id: string; name: string; friend_group_members: { user_id: string }[] }[]).map((g) => ({
    id: g.id,
    name: g.name,
    memberIds: g.friend_group_members.map((m) => m.user_id),
  }))
}

// Upsert the group, then make its roster exactly memberIds.
export async function saveFriendGroup(userId: string, group: FriendGroup) {
  const { error: e1 } = await db().from('friend_groups').upsert({ id: group.id, owner_id: userId, name: group.name })
  if (e1) throw e1
  const { error: e2 } = await db().from('friend_group_members').delete().eq('group_id', group.id)
  if (e2) throw e2
  if (group.memberIds.length === 0) return
  const { error: e3 } = await db()
    .from('friend_group_members')
    .insert(group.memberIds.map((user_id) => ({ group_id: group.id, user_id })))
  if (e3) throw e3
}

export async function deleteFriendGroup(groupId: string) {
  const { error } = await db().from('friend_groups').delete().eq('id', groupId)
  if (error) throw error
}

// Live friend requests/acceptances/declines involving this user — either
// side of a friendships row, since a change either way (a new request in,
// or the other person accepting one you sent) should refresh the screen.
export function subscribeToFriendships(userId: string, onChange: () => void) {
  const channel = db()
    .channel(`friendships-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` }, onChange)
    .subscribe()
  return () => {
    db().removeChannel(channel)
  }
}
