// Thin data-access layer over Supabase. Every function here assumes
// `isBackendEnabled` is true (the store only calls into this module in that
// case) and does the snake_case <-> camelCase mapping so the rest of the app
// keeps using the same shapes from src/types.ts regardless of where the data
// comes from.
import { supabase } from './supabaseClient'
import type { BorrowRequest, Category, ClothingItem, CurrentUser, GroupChat, Person, WearLogEntry } from '../types'

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

// ── auth ────────────────────────────────────────────────────────────────

export async function signUp(input: { email: string; password: string; name: string; handle: string; school: string }) {
  const { data, error } = await db().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, handle: input.handle, school: input.school } },
  })
  if (error) throw error
  return data
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
  school: string
  class_year: string
  is_public: boolean
  is_premium: boolean
  has_completed_onboarding: boolean
  has_connected_shop: boolean
  has_connected_gmail: boolean
}

function profileToUser(row: ProfileRow): CurrentUser {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    school: row.school,
    classYear: row.class_year,
    isPublic: row.is_public,
    isPremium: row.is_premium,
    hasCompletedOnboarding: row.has_completed_onboarding,
    hasConnectedShop: row.has_connected_shop,
    hasConnectedGmail: row.has_connected_gmail,
  }
}

function profileToPerson(row: ProfileRow): Person {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    school: row.school,
    classYear: row.class_year,
    distanceLabel: 'On campus', // no real geo yet — proximity is still flavor text
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
  const { data, error } = await db().from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return profileToUser(data as ProfileRow)
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  const { error } = await db().from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

export async function fetchProfilesByIds(ids: string[]): Promise<Person[]> {
  if (ids.length === 0) return []
  const { data, error } = await db().from('profiles').select('*').in('id', ids)
  if (error) throw error
  return (data as ProfileRow[]).map(profileToPerson)
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

// Public + lendable items owned by someone other than the current user.
// RLS (see 0002_phase2.sql) transparently restricts the rows that actually
// come back to accepted friends only — no friendship filter needed here.
export async function fetchDiscoverableItems(excludeUserId: string): Promise<ClothingItem[]> {
  const { data, error } = await db().from('items').select('*').eq('lendable', true).neq('owner_id', excludeUserId)
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

// Public profiles you're not already connected to (in either direction, any
// status) — the pool for a "Find Friends" screen.
export async function fetchDiscoverablePeople(userId: string): Promise<Person[]> {
  const { data: existing, error: e1 } = await db()
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (e1) throw e1
  const connectedIds = new Set<string>()
  for (const r of existing as { requester_id: string; addressee_id: string }[]) {
    connectedIds.add(r.requester_id === userId ? r.addressee_id : r.requester_id)
  }
  const { data, error } = await db().from('profiles').select('*').eq('is_public', true).neq('id', userId)
  if (error) throw error
  return (data as ProfileRow[]).filter((p) => !connectedIds.has(p.id)).map(profileToPerson)
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

// ── chats ───────────────────────────────────────────────────────────────

type ChatRow = {
  id: string
  title: string
  event_name: string
  location: string
  event_time: string
  status: GroupChat['status']
  decided_option_id: string | null
  voting_closes_label: string
  created_by: string
  created_at: string
}
type ChatMemberRow = { chat_id: string; user_id: string }
type ChatOptionRow = { id: string; chat_id: string; label: string; item_ids: string[] }
type VoteRow = { chat_id: string; user_id: string; option_id: string }
type ChatCommentRow = { id: string; chat_id: string; author_id: string; text: string; created_at: string }

function assembleChats(
  chats: ChatRow[],
  members: ChatMemberRow[],
  options: ChatOptionRow[],
  votes: VoteRow[],
  comments: ChatCommentRow[],
): GroupChat[] {
  return chats.map((c) => {
    const chatOptions = options.filter((o) => o.chat_id === c.id)
    const chatVotes = votes.filter((v) => v.chat_id === c.id)
    const chatComments = [...comments.filter((cm) => cm.chat_id === c.id)].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    const lastComment = chatComments[chatComments.length - 1]
    return {
      id: c.id,
      title: c.title,
      eventName: c.event_name,
      location: c.location,
      eventTime: c.event_time,
      memberIds: members.filter((m) => m.chat_id === c.id).map((m) => m.user_id),
      status: c.status,
      options: chatOptions.map((o) => ({
        id: o.id,
        label: o.label,
        itemIds: o.item_ids,
        votes: chatVotes.filter((v) => v.option_id === o.id).length,
      })),
      comments: chatComments.map((cm) => ({ id: cm.id, authorId: cm.author_id, text: cm.text, createdAt: cm.created_at })),
      decidedOptionId: c.decided_option_id,
      votingClosesLabel: c.voting_closes_label,
      lastMessagePreview: lastComment ? lastComment.text : 'Fit check posted',
      lastMessageAt: lastComment ? lastComment.created_at : c.created_at,
    }
  })
}

async function fetchChatBundle(filterChatIds: string[]) {
  const [chatsRes, membersRes, optionsRes, votesRes, commentsRes] = await Promise.all([
    db().from('chats').select('*').in('id', filterChatIds),
    db().from('chat_members').select('*').in('chat_id', filterChatIds),
    db().from('chat_options').select('*').in('chat_id', filterChatIds),
    db().from('votes').select('*').in('chat_id', filterChatIds),
    db().from('chat_comments').select('*').in('chat_id', filterChatIds),
  ])
  for (const r of [chatsRes, membersRes, optionsRes, votesRes, commentsRes]) if (r.error) throw r.error
  return assembleChats(
    chatsRes.data as ChatRow[],
    membersRes.data as ChatMemberRow[],
    optionsRes.data as ChatOptionRow[],
    votesRes.data as VoteRow[],
    commentsRes.data as ChatCommentRow[],
  )
}

export async function fetchMyChats(userId: string): Promise<GroupChat[]> {
  const { data: memberRows, error } = await db().from('chat_members').select('chat_id').eq('user_id', userId)
  if (error) throw error
  const chatIds = (memberRows as { chat_id: string }[]).map((r) => r.chat_id)
  if (chatIds.length === 0) return []
  return fetchChatBundle(chatIds)
}

export async function fetchChatDetail(chatId: string): Promise<GroupChat | null> {
  const chats = await fetchChatBundle([chatId])
  return chats[0] ?? null
}

export async function insertChat(input: {
  id: string
  title: string
  eventName: string
  location: string
  eventTime: string
  createdBy: string
  memberIds: string[]
  options: { id: string; label: string; itemIds: string[] }[]
}) {
  const { error: e1 } = await db().from('chats').insert({
    id: input.id,
    title: input.title,
    event_name: input.eventName,
    location: input.location,
    event_time: input.eventTime,
    created_by: input.createdBy,
  })
  if (e1) throw e1
  const { error: e2 } = await db()
    .from('chat_members')
    .insert(input.memberIds.map((userId) => ({ chat_id: input.id, user_id: userId })))
  if (e2) throw e2
  const { error: e3 } = await db()
    .from('chat_options')
    .insert(input.options.map((o) => ({ id: o.id, chat_id: input.id, label: o.label, item_ids: o.itemIds })))
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

export async function updateChatDecided(chatId: string, decidedOptionId: string) {
  const { error } = await db()
    .from('chats')
    .update({ status: 'decided', decided_option_id: decidedOptionId, voting_closes_label: 'closed' })
    .eq('id', chatId)
  if (error) throw error
}

// Live votes/comments for one chat. RLS still applies per-subscriber, so
// this only ever fires for chats the caller is actually a member of.
export function subscribeToChat(chatId: string, onChange: () => void) {
  const channel = db()
    .channel(`chat-${chatId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `chat_id=eq.${chatId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_comments', filter: `chat_id=eq.${chatId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` }, onChange)
    .subscribe()
  return () => {
    db().removeChannel(channel)
  }
}
