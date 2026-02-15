/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

// ============================================
// SUPABASE CLIENT SETUP
// ============================================
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface PiggyBankProject {
  id?: string
  app_id: number
  app_address: string
  name: string
  description?: string
  token_id?: number
  token_name?: string
  token_symbol?: string
  token_total_supply?: number
  goal_amount: number
  total_deposited?: number
  creator_address: string
  tinyman_pool_address?: string
  tinyman_pool_id?: number
  is_active?: boolean
  is_goal_reached?: boolean
  image_url?: string
  website_url?: string
  twitter_url?: string
  discord_url?: string
  created_at?: string
  updated_at?: string
}

export interface PiggyBankDeposit {
  id?: string
  project_id: string
  app_id: number
  depositor_address: string
  amount: number
  txn_id: string
  round_number?: number
  created_at?: string
}

export interface PiggyBankWithdrawal {
  id?: string
  project_id: string
  app_id: number
  withdrawer_address: string
  amount: number
  txn_id: string
  round_number?: number
  created_at?: string
}

export interface PiggyBankTokenClaim {
  id?: string
  project_id: string
  token_id: number
  claimer_address: string
  amount: number
  txn_id: string
  round_number?: number
  created_at?: string
}

// ============================================
// PROJECT FUNCTIONS
// ============================================

/**
 * Create a new piggybank project in Supabase
 */
export async function createPiggyBankProject(
  project: Omit<PiggyBankProject, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .insert({
      ...project,
      is_active: true,
      is_goal_reached: false,
      total_deposited: 0,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Get all active piggybank projects
 */
export async function getAllProjects() {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankProject[] | null, error }
}

/**
 * Get a single project by App ID
 */
export async function getProjectByAppId(appId: number) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .eq('app_id', appId)
    .single()

  return { data: data as PiggyBankProject | null, error }
}

/**
 * Get projects created by a specific wallet
 */
export async function getProjectsByCreator(creatorAddress: string) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .eq('creator_address', creatorAddress)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankProject[] | null, error }
}

/**
 * Update project details
 */
export async function updateProject(
  appId: number,
  updates: Partial<PiggyBankProject>
) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .update(updates)
    .eq('app_id', appId)
    .select()
    .single()

  return { data, error }
}

/**
 * Update project deposit totals
 */
export async function updateProjectDeposits(
  appId: number,
  newTotalDeposited: number
) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .update({
      total_deposited: newTotalDeposited,
      is_goal_reached: false, // Will check on client
    })
    .eq('app_id', appId)
    .select()
    .single()

  return { data, error }
}

/**
 * Set Tinyman pool info after pool creation
 */
export async function setTinymanPool(
  appId: number,
  poolAddress: string,
  poolId: number
) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .update({
      tinyman_pool_address: poolAddress,
      tinyman_pool_id: poolId,
    })
    .eq('app_id', appId)
    .select()
    .single()

  return { data, error }
}

// ============================================
// DEPOSIT FUNCTIONS
// ============================================

/**
 * Record a new deposit
 */
export async function recordDeposit(deposit: Omit<PiggyBankDeposit, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('piggybank_deposits')
    .insert(deposit)
    .select()
    .single()

  return { data, error }
}

/**
 * Get deposits for a project
 */
export async function getProjectDeposits(projectId: string) {
  const { data, error } = await supabase
    .from('piggybank_deposits')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankDeposit[] | null, error }
}

/**
 * Get deposits by a user
 */
export async function getUserDeposits(depositorAddress: string) {
  const { data, error } = await supabase
    .from('piggybank_deposits')
    .select('*, piggybank_projects(*)')
    .eq('depositor_address', depositorAddress)
    .order('created_at', { ascending: false })

  return { data, error }
}

// ============================================
// WITHDRAWAL FUNCTIONS
// ============================================

/**
 * Record a new withdrawal
 */
export async function recordWithdrawal(
  withdrawal: Omit<PiggyBankWithdrawal, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('piggybank_withdrawals')
    .insert(withdrawal)
    .select()
    .single()

  return { data, error }
}

/**
 * Get withdrawals for a project
 */
export async function getProjectWithdrawals(projectId: string) {
  const { data, error } = await supabase
    .from('piggybank_withdrawals')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankWithdrawal[] | null, error }
}

// ============================================
// TOKEN CLAIM FUNCTIONS
// ============================================

/**
 * Record a token claim
 */
export async function recordTokenClaim(
  claim: Omit<PiggyBankTokenClaim, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('piggybank_token_claims')
    .insert(claim)
    .select()
    .single()

  return { data, error }
}

/**
 * Get token claims for a project
 */
export async function getProjectTokenClaims(projectId: string) {
  const { data, error } = await supabase
    .from('piggybank_token_claims')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankTokenClaim[] | null, error }
}

/**
 * Get token claims by a user
 */
export async function getUserTokenClaims(claimerAddress: string) {
  const { data, error } = await supabase
    .from('piggybank_token_claims')
    .select('*, piggybank_projects(*)')
    .eq('claimer_address', claimerAddress)
    .order('created_at', { ascending: false })

  return { data, error }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Search projects by name
 */
export async function searchProjects(query: string) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .ilike('name', `%${query}%`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return { data: data as PiggyBankProject[] | null, error }
}

/**
 * Get trending projects (most deposited)
 */
export async function getTrendingProjects(limit: number = 10) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .eq('is_active', true)
    .order('total_deposited', { ascending: false })
    .limit(limit)

  return { data: data as PiggyBankProject[] | null, error }
}

/**
 * Get projects close to goal
 */
export async function getProjectsNearGoal(limit: number = 10) {
  const { data, error } = await supabase
    .from('piggybank_projects')
    .select('*')
    .eq('is_active', true)
    .eq('is_goal_reached', false)
    .order('total_deposited', { ascending: false })
    .limit(limit)

  return { data: data as PiggyBankProject[] | null, error }
}
