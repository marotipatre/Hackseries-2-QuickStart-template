import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { getApplicationAddress } from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import {
  getProjectByAppId,
  recordDeposit,
  recordWithdrawal,
  updateProjectDeposits,
  getProjectDeposits,
  PiggyBankProject,
  PiggyBankDeposit,
} from '../utils/piggybank_supabase'
import { getUserProfile, UserProfile } from '../utils/supabase'
import {
  depositToProject,
  withdrawFromProject,
  claimProjectTokens,
  getTinymanSwapUrl,
  getTinymanPoolUrl,
} from '../utils/algorand'
import Navbar from '../components/Navbar'
import { ellipseAddress } from '../utils/ellipseAddress'

const ProjectDetail = () => {
  const { appId } = useParams<{ appId: string }>()
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  const [project, setProject] = useState<PiggyBankProject | null>(null)
  const [founder, setFounder] = useState<UserProfile | null>(null)
  const [deposits, setDeposits] = useState<PiggyBankDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const appAddress = useMemo(
    () => (appId ? String(getApplicationAddress(parseInt(appId))) : ''),
    [appId]
  )

  useEffect(() => {
    const fetchAll = async () => {
      if (!appId) return
      setLoading(true)
      try {
        const { data: projectData } = await getProjectByAppId(parseInt(appId))
        if (projectData) {
          setProject(projectData)
          // Fetch founder profile
          const { data: founderData } = await getUserProfile(projectData.creator_address)
          if (founderData) setFounder(founderData)
          // Fetch deposits
          if (projectData.id) {
            const { data: depositsData } = await getProjectDeposits(projectData.id)
            if (depositsData) setDeposits(depositsData)
          }
        }
      } catch (e) {
        console.error('Failed to load project:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [appId])

  const progress = project && project.goal_amount > 0
    ? Math.min(100, ((project.total_deposited || 0) / project.goal_amount) * 100)
    : 0

  const bannerUrl = project?.image_url?.trim() || '/Banner/piggybag-banner.png'

  const handleDeposit = async () => {
    if (!activeAddress || !appId || !project) {
      enqueueSnackbar('Connect wallet first', { variant: 'error' })
      return
    }
    const amt = parseFloat(depositAmount)
    if (!amt || amt <= 0) {
      enqueueSnackbar('Enter a valid amount', { variant: 'error' })
      return
    }

    setActionLoading(true)
    try {
      const amountMicroAlgos = Math.round(amt * 1_000_000)

      // Call the smart contract's deposit method via our utility
      const { totalDeposited, txnId } = await depositToProject(
        algorand,
        parseInt(appId),
        activeAddress,
        amt,
      )

      // Record deposit in Supabase
      const newTotal = (project.total_deposited || 0) + amountMicroAlgos
      await recordDeposit({
        project_id: project.id!,
        app_id: parseInt(appId),
        depositor_address: activeAddress,
        amount: amountMicroAlgos,
        txn_id: txnId,
      })
      await updateProjectDeposits(parseInt(appId), newTotal)

      setProject({ ...project, total_deposited: newTotal })
      enqueueSnackbar(`Donated ${amt} ALGO! 🎉`, { variant: 'success' })
      setDepositAmount('')
    } catch (e) {
      enqueueSnackbar(`Deposit failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!activeAddress || !appId || !project) return
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) {
      enqueueSnackbar('Enter a valid amount', { variant: 'error' })
      return
    }
    if (activeAddress !== project.creator_address) {
      enqueueSnackbar('Only the project creator can withdraw', { variant: 'error' })
      return
    }

    setActionLoading(true)
    try {
      const { remaining, txnId } = await withdrawFromProject(
        algorand,
        parseInt(appId),
        activeAddress,
        amt,
      )

      enqueueSnackbar(`Withdrew ${amt} ALGO! Tx: ${txnId.slice(0, 8)}...`, { variant: 'success' })
      setWithdrawAmount('')

      // Record withdrawal in Supabase
      const amountMicroAlgos = Math.round(amt * 1_000_000)
      await recordWithdrawal({
        project_id: project.id!,
        app_id: parseInt(appId),
        withdrawer_address: activeAddress,
        amount: amountMicroAlgos,
        txn_id: txnId,
      })

      // Refresh project data
      const { data: projectData } = await getProjectByAppId(parseInt(appId))
      if (projectData) setProject(projectData)
    } catch (e) {
      enqueueSnackbar(`Withdrawal failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-gray-500 mb-6">This project doesn't exist or has been removed.</p>
          <Link to="/" className="text-pink-600 hover:underline font-medium">← Back to Explore</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to Explore
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="h-64 rounded-2xl overflow-hidden">
              <img src={bannerUrl} alt={project.name} className="w-full h-full object-cover" />
            </div>

            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.token_symbol && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-pink-100 text-pink-700">
                    ${project.token_symbol}
                  </span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {project.description || 'No description provided.'}
              </p>
            </div>

            {/* Links */}
            {(project.website_url || project.twitter_url || project.discord_url) && (
              <div className="flex flex-wrap gap-3">
                {project.website_url && (
                  <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
                    🌐 Website
                  </a>
                )}
                {project.twitter_url && (
                  <a href={project.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
                    🐦 Twitter
                  </a>
                )}
                {project.discord_url && (
                  <a href={project.discord_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
                    💬 Discord
                  </a>
                )}
              </div>
            )}

            {/* Founder Card */}
            <div className="bg-white rounded-xl border border-pink-100 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Founder Profile</h3>
              <div className="flex items-center gap-3">
                {founder?.avatar_url ? (
                  <img src={founder.avatar_url} alt="Founder avatar" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                    {founder?.name ? founder.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{founder?.name || 'Anonymous Founder'}</p>
                  <p className="text-xs text-gray-400 font-mono">{ellipseAddress(project.creator_address)}</p>
                  <Link to={`/profile/${project.creator_address}`} className="text-xs text-pink-600 hover:text-pink-700">
                    View creator profile
                  </Link>
                  {founder?.description && (
                    <p className="text-sm text-gray-500 mt-1">{founder.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {founder?.twitter_url && (
                    <a href={founder.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                  )}
                  {founder?.linkedin_url && (
                    <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Supporters */}
            <div className="bg-white rounded-xl border border-pink-100 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Recent Supporters ({deposits.length})
              </h3>
              {deposits.length === 0 ? (
                <p className="text-sm text-gray-400">No donations yet. Be the first!</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {deposits.slice(0, 20).map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-mono text-xs">
                        {d.depositor_address.slice(0, 6)}...{d.depositor_address.slice(-4)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {(d.amount / 1_000_000).toFixed(2)} ALGO
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl border border-pink-100 p-6 sticky top-24">
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {((project.total_deposited || 0) / 1_000_000).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">ALGO raised</span>
                </div>
                <p className="text-sm text-gray-400">
                  of {(project.goal_amount / 1_000_000).toFixed(2)} ALGO goal
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mb-6">{progress.toFixed(1)}% funded</p>

              {/* Donate form */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Support this project</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">ALGO</span>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {[1, 5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(String(amt))}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      {amt} ALGO
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={actionLoading || !activeAddress}
                  className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    '💚 Donate Now'
                  )}
                </button>

                {!activeAddress && (
                  <p className="text-xs text-center text-gray-400">Connect your wallet to donate</p>
                )}
              </div>

              {/* Creator-only: Withdraw */}
              {activeAddress && activeAddress === project.creator_address && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdraw Funds</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <button
                      onClick={handleWithdraw}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-40"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trade / Liquidity Card */}
            {project.token_id && project.token_id > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Token Trading</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Token: <span className="font-medium text-gray-800">{project.token_name}</span></p>
                  <p>ASA ID: <span className="font-mono text-gray-800">{project.token_id}</span></p>
                </div>

                <a
                  href={getTinymanSwapUrl(project.token_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-center bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  🔄 Trade on Tinyman
                </a>

                <a
                  href={getTinymanPoolUrl(project.token_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-center bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  💧 Add Liquidity
                </a>
              </div>
            )}

            {/* On-chain info */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 space-y-1">
              <p>App ID: <span className="font-mono">{project.app_id}</span></p>
              <p>Contract: <span className="font-mono">{appAddress.slice(0, 10)}...{appAddress.slice(-6)}</span></p>
              <a
                href={`https://testnet.algoexplorer.io/application/${project.app_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProjectDetail
