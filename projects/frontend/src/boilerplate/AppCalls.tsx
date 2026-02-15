import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { CounterClient } from '../contracts/Counter'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

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
    try {
      const counterClient = new CounterClient({
        appId: BigInt(appId),
        algorand,
        defaultSigner: TransactionSigner,
      })

      // Increment the counter
      await counterClient.send.incrCounter({args: [], sender: activeAddress ?? undefined})
      
      // Fetch and set updated count
      const count = await fetchCount(appId)
      setCurrentCount(count)
      
      enqueueSnackbar(`Counter incremented! New count: ${count}`, { 
        variant: 'success' 
      })
    } catch (e) {
      enqueueSnackbar(`Error incrementing counter: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box bg-white shadow-2xl rounded-2xl p-8">
        <h3 className="font-bold text-2xl mb-2 text-apple-dark">Campaign Tracker</h3>
        <p className="text-apple-subtext mb-6">Real-time on-chain engagement metrics.</p>
        
        <div className="flex flex-col gap-6">
          {appId && (
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex flex-col">
                <span className="text-sm text-apple-subtext font-medium mb-1">Total Interactions</span>
                <span className="text-4xl font-bold text-apple-blue">{currentCount}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block mb-1">Contract ID</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-200 px-2 py-1 rounded">{appId}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
             <button 
              className={`btn w-full bg-apple-dark text-white hover:bg-black border-none rounded-full h-12 normal-case font-medium text-lg ${loading ? 'loading' : ''}`}
              onClick={(e) => { e.preventDefault(); void incrementCounter() }}
              disabled={loading || !appId}
            >
              {loading ? 'Recording...' : 'Record Interaction'}
            </button>
            <p className="text-xs text-center text-apple-subtext">This will create a verified transaction on the Algorand blockchain.</p>
          </div>
          
          <div className="modal-action mt-2">
            <button 
              className="btn bg-gray-100 text-apple-dark hover:bg-gray-200 border-none rounded-full normal-case font-medium min-w-[80px]" 
              onClick={(e) => { e.preventDefault(); setModalState(false) }}
              disabled={loading}
            >
              Close
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}

export default AppCalls