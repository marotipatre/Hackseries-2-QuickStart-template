import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User profile interface
export interface UserProfile {
  id?: string
  wallet_address: string
  name: string
  description: string
  twitter_url: string
  linkedin_url: string
  avatar_url: string
  created_at?: string
  updated_at?: string
}

// Create or update user profile
export async function upsertUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        wallet_address: profile.wallet_address,
        name: profile.name,
        description: profile.description,
        twitter_url: profile.twitter_url,
        linkedin_url: profile.linkedin_url,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'wallet_address',
      }
    )
    .select()
    .single()

  return { data, error }
}

// Get user profile by wallet address
export async function getUserProfile(walletAddress: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  return { data: data as UserProfile | null, error }
}

// Check if user exists by wallet address
export async function checkUserExists(walletAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('wallet_address')
    .eq('wallet_address', walletAddress)
    .single()

  return !error && data !== null
}
