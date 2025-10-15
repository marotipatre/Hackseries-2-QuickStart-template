import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import algosdk, { getApplicationAddress, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk'
import { AlgorandClient, microAlgos } from '@algorandfoundation/algokit-utils'
import { BankClient, BankFactory } from '../contracts/Bank'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface BankProps {
  openModal: boolean
  closeModal: () => void
}

type Statement = {
  id: string
  round: number
  amount: number
  type: 'deposit' | 'withdrawal'
  sender: string
  receiver: string
  timestamp?: number
}

const Bank = ({ openModal, closeModal }: BankProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])
  const [appId, setAppId] = useState<number | ''>(747661600)
  const [deploying, setDeploying] = useState<boolean>(false)
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [statements, setStatements] = useState<Statement[]>([])
  const [depositors, setDepositors] = useState<Array<{ address: string; amount: string }>>([])
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'statements' | 'depositors'>('deposit')

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const appAddress = useMemo(() => (appId && appId > 0 ? String(getApplicationAddress(appId)) : ''), [appId])

  const quickDepositAmounts = ['1', '5', '10', '25', '50']
  const quickWithdrawAmounts = ['1', '5', '10', '25']

  const refreshStatements = async () => {
    try {
      if (!appId || !activeAddress) return
      const idx = algorand.client.indexer
      const appAddr = String(getApplicationAddress(appId))
      const allTransactions: Statement[] = []
      
      const appTxRes = await idx
        .searchForTransactions()
        .address(activeAddress)
        .txType('appl')
        .do()
      
      const appTransactions = (appTxRes.transactions || [])
        .filter((t: any) => {
          const isOurApp = t.applicationTransaction && 
                          Number(t.applicationTransaction.applicationId) === Number(appId)
          return isOurApp
        })
        .map((t: any) => {
        let amount = 1
        let type: 'deposit' | 'withdrawal' = 'deposit'
        
        if (t.logs && t.logs.length > 0) {
          const logStr = t.logs.join(' ')
          if (logStr.includes('withdraw') || logStr.includes('Withdraw')) {
            type = 'withdrawal'
          }
        }
        
        if (t.innerTxns && t.innerTxns.length > 0) {
          for (const innerTxn of t.innerTxns) {
            if (innerTxn.paymentTransaction) {
              amount = Number(innerTxn.paymentTransaction.amount) / 1000000
              if (innerTxn.sender === appAddr && innerTxn.paymentTransaction.receiver === activeAddress) {
                type = 'withdrawal'
              }
              break
            }
          }
        }
        
        return {
          id: t.id,
          round: Number(t.confirmedRound || t['confirmed-round']),
          amount,
          type,
          sender: t.sender,
          receiver: appAddr,
          timestamp: Number(t.roundTime || t['round-time']),
        }
      })
      
      allTransactions.push(...appTransactions)
      setStatements(allTransactions.sort((a, b) => b.round - a.round))
    } catch (e) {
      console.error('Error in refreshStatements:', e)
      enqueueSnackbar(`Error loading statements: ${(e as Error).message}`, { variant: 'error' })
    }
  }

  const refreshDepositors = async () => {
    try {
      if (!appId) return
      const algod = algorand.client.algod
      const boxes = await algod.getApplicationBoxes(appId).do()
      const list = [] as Array<{ address: string; amount: string }>
      for (const b of boxes.boxes as Array<{ name: Uint8Array }>) {
        const nameBytes: Uint8Array = b.name
        if (nameBytes.length !== 32) continue
        const box = await algod.getApplicationBoxByName(appId, nameBytes).do()
        const addr = algosdk.encodeAddress(nameBytes)
        const valueBuf: Uint8Array = box.value
        const amountMicroAlgos = BigInt(new DataView(Buffer.from(valueBuf).buffer).getBigUint64(0, false))
        const amountAlgos = (Number(amountMicroAlgos) / 1000000).toString()
        list.push({ address: addr, amount: amountAlgos })
      }
      setDepositors(list)
    } catch (e) {
      enqueueSnackbar(`Error loading depositors: ${(e as Error).message}`, { variant: 'error' })
    }
  }

  useEffect(() => {
    void refreshStatements()
    void refreshDepositors()
  }, [appId, activeAddress])

  const deposit = async () => {
    try {
      if (!activeAddress || activeAddress.trim() === '') throw new Error('Please connect your wallet first')
      if (!transactionSigner) throw new Error('Wallet signer unavailable')
      if (!appId || appId <= 0) throw new Error('Enter valid App ID')
      const amountAlgos = Number(depositAmount)
      if (!amountAlgos || amountAlgos <= 0) throw new Error('Enter amount in Algos')
      const amountMicroAlgos = Math.round(amountAlgos * 1000000)
      setLoading(true)

      const sp = await algorand.client.algod.getTransactionParams().do()
      const appAddr = getApplicationAddress(appId)
      
      const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appAddr,
        amount: amountMicroAlgos,
        suggestedParams: sp,
      })

      const client = new BankClient({ 
        appId: BigInt(appId), 
        algorand, 
        defaultSigner: transactionSigner 
      })
      
      const res = await client.send.deposit({ 
        args: { 
          memo: memo || '', 
          payTxn: { txn: payTxn, signer: transactionSigner } 
        }, 
        sender: activeAddress 
      })
      
      enqueueSnackbar(`💰 Deposited ${amountAlgos} ALGO successfully!`, { variant: 'success' })
      
      setDepositAmount('')
      setMemo('')
      void refreshStatements()
      void refreshDepositors()
    } catch (e) {
      enqueueSnackbar(`Deposit failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const withdraw = async () => {
    try {
      if (!activeAddress || activeAddress.trim() === '') throw new Error('Please connect your wallet first')
      if (!transactionSigner) throw new Error('Wallet signer unavailable')
      if (!appId || appId <= 0) throw new Error('Enter valid App ID')
      const amount = Number(withdrawAmount)
      if (!amount || amount <= 0) throw new Error('Enter amount in Algos')
      const amountMicroAlgos = Math.round(amount * 1000000)
      setLoading(true)

      const client = new BankClient({ 
        appId: BigInt(appId), 
        algorand, 
        defaultSigner: transactionSigner 
      })
      
      const res = await client.send.withdraw({ 
        args: { amount: amountMicroAlgos }, 
        sender: activeAddress,
        extraFee: microAlgos(2000)
      })
      
      enqueueSnackbar(`💸 Withdrew ${amount} ALGO successfully!`, { variant: 'success' })
      
      setWithdrawAmount('')
      void refreshStatements()
      void refreshDepositors()
    } catch (e) {
      enqueueSnackbar(`Withdraw failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const deployContract = async () => {
    try {
      if (!activeAddress) throw new Error('Connect wallet')
      setDeploying(true)
      const factory = new BankFactory({ defaultSender: activeAddress, algorand })
      const result = await factory.send.create.bare()
      const newId = Number(result.appClient.appId)
      setAppId(newId)
      enqueueSnackbar(`🏦 Bank deployed successfully! App ID: ${newId}`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Deploy failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setDeploying(false)
    }
  }

  return (
    <dialog id="bank_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-4xl bg-gradient-to-br from-rose-900/90 via-pink-900/90 to-purple-900/90 backdrop-blur-xl border border-rose-500/30">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white hover:bg-white/10" 
          onClick={closeModal}
        >
          ✕
        </button>
        
        <h3 className="font-bold text-3xl mb-6 text-center bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          🏦 Algorand Bank Contract
        </h3>

        {/* App ID Section */}
        <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 mb-6">
          <div className="card-body p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-white">Application ID</span>
                </label>
                <input 
                  className="input input-bordered bg-white/10 border-rose-500/30 text-white placeholder-gray-300" 
                  type="number" 
                  value={appId} 
                  onChange={(e) => setAppId(e.target.value === '' ? '' : Number(e.target.value))} 
                  placeholder="Enter Bank App ID" 
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-white">Deploy New Bank</span>
                </label>
                <button 
                  className={`btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none ${deploying ? 'loading' : ''}`}
                  disabled={deploying || !activeAddress} 
                  onClick={(e) => { e.preventDefault(); void deployContract() }}
                >
                  {deploying ? (
                    <span className="flex items-center gap-2">
                      <span className="loading loading-spinner loading-sm"></span>
                      Deploying...
                    </span>
                  ) : (
                    '🚀 Deploy Bank'
                  )}
                </button>
              </div>
            </div>
            
            {appAddress && (
              <div className="mt-4 p-3 bg-black/20 rounded-lg">
                <div className="text-sm">
                  <span className="text-gray-400">App Address: </span>
                  <span className="text-white font-mono text-xs break-all">{appAddress}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-white/10 backdrop-blur-sm">
          <button 
            className={`tab ${activeTab === 'deposit' ? 'tab-active bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('deposit')}
          >
            💰 Deposit
          </button>
          <button 
            className={`tab ${activeTab === 'withdraw' ? 'tab-active bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('withdraw')}
          >
            💸 Withdraw
          </button>
          <button 
            className={`tab ${activeTab === 'statements' ? 'tab-active bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('statements')}
          >
            📊 Statements
          </button>
          <button 
            className={`tab ${activeTab === 'depositors' ? 'tab-active bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('depositors')}
          >
            👥 Depositors
          </button>
        </div>

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-white">Memo (Optional)</span>
              </label>
              <input 
                className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300" 
                placeholder="Add a note for this deposit..." 
                value={memo} 
                onChange={(e) => setMemo(e.target.value)} 
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-white">Amount (ALGO)</span>
              </label>
              <input 
                className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300 text-lg" 
                placeholder="0.00" 
                type="number" 
                step="0.000001" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
              />
              
              <div className="mt-3">
                <label className="label">
                  <span className="label-text-alt text-gray-400">Quick amounts:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickDepositAmounts.map((amount) => (
                    <button
                      key={amount}
                      className="btn btn-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30"
                      onClick={() => setDepositAmount(amount)}
                    >
                      {amount} ALGO
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className={`btn btn-lg w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none ${loading ? 'loading' : ''}`}
              disabled={loading || !activeAddress || !appId || !depositAmount} 
              onClick={(e) => { e.preventDefault(); void deposit() }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Depositing...
                </span>
              ) : (
                '💰 Deposit to Bank'
              )}
            </button>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-white">Amount (ALGO)</span>
              </label>
              <input 
                className="input input-bordered bg-white/10 border-yellow-500/30 text-white placeholder-gray-300 text-lg" 
                placeholder="0.00" 
                type="number" 
                step="0.000001" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)} 
              />
              
              <div className="mt-3">
                <label className="label">
                  <span className="label-text-alt text-gray-400">Quick amounts:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickWithdrawAmounts.map((amount) => (
                    <button
                      key={amount}
                      className="btn btn-sm bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300 hover:from-yellow-500/30 hover:to-orange-500/30"
                      onClick={() => setWithdrawAmount(amount)}
                    >
                      {amount} ALGO
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="alert bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400">⚠️</div>
                <div className="text-sm">
                  <p className="font-medium text-white">Withdrawal Notice</p>
                  <p className="text-gray-300">You can only withdraw funds you have previously deposited.</p>
                </div>
              </div>
            </div>

            <button 
              className={`btn btn-lg w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white border-none ${loading ? 'loading' : ''}`}
              disabled={loading || !activeAddress || !appId || !withdrawAmount} 
              onClick={(e) => { e.preventDefault(); void withdraw() }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Withdrawing...
                </span>
              ) : (
                '💸 Withdraw from Bank'
              )}
            </button>
          </div>
        )}

        {/* Statements Tab */}
        {activeTab === 'statements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white">Transaction History</h4>
              <button 
                className="btn btn-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30" 
                onClick={(e) => { e.preventDefault(); void refreshStatements() }}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="card bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 max-h-96 overflow-auto">
              <div className="card-body p-4">
                {statements.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {statements.map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl ${s.type === 'deposit' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {s.type === 'deposit' ? '💰' : '💸'}
                          </div>
                          <div>
                            <div className="font-medium text-white capitalize">{s.type}</div>
                            <div className="text-sm text-gray-400">Round {s.round}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">{s.amount} ALGO</div>
                          <a 
                            href={`https://testnet.algoexplorer.io/tx/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View Explorer
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Depositors Tab */}
        {activeTab === 'depositors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white">All Depositors</h4>
              <button 
                className="btn btn-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30" 
                onClick={(e) => { e.preventDefault(); void refreshDepositors() }}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 max-h-96 overflow-auto">
              <div className="card-body p-4">
                {depositors.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No depositors yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {depositors.map((d) => (
                      <div key={d.address} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">👤</div>
                          <div>
                            <div className="font-mono text-sm text-white">
                              {d.address.slice(0, 8)}...{d.address.slice(-8)}
                            </div>
                            <a 
                              href={`https://testnet.algoexplorer.io/address/${d.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-xs underline"
                            >
                              View Address
                            </a>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-400">{d.amount} ALGO</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-action mt-6">
          <button 
            className="btn btn-ghost text-gray-300 hover:bg-white/10" 
            onClick={closeModal} 
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Bank