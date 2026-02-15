import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { getApplicationAddress } from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import {
  createPiggyBankProject,
  getProjectByAppId,
  recordDeposit,
  recordWithdrawal,
  updateProjectDeposits,
  setTinymanPool,
  type PiggyBankProject,
} from '../utils/piggybank_supabase'
import {
  deployAndInitializeProject,
  depositToProject,
  withdrawFromProject,
  claimProjectTokens,
  getTinymanSwapUrl,
  getTinymanPoolUrl,
} from '../utils/algorand'

interface PiggyBankProps {
  openModal: boolean
  closeModal: () => void
}

const PiggyBankComponent = ({ openModal, closeModal }: PiggyBankProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  // State
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'trade'>('create')

  // Project creation state
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenSupply, setTokenSupply] = useState('1000000')
  const [goalAmount, setGoalAmount] = useState('')
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [deployResult, setDeployResult] = useState<{ appId: number; appAddress: string; tokenId: number; txnId: string } | null>(null)

  // Manage state — user enters App ID of an existing project
  const [manageAppId, setManageAppId] = useState<number | ''>('')
  const [projectInfo, setProjectInfo] = useState<PiggyBankProject | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const manageAppAddress = useMemo(
    () => (manageAppId ? String(getApplicationAddress(Number(manageAppId))) : ''),
    [manageAppId],
  )

  // Fetch project info from Supabase
  const fetchProjectInfo = async () => {
    if (!manageAppId) return
    try {
      const { data } = await getProjectByAppId(Number(manageAppId))
      if (data) setProjectInfo(data)
    } catch (e) {
      console.error('Failed to fetch project info:', e)
    }
  }

  useEffect(() => {
    if (manageAppId) fetchProjectInfo()
  }, [manageAppId])

  // ─── Deploy + Initialize ────────────────────────────────────────────
  const handleDeploy = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Connect your wallet first', { variant: 'error' })
      return
    }
    if (!projectName || !tokenName || !tokenSymbol || !goalAmount) {
      enqueueSnackbar('Fill all required fields', { variant: 'error' })
      return
    }

    setDeployStatus('deploying')
    setLoading(true)
    try {
      const goalMicroAlgos = Math.round(parseFloat(goalAmount) * 1_000_000)
      const supplyWithDecimals = parseInt(tokenSupply) * 1_000_000 // 6 decimals

      // 1. Deploy contract + mint token — all in-browser
      const result = await deployAndInitializeProject(algorand, {
        creatorAddress: activeAddress,
        projectName,
        tokenName,
        tokenUnitName: tokenSymbol,
        tokenTotalSupply: supplyWithDecimals,
        goalAmount: goalMicroAlgos,
      })

      setDeployResult(result)

      // 2. Save to Supabase
      await createPiggyBankProject({
        app_id: result.appId,
        app_address: result.appAddress,
        name: projectName,
        description: projectDescription,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_id: result.tokenId,
        token_total_supply: supplyWithDecimals,
        goal_amount: goalMicroAlgos,
        creator_address: activeAddress,
      })

      setDeployStatus('success')
      enqueueSnackbar('Project deployed & token minted!', { variant: 'success' })
    } catch (e) {
      setDeployStatus('error')
      enqueueSnackbar(`Deploy failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Deposit ────────────────────────────────────────────────────────
  const deposit = async () => {
    if (!activeAddress || !manageAppId) {
      enqueueSnackbar('Connect wallet and enter App ID', { variant: 'error' })
      return
    }
    const amountAlgos = parseFloat(depositAmount)
    if (!amountAlgos || amountAlgos <= 0) {
      enqueueSnackbar('Enter a valid deposit amount', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const { totalDeposited, txnId } = await depositToProject(
        algorand,
        Number(manageAppId),
        activeAddress,
        amountAlgos,
      )

      const amountMicroAlgos = Math.round(amountAlgos * 1_000_000)
      if (projectInfo?.id) {
        await recordDeposit({
          project_id: projectInfo.id,
          app_id: Number(manageAppId),
          depositor_address: activeAddress,
          amount: amountMicroAlgos,
          txn_id: txnId,
        })
        const newTotal = (projectInfo.total_deposited || 0) + amountMicroAlgos
        await updateProjectDeposits(Number(manageAppId), newTotal)
      }

      enqueueSnackbar(`Deposited ${amountAlgos} ALGO! Tx: ${txnId.slice(0, 8)}...`, { variant: 'success' })
      setDepositAmount('')
      fetchProjectInfo()
    } catch (e) {
      enqueueSnackbar(`Deposit failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Withdraw ───────────────────────────────────────────────────────
  const withdraw = async () => {
    if (!activeAddress || !manageAppId) {
      enqueueSnackbar('Connect wallet and enter App ID', { variant: 'error' })
      return
    }
    const amountAlgos = parseFloat(withdrawAmount)
    if (!amountAlgos || amountAlgos <= 0) {
      enqueueSnackbar('Enter a valid withdrawal amount', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const { remaining, txnId } = await withdrawFromProject(
        algorand,
        Number(manageAppId),
        activeAddress,
        amountAlgos,
      )

      if (projectInfo?.id) {
        const amountMicroAlgos = Math.round(amountAlgos * 1_000_000)
        await recordWithdrawal({
          project_id: projectInfo.id,
          app_id: Number(manageAppId),
          withdrawer_address: activeAddress,
          amount: amountMicroAlgos,
          txn_id: txnId,
        })
      }

      enqueueSnackbar(`Withdrew ${amountAlgos} ALGO! Tx: ${txnId.slice(0, 8)}...`, { variant: 'success' })
      setWithdrawAmount('')
      fetchProjectInfo()
    } catch (e) {
      enqueueSnackbar(`Withdrawal failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Claim Tokens ───────────────────────────────────────────────────
  const claimTokens = async () => {
    if (!activeAddress || !manageAppId || !projectInfo?.token_id) {
      enqueueSnackbar('Invalid state for claiming', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const { amountClaimed, txnId } = await claimProjectTokens(
        algorand,
        Number(manageAppId),
        activeAddress,
        projectInfo.token_id,
      )

      enqueueSnackbar(`Claimed ${amountClaimed} ${projectInfo.token_symbol} tokens!`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Claim failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!openModal) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
            ✕
          </button>
        </form>

        <h3 className="font-bold text-2xl mb-4">🐷 PiggyBank</h3>
        <p className="text-sm text-gray-500 mb-4">Create savings projects with custom tokens tradable on Tinyman</p>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-4">
          <button
            className={`tab ${activeTab === 'create' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Project
          </button>
          <button
            className={`tab ${activeTab === 'manage' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage
          </button>
          <button
            className={`tab ${activeTab === 'trade' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('trade')}
          >
            Trade on Tinyman
          </button>
        </div>

        {/* ─── Create Project Tab ─────────────────────────────────────── */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {deployStatus === 'success' && deployResult ? (
              <div className="space-y-4">
                <div className="alert alert-success">
                  <span>🎉 Project deployed successfully! Token minted on-chain.</span>
                </div>
                <div className="bg-base-200 rounded-xl p-4 space-y-2 text-sm">
                  <p><strong>App ID:</strong> <span className="font-mono">{deployResult.appId}</span></p>
                  <p><strong>Token ID (ASA):</strong> <span className="font-mono">{deployResult.tokenId}</span></p>
                  <p><strong>Contract:</strong> <span className="font-mono text-xs">{deployResult.appAddress}</span></p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={getTinymanPoolUrl(deployResult.tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    💧 Create Trading Pool on Tinyman
                  </a>
                  <a
                    href={`https://testnet.algoexplorer.io/application/${deployResult.appId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    View on Explorer ↗
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setDeployStatus('idle')
                      setDeployResult(null)
                      setProjectName('')
                      setProjectDescription('')
                      setTokenName('')
                      setTokenSymbol('')
                      setGoalAmount('')
                    }}
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Project Name *</span></label>
                    <input
                      type="text"
                      placeholder="My PiggyBank"
                      className="input input-bordered"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Goal Amount (ALGO) *</span></label>
                    <input
                      type="number"
                      placeholder="100"
                      className="input input-bordered"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text">Description</span></label>
                    <textarea
                      placeholder="Describe your project..."
                      className="textarea textarea-bordered"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Token Name *</span></label>
                    <input
                      type="text"
                      placeholder="PiggyToken"
                      className="input input-bordered"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Token Symbol * (max 8)</span></label>
                    <input
                      type="text"
                      placeholder="PIGGY"
                      className="input input-bordered"
                      maxLength={8}
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Token Supply</span></label>
                    <input
                      type="number"
                      placeholder="1000000"
                      className="input input-bordered"
                      value={tokenSupply}
                      onChange={(e) => setTokenSupply(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-base-200 rounded-lg p-3 text-sm text-gray-600">
                  <p>💡 This will deploy a smart contract and mint your project token — all from your browser. Estimated cost: ~0.5 ALGO.</p>
                </div>

                <button
                  className="btn btn-primary w-full"
                  onClick={handleDeploy}
                  disabled={loading || !activeAddress || deployStatus === 'deploying'}
                >
                  {deployStatus === 'deploying' ? (
                    <><span className="loading loading-spinner" /> Deploying & Minting Token...</>
                  ) : (
                    '🚀 Deploy Project & Mint Token'
                  )}
                </button>

                {!activeAddress && (
                  <p className="text-xs text-center text-gray-400">Connect your wallet to deploy</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Manage Tab ─────────────────────────────────────────────── */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {/* App ID Input for managing existing projects */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">App ID (your deployed project)</span>
              </label>
              <input
                type="number"
                placeholder="Enter your project's App ID"
                className="input input-bordered w-full"
                value={manageAppId}
                onChange={(e) => setManageAppId(e.target.value ? parseInt(e.target.value) : '')}
              />
              {manageAppAddress && (
                <label className="label">
                  <span className="label-text-alt text-xs">Contract: {manageAppAddress.slice(0, 10)}...{manageAppAddress.slice(-6)}</span>
                </label>
              )}
            </div>

            {projectInfo && (
              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Project</div>
                  <div className="stat-value text-lg">{projectInfo.name}</div>
                  <div className="stat-desc">{projectInfo.token_symbol} Token</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Goal</div>
                  <div className="stat-value text-lg">{(projectInfo.goal_amount / 1_000_000).toFixed(2)}</div>
                  <div className="stat-desc">ALGO</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Deposited</div>
                  <div className="stat-value text-lg">{((projectInfo.total_deposited || 0) / 1_000_000).toFixed(2)}</div>
                  <div className="stat-desc">ALGO</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deposit */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Deposit ALGO</h4>
                  <div className="form-control">
                    <input
                      type="number"
                      placeholder="Amount in ALGO"
                      className="input input-bordered"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={deposit}
                    disabled={loading || !activeAddress || !manageAppId}
                  >
                    {loading ? <span className="loading loading-spinner" /> : 'Deposit'}
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Withdraw ALGO</h4>
                  <p className="text-sm text-gray-500">Only the project creator can withdraw</p>
                  <div className="form-control">
                    <input
                      type="number"
                      placeholder="Amount in ALGO"
                      className="input input-bordered"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={withdraw}
                    disabled={loading || !activeAddress || !manageAppId}
                  >
                    {loading ? <span className="loading loading-spinner" /> : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

            {/* Claim Tokens */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Claim {projectInfo?.token_symbol || 'Project'} Tokens</h4>
                <p className="text-sm">Claim tokens based on your deposit ratio (1 token per 0.001 ALGO)</p>
                <button
                  className="btn btn-primary"
                  onClick={claimTokens}
                  disabled={loading || !activeAddress || !projectInfo?.token_id}
                >
                  {loading ? <span className="loading loading-spinner" /> : 'Claim Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Trade Tab — Tinyman Integration ────────────────────────── */}
        {activeTab === 'trade' && (
          <div className="space-y-4">
            <div className="alert">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Trade on Tinyman (Testnet)</h3>
                <p className="text-sm">Your project token can be traded on Tinyman DEX</p>
              </div>
            </div>

            {projectInfo?.token_id && projectInfo.token_id > 0 && (
              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Token ID (ASA)</div>
                  <div className="stat-value text-lg">{projectInfo.token_id}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Token</div>
                  <div className="stat-value text-lg">{projectInfo.token_symbol || 'N/A'}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="card-body">
                  <h4 className="card-title">Create Pool</h4>
                  <p>Bootstrap a new ALGO/{projectInfo?.token_symbol || 'TOKEN'} pool on Tinyman</p>
                  <a
                    href={projectInfo?.token_id ? getTinymanPoolUrl(projectInfo.token_id) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-white ${!projectInfo?.token_id ? 'btn-disabled' : ''}`}
                  >
                    Create Pool on Tinyman ↗
                  </a>
                </div>
              </div>

              <div className="card bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <div className="card-body">
                  <h4 className="card-title">Trade</h4>
                  <p>Swap ALGO for {projectInfo?.token_symbol || 'TOKEN'} on Tinyman</p>
                  <a
                    href={projectInfo?.token_id ? getTinymanSwapUrl(projectInfo.token_id) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-white ${!projectInfo?.token_id ? 'btn-disabled' : ''}`}
                  >
                    Open Tinyman ↗
                  </a>
                </div>
              </div>
            </div>

            {projectInfo?.tinyman_pool_address && (
              <div className="alert alert-success">
                <span>Pool Address: {projectInfo.tinyman_pool_address}</span>
              </div>
            )}

            <div className="divider">Tinyman Testnet Resources</div>

            <div className="flex flex-wrap gap-2">
              <a href="https://testnet.tinyman.org" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Tinyman Testnet ↗
              </a>
              <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Get Testnet ALGO ↗
              </a>
              <a href="https://testnet.algoexplorer.io/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Block Explorer ↗
              </a>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={closeModal}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={closeModal}>close</button>
      </form>
    </dialog>
  )
}

export default PiggyBankComponent
