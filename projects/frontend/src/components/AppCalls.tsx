import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Trophy, Target, X, Sparkles } from 'lucide-react'
import { CounterClient } from '../contracts/Counter'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { openInExplorerPopup } from '../utils/explorer'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  // Fixed deployed application ID so users don't need to deploy repeatedly
  const FIXED_APP_ID = 747652603
  const [appId, setAppId] = useState<number | null>(FIXED_APP_ID)
  const [currentCount, setCurrentCount] = useState<number>(0)
  const [clickEffect, setClickEffect] = useState<boolean>(false)
  const [streak, setStreak] = useState<number>(0)
  const [showCelebration, setShowCelebration] = useState<boolean>(false)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const { enqueueSnackbar } = useSnackbar()
  const { activeAccount, activeAddress, transactionSigner: TransactionSigner } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })
  
  
  algorand.setDefaultSigner(TransactionSigner)

  // Separate function to fetch current count
  const fetchCount = async (appId: number): Promise<number> => {
    try {
      const counterClient = new CounterClient({
        appId: BigInt(appId),
        algorand,
        defaultSigner: TransactionSigner,
      })
      const state = await counterClient.appClient.getGlobalState()
      return typeof state.count.value === 'bigint' 
        ? Number(state.count.value) 
        : parseInt(state.count.value, 10)
    } catch (e) {
      enqueueSnackbar(`Error fetching count: ${(e as Error).message}`, { variant: 'error' })
      return 0
    }
  }

  // Deploy function kept for future use; commented out per request
  // const [deploying, setDeploying] = useState<boolean>(false)
  // const deployContract = async () => {
  //   setDeploying(true)
  //   try {
  //     const factory = new CounterFactory({
  //       defaultSender: activeAddress ?? undefined,
  //       algorand,
  //     })
  //     // Deploy multiple addresses with the same contract
  //     const deployResult = await factory.send.create.bare()
  //     // If you want idempotent deploy from one address
  //     // const deployResult = await factory.deploy({
  //     //   onSchemaBreak: OnSchemaBreak.AppendApp,
  //     //   onUpdate: OnUpdate.AppendApp,
  //     // })
  //     const deployedAppId = Number(deployResult.appClient.appId)
  //     setAppId(deployedAppId)
  //     const count = await fetchCount(deployedAppId)
  //     setCurrentCount(count)
  //     enqueueSnackbar(`Contract deployed with App ID: ${deployedAppId}. Initial count: ${count}`, { variant: 'success' })
  //   } catch (e) {
  //     enqueueSnackbar(`Error deploying contract: ${(e as Error).message}`, { variant: 'error' })
  //   } finally {
  //     setDeploying(false)
  //   }
  // }

  // Auto-load current count for the fixed app ID
  useEffect(() => {
    const load = async () => {
      if (appId) {
        const count = await fetchCount(appId)
        setCurrentCount(count)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, TransactionSigner])

  const incrementCounter = async () => {
    if (!appId) {
      enqueueSnackbar('Missing App ID', { variant: 'error' })
      return
    }

    setLoading(true)
    setClickEffect(true)
    
    // Calculate streak
    const now = Date.now()
    const timeDiff = now - lastClickTime
    const newStreak = timeDiff < 5000 ? streak + 1 : 1
    setStreak(newStreak)
    setLastClickTime(now)
    
    try {
      const counterClient = new CounterClient({
        appId: BigInt(appId),
        algorand,
        defaultSigner: TransactionSigner,
      })

      // Increment the counter
      const result = await counterClient.send.incrCounter({args: [], sender: activeAddress ?? undefined})
      
      // Fetch and set updated count
      const count = await fetchCount(appId)
      setCurrentCount(count)
      
      // Show celebration for milestones
      if (count % 10 === 0 || newStreak >= 5) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2000)
      }
      
      // Show success with explorer link
      if (result.transaction.txID) {
        enqueueSnackbar(`🎉 Counter incremented! New count: ${count}`, { variant: 'success' })
        // Show explorer link option immediately (no setTimeout to avoid popup blocker)
        if (window.confirm(`Counter incremented! TX ID: ${result.transaction.txID}\n\nWould you like to view the transaction on the explorer?`)) {
          openInExplorerPopup('transaction', result.transaction.txID)
        }
      } else {
        enqueueSnackbar(`🎉 Counter incremented! New count: ${count}`, { variant: 'success' })
      }
    } catch (e) {
      enqueueSnackbar(`Error incrementing counter: ${(e as Error).message}`, { variant: 'error' })
      setStreak(0)
    } finally {
      setLoading(false)
      setTimeout(() => setClickEffect(false), 300)
    }
  }

  return (
    <AnimatePresence>
      {openModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setModalState(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-dark rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Counter Game</h3>
                  <p className="text-gray-400 text-sm">Click to increment the global counter!</p>
                </div>
              </div>
              <button
                onClick={() => setModalState(false)}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{currentCount}</div>
                  <div className="text-gray-400 text-sm">Global Count</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{streak}</div>
                  <div className="text-gray-400 text-sm">Your Streak</div>
                </div>
              </div>

              {/* Game Button */}
              <div className="text-center mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={clickEffect ? { scale: [1, 1.1, 1] } : {}}
                  onClick={incrementCounter}
                  disabled={loading || !appId}
                  className={`relative w-32 h-32 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg shadow-2xl transition-all disabled:opacity-50 ${
                    loading ? 'animate-pulse' : ''
                  }`}
                >
                  {loading ? (
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <Zap className="w-8 h-8 mx-auto mb-1" />
                      CLICK!
                    </>
                  )}
                  
                  {/* Click effect particles */}
                  {clickEffect && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ 
                            scale: [0, 1, 0], 
                            opacity: [1, 1, 0],
                            x: [0, (Math.random() - 0.5) * 100],
                            y: [0, (Math.random() - 0.5) * 100]
                          }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              </div>

              {/* Streak Indicator */}
              {streak > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-4"
                >
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-4 py-2 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold">{streak}x Streak!</span>
                  </div>
                </motion.div>
              )}

              {/* App Info */}
              <div className="glass rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Smart Contract</p>
                  <p className="text-white font-mono text-sm">App ID: {appId}</p>
                </div>
              </div>

              {/* Achievements */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`text-center p-2 rounded-lg transition-colors ${
                  currentCount >= 10 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <Trophy className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs">10+ Clicks</div>
                </div>
                <div className={`text-center p-2 rounded-lg transition-colors ${
                  streak >= 5 ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <Zap className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs">5x Streak</div>
                </div>
                <div className={`text-center p-2 rounded-lg transition-colors ${
                  currentCount >= 100 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <Target className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs">Century</div>
                </div>
              </div>
            </div>

            {/* Celebration Effect */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="text-6xl animate-bounce">🎉</div>
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{ 
                          opacity: [1, 0],
                          scale: [0, 1],
                          x: (Math.random() - 0.5) * 400,
                          y: (Math.random() - 0.5) * 400
                        }}
                        transition={{ duration: 2, delay: Math.random() * 0.5 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AppCalls