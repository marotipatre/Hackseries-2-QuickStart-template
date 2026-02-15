/**
 * Algorand Blockchain Utilities
 *
 * Handles all on-chain operations so founders never need AlgoKit CLI:
 *  - Deploy PiggyBank smart contract from browser
 *  - Initialize project + mint ASA token
 *  - Deposit / Withdraw / Claim tokens
 *  - Tinyman pool bootstrapping helpers
 */

import algosdk, {
  getApplicationAddress,
  makePaymentTxnWithSuggestedParamsFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
} from 'algosdk'
import { AlgorandClient, microAlgos } from '@algorandfoundation/algokit-utils'
import { PiggyBankFactory, PiggyBankClient } from '../contracts/PiggyBank'
import { TransactionSigner } from 'algosdk'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeployAndInitResult {
  appId: number
  appAddress: string
  tokenId: number
  txnId: string
}

export interface CreateProjectParams {
  algorand: AlgorandClient
  senderAddress: string
  signer: TransactionSigner
  name: string
  description: string
  tokenName: string
  tokenSymbol: string
  tokenSupply: number // whole tokens (will be multiplied by 1e6 for 6 decimals)
  goalAlgos: number   // in ALGO (will be multiplied by 1e6 for microAlgos)
  tokenImageUrl?: string
}

// ---------------------------------------------------------------------------
// 1. Deploy + Initialize – single user action
// ---------------------------------------------------------------------------

/**
 * Deploy a brand new PiggyBank smart contract AND initialize the project
 * with its token in one smooth flow. No AlgoKit CLI needed.
 *
 * Steps:
 *  1. Deploy the contract (bare create)
 *  2. Fund the contract with MBR (0.2 ALGO for ASA creation)
 *  3. Call `initialize_project` which mints the ASA token on-chain
 *
 * Returns the App ID, app address, and created ASA token ID.
 */
export async function deployAndInitializeProject(
  params: CreateProjectParams,
): Promise<DeployAndInitResult> {
  const {
    algorand,
    senderAddress,
    signer,
    name,
    description,
    tokenName,
    tokenSymbol,
    tokenSupply,
    goalAlgos,
    tokenImageUrl,
  } = params

  // Make sure the signer is set
  algorand.setDefaultSigner(signer)
  algorand.setSigner(senderAddress, signer)

  // --- Step 1: Deploy the contract ---
  const factory = new PiggyBankFactory({
    algorand,
    defaultSender: senderAddress,
  })

  const { appClient } = await factory.send.create.bare()
  const appId = Number(appClient.appId)
  const appAddress = String(getApplicationAddress(appId))

  // --- Step 2: Fund contract for MBR (minimum balance) ---
  // The contract needs at least 0.2 ALGO to create the ASA
  await algorand.send.payment({
    sender: senderAddress,
    receiver: appAddress,
    amount: microAlgos(300_000), // 0.3 ALGO buffer for MBR + fees
  })

  // --- Step 3: Initialize project (mints the ASA) ---
  const goalMicroAlgos = Math.round(goalAlgos * 1_000_000)
  const supplyWithDecimals = tokenSupply * 1_000_000 // 6 decimals

  const mbrPayTxn = await algorand.createTransaction.payment({
    sender: senderAddress,
    receiver: appAddress,
    amount: microAlgos(200_000),
  })

  const initResult = await appClient.send.initializeProject({
    args: {
      name,
      description,
      tokenName,
      tokenSymbol,
      tokenSupply: supplyWithDecimals,
      goal: goalMicroAlgos,
      mbrPay: mbrPayTxn,
    },
    populateAppCallResources: true,
    extraFee: microAlgos(2000),
  })

  const tokenId = Number(initResult.return ?? 0)

  if (tokenId <= 0) {
    throw new Error('Token creation failed: token ID was not returned by initialize_project')
  }

  try {
    await algorand.client.algod.accountAssetInformation(senderAddress, tokenId).do()
  } catch {
    await algorand.send.assetTransfer({
      sender: senderAddress,
      receiver: senderAddress,
      assetId: BigInt(tokenId),
      amount: BigInt(0),
    })
  }

  await appClient.send.claimTokens({
    args: { tokenAmount: supplyWithDecimals },
    populateAppCallResources: true,
    extraFee: microAlgos(1000),
  })

  if (tokenImageUrl && tokenImageUrl.length <= 96) {
    await algorand.send.assetConfig({
      sender: senderAddress,
      assetId: BigInt(tokenId),
      manager: senderAddress,
      reserve: senderAddress,
      freeze: senderAddress,
      clawback: senderAddress,
      url: tokenImageUrl,
    })
  }

  return {
    appId,
    appAddress,
    tokenId,
    txnId: initResult.transaction.txID(),
  }
}

// ---------------------------------------------------------------------------
// 2. Get an AppClient for an existing deployed contract
// ---------------------------------------------------------------------------

export function getPiggyBankClient(
  algorand: AlgorandClient,
  appId: number,
  senderAddress: string,
): PiggyBankClient {
  return new PiggyBankClient({
    algorand,
    appId: BigInt(appId),
    defaultSender: senderAddress,
  })
}

// ---------------------------------------------------------------------------
// 3. Deposit ALGO to a project
// ---------------------------------------------------------------------------

