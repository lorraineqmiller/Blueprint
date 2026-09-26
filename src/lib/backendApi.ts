// Thin data-access layer over Supabase. Every function here assumes
// `isBackendEnabled` is true (the store only calls into this module in that
// case) and does the snake_case <-> camelCase mapping so the rest of the app
// keeps using the same shapes from src/types.ts regardless of where the data
// comes from.
import { supabase } from './supabaseClient'
import type { BorrowRequest, Category, ClothingItem, CurrentUser, Person, WearLogEntry } from '../types'

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
    distanceLabel: 'On campus', // no geo/friend-graph yet — see Phase 2
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

// Public lendable items owned by someone other than the current user —
// this is the "Closets Near Me" pool until Phase 2 adds a real friend graph.
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
