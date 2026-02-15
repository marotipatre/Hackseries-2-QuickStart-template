/**
 * Tinyman V2 Integration Utilities for Algorand Testnet
 * 
 * This module provides helper functions to integrate with Tinyman DEX
 * for trading PiggyBank project tokens.
 */

import algosdk from 'algosdk'

// Tinyman V2 Testnet Configuration
export const TINYMAN_CONFIG = {
  testnet: {
    appId: 62368684,
    validatorAppId: 62368684,
    baseUrl: 'https://testnet.tinyman.org',
    apiUrl: 'https://testnet.analytics.tinyman.org',
  },
  mainnet: {
    appId: 1002541853,
    validatorAppId: 1002541853,
    baseUrl: 'https://app.tinyman.org',
    apiUrl: 'https://analytics.tinyman.org',
  },
}

// Use testnet by default
const config = TINYMAN_CONFIG.testnet

/**
 * Get the Tinyman swap URL for a token pair
 */
export function getTinymanSwapUrl(assetIn: number, assetOut: number): string {
  return `${config.baseUrl}/#/swap?asset_in=${assetIn}&asset_out=${assetOut}`
}

/**
 * Get the Tinyman pool creation URL
 */
export function getTinymanPoolCreateUrl(asset1: number, asset2: number): string {
  return `${config.baseUrl}/#/pool/create?asset_1=${asset1}&asset_2=${asset2}`
}

/**
 * Get the Tinyman pool URL for adding/removing liquidity
 */
export function getTinymanPoolUrl(asset1: number, asset2: number): string {
  return `${config.baseUrl}/#/pool/add-liquidity?asset_1=${asset1}&asset_2=${asset2}`
}

/**
 * Open Tinyman in a new tab
 */
export function openTinyman(path: string = ''): void {
  window.open(`${config.baseUrl}${path}`, '_blank')
}

/**
 * Fetch pool info from Tinyman API
 */
export async function fetchPoolInfo(asset1Id: number, asset2Id: number): Promise<TinymanPoolInfo | null> {
  try {
    const response = await fetch(
      `${config.apiUrl}/api/v1/pools/?asset_1=${asset1Id}&asset_2=${asset2Id}`
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.results?.[0] || null
  } catch (e) {
    console.error('Failed to fetch Tinyman pool info:', e)
    return null
  }
}

/**
 * Fetch asset info from Tinyman
 */
export async function fetchAssetInfo(assetId: number): Promise<TinymanAsset | null> {
  try {
    const response = await fetch(`${config.apiUrl}/api/v1/assets/${assetId}/`)
    if (!response.ok) return null
    return await response.json()
  } catch (e) {
    console.error('Failed to fetch asset info:', e)
    return null
  }
}

/**
 * Calculate swap quote (simplified)
 * For accurate quotes, use the official Tinyman SDK
 */
export function calculateSwapQuote(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feeRate: number = 0.003 // 0.3% default
): { outputAmount: number; priceImpact: number } {
  const inputWithFee = inputAmount * (1 - feeRate)
  const outputAmount = (outputReserve * inputWithFee) / (inputReserve + inputWithFee)
  
  const priceImpact = inputAmount / (inputReserve + inputAmount)
  
  return {
    outputAmount,
    priceImpact: priceImpact * 100, // as percentage
  }
}

/**
 * Get opt-in transaction for Tinyman pool token
 */
export async function getPoolTokenOptInTxn(
  algodClient: algosdk.Algodv2,
  senderAddress: string,
  poolTokenId: number
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: senderAddress,
    assetIndex: poolTokenId,
    amount: 0,
    suggestedParams,
  })
}

// Type definitions for Tinyman API responses
export interface TinymanPoolInfo {
  address: string
  asset_1: TinymanAsset
  asset_2: TinymanAsset
  liquidity_asset: TinymanAsset
  asset_1_reserves: string
  asset_2_reserves: string
  issued_liquidity: string
  total_fee_share: number
  protocol_fee_ratio: number
  creation_round: number
}

export interface TinymanAsset {
  id: number
  name: string
  unit_name: string
  decimals: number
  total_amount?: string
  url?: string
  is_liquidity_token?: boolean
  is_verified?: boolean
}

/**
 * Tinyman SDK integration helper
 * 
 * For more complex operations like bootstrapping pools and swaps,
 * install the official Tinyman SDK:
 * 
 * npm install @tinyman/tinyman-sdk
 * 
 * And use:
 * 
 * ```typescript
 * import { TinymanClient, PoolClient } from '@tinyman/tinyman-sdk'
 * 
 * // Initialize client
 * const tinymanClient = new TinymanClient({
 *   algodClient,
 *   network: 'testnet',
 * })
 * 
 * // Bootstrap pool
 * const pool = await tinymanClient.bootstrapPool({
 *   asset1Id: 0, // ALGO
 *   asset2Id: YOUR_TOKEN_ID,
 * })
 * 
 * // Add liquidity
 * await pool.addLiquidity({
 *   asset1Amount: 10_000_000, // 10 ALGO
 *   asset2Amount: 1_000_000_000, // 1000 tokens
 * })
 * 
 * // Swap
 * const quote = await pool.getSwapQuote({
 *   assetIn: 0,
 *   amountIn: 1_000_000, // 1 ALGO
 *   slippage: 0.01, // 1%
 * })
 * 
 * await pool.swap(quote)
 * ```
 */

export default {
  config,
  getTinymanSwapUrl,
  getTinymanPoolCreateUrl,
  getTinymanPoolUrl,
  openTinyman,
  fetchPoolInfo,
  fetchAssetInfo,
  calculateSwapQuote,
  getPoolTokenOptInTxn,
}