export async function depositToProject(
  algorand: AlgorandClient,
  appId: number,
  senderAddress: string,
  amountAlgos: number,
) {
  const appAddress = String(getApplicationAddress(appId))
  const client = getPiggyBankClient(algorand, appId, senderAddress)

  const payTxn = await algorand.createTransaction.payment({
    sender: senderAddress,
    receiver: appAddress,
    amount: microAlgos(Math.round(amountAlgos * 1_000_000)),
  })

  const result = await client.send.deposit({
    args: { payTxn },
    populateAppCallResources: true,
    boxReferences: [{ appId: BigInt(appId), name: new Uint8Array([...Buffer.from('d_'), ...algosdk.decodeAddress(senderAddress).publicKey]) }],
  })

  return {
    totalDeposited: Number(result.return ?? 0),
    txnId: result.transaction.txID(),
  }
}

// ---------------------------------------------------------------------------
// 4. Withdraw ALGO from a project 
// ---------------------------------------------------------------------------

export async function withdrawFromProject(
  algorand: AlgorandClient,
  appId: number,
  senderAddress: string,
  amountAlgos: number,
) {
  const client = getPiggyBankClient(algorand, appId, senderAddress)

  const result = await client.send.withdraw({
    args: { amount: Math.round(amountAlgos * 1_000_000) },
    populateAppCallResources: true,
    extraFee: microAlgos(1000),
    boxReferences: [{ appId: BigInt(appId), name: new Uint8Array([...Buffer.from('d_'), ...algosdk.decodeAddress(senderAddress).publicKey]) }],
  })

  return {
    remaining: Number(result.return ?? 0),
    txnId: result.transaction.txID(),
  }
}

// ---------------------------------------------------------------------------
// 5. Claim project tokens
// ---------------------------------------------------------------------------

export async function claimProjectTokens(
  algorand: AlgorandClient,
  appId: number,
  senderAddress: string,
  tokenId: number,
  tokenAmount: number,
) {
  const client = getPiggyBankClient(algorand, appId, senderAddress)

  // First opt-in the user to the ASA if needed
  try {
    const accountInfo = await algorand.client.algod.accountAssetInformation(senderAddress, tokenId).do()
    // If no error, user is already opted in
  } catch {
    // Opt-in: send 0-amount ASA transfer to self
    const sp = await algorand.client.algod.getTransactionParams().do()
    const optInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: senderAddress,
      assetIndex: tokenId,
      amount: 0,
      suggestedParams: sp,
    })
    await algorand.send.assetTransfer({
      sender: senderAddress,
      receiver: senderAddress,
      assetId: BigInt(tokenId),
      amount: BigInt(0),
    })
  }

  const result = await client.send.claimTokens({
    args: { tokenAmount },
    populateAppCallResources: true,
    extraFee: microAlgos(1000),
    boxReferences: [{ appId: BigInt(appId), name: new Uint8Array([...Buffer.from('d_'), ...algosdk.decodeAddress(senderAddress).publicKey]) }],
  })

  return {
    claimed: Number(result.return ?? 0),
    txnId: result.transaction.txID(),
  }
}

// ---------------------------------------------------------------------------
// 6. Create ASA token standalone (for projects that don't use the contract)
// ---------------------------------------------------------------------------

export async function createStandaloneASA(
  algorand: AlgorandClient,
  senderAddress: string,
  tokenName: string,
  tokenSymbol: string,
  totalSupply: number,
  decimals: number = 6,
  assetUrl?: string,
) {
  const safeAssetUrl = assetUrl && assetUrl.length <= 96 ? assetUrl : 'ipfs://'

  const result = await algorand.send.assetCreate({
    sender: senderAddress,
    total: BigInt(totalSupply * Math.pow(10, decimals)),
    decimals,
    assetName: tokenName,
    unitName: tokenSymbol,
    url: safeAssetUrl,
    manager: senderAddress,
    reserve: senderAddress,
    freeze: senderAddress,
    clawback: senderAddress,
  })

  return {
    assetId: Number(result.confirmation.assetIndex),
    txnId: result.transaction.txID(),
  }
}

// ---------------------------------------------------------------------------
// 7. Tinyman helpers
// ---------------------------------------------------------------------------

const TINYMAN_TESTNET_URL = 'https://testnet.tinyman.org'
const TINYMAN_MAINNET_URL = 'https://app.tinyman.org'

/** Open Tinyman swap page */
export function openTinymanSwap(tokenId: number, network: 'testnet' | 'mainnet' = 'testnet') {
  const base = network === 'testnet' ? TINYMAN_TESTNET_URL : TINYMAN_MAINNET_URL
  window.open(`${base}/#/swap?asset_in=0&asset_out=${tokenId}`, '_blank')
}

/** Open Tinyman pool creation / add-liquidity page */
export function openTinymanPool(tokenId: number, network: 'testnet' | 'mainnet' = 'testnet') {
  const base = network === 'testnet' ? TINYMAN_TESTNET_URL : TINYMAN_MAINNET_URL
  window.open(`${base}/#/pool/add-liquidity?asset_1=0&asset_2=${tokenId}`, '_blank')
}

/** Get direct swap URL */
export function getTinymanSwapUrl(tokenId: number, network: 'testnet' | 'mainnet' = 'testnet') {
  const base = network === 'testnet' ? TINYMAN_TESTNET_URL : TINYMAN_MAINNET_URL
  return `${base}/#/swap?asset_in=0&asset_out=${tokenId}`
}

/** Get pool URL */
export function getTinymanPoolUrl(tokenId: number, network: 'testnet' | 'mainnet' = 'testnet') {
  const base = network === 'testnet' ? TINYMAN_TESTNET_URL : TINYMAN_MAINNET_URL
  return `${base}/#/pool/add-liquidity?asset_1=0&asset_2=${tokenId}`
}
