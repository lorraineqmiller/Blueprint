import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// The app runs fully client-side against local mock data until these two
// env vars are set — at that point every screen switches to real accounts
// and a real database with no other code changes. See README "Connecting a
// real backend".
export const isBackendEnabled = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
