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
  const [appId, setAppId] = useState<number | ''>(0)
  const [deploying, setDeploying] = useState<boolean>(false)
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [statements, setStatements] = useState<Statement[]>([])
  const [depositors, setDepositors] = useState<Array<{ address: string; amount: string }>>([])

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const appAddress = useMemo(() => (appId && appId > 0 ? String(getApplicationAddress(appId)) : ''), [appId])

  const refreshStatements = async () => {
    try {
      if (!appId || !activeAddress) return
      const idx = algorand.client.indexer
      const appAddr = String(getApplicationAddress(appId))
      const allTransactions: Statement[] = []
      
      console.log('Searching for app transactions with app ID:', appId)
      
      // Search for application call transactions from user
      const appTxRes = await idx
        .searchForTransactions()
        .address(activeAddress)
        .txType('appl')
        .do()
      
      console.log('App call transactions found:', appTxRes.transactions?.length || 0)
      
      // Process application call transactions (deposits/withdrawals)
      const appTransactions = (appTxRes.transactions || [])
        .filter((t: any) => {
          // Filter for transactions calling our specific app
          const isOurApp = t.applicationTransaction && 
                          Number(t.applicationTransaction.applicationId) === Number(appId)
          console.log('Checking transaction:', t.id, {
            hasAppTxn: !!t.applicationTransaction,
            appId: t.applicationTransaction?.applicationId,
            targetAppId: Number(appId),
            isOurApp,
            sender: t.sender,
            activeAddress
          })
          return isOurApp
        })
        .map((t: any) => {
        // Determine transaction type from logs or method name
        let amount = 1 // Default amount
        let type: 'deposit' | 'withdrawal' = 'deposit'
        
        // Check logs for method name
        if (t.logs && t.logs.length > 0) {
          const logStr = t.logs.join(' ')
          if (logStr.includes('withdraw') || logStr.includes('Withdraw')) {
            type = 'withdrawal'
          }
        }
        
        // Check inner transactions for actual payment amounts
        if (t.innerTxns && t.innerTxns.length > 0) {
          console.log('Inner transactions for', t.id, ':', t.innerTxns)
          for (const innerTxn of t.innerTxns) {
            if (innerTxn.paymentTransaction) {
              amount = Number(innerTxn.paymentTransaction.amount) / 1000000
              // If there's an inner payment from app to user, it's definitely a withdrawal
              if (innerTxn.sender === appAddr && innerTxn.paymentTransaction.receiver === activeAddress) {
                type = 'withdrawal'
              }
              console.log('Found payment in inner txn:', { amount, type, sender: innerTxn.sender, receiver: innerTxn.paymentTransaction.receiver })
              break
            }
          }
        }
        
        // If no inner transactions found but it's a withdraw call, still show it
        console.log('Transaction', t.id, 'type:', type, 'amount:', amount)
        
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
      
      // Also search for direct payment transactions to/from app address
      const payTxRes = await idx
        .searchForTransactions()
        .address(appAddr)
        .txType('pay')
        .do()
      
      console.log('Payment transactions found:', payTxRes.transactions?.length || 0)
      
      const paymentTransactions = (payTxRes.transactions || [])
        .filter((t: any) => {
          // Only include withdrawals (app to user) and exclude deposits (user to app) 
          // since deposits are already captured in app transactions
          return (t.sender === appAddr && t.paymentTransaction?.receiver === activeAddress)
        })
        .map((t: any) => ({
          id: t.id,
          round: Number(t.confirmedRound || t['confirmed-round']),
          amount: Number(t.paymentTransaction.amount) / 1000000,
          type: t.sender === activeAddress ? 'deposit' as const : 'withdrawal' as const,
          sender: t.sender,
          receiver: t.paymentTransaction.receiver,
          timestamp: Number(t.roundTime || t['round-time']),
        }))
      
      allTransactions.push(...paymentTransactions)
      
      console.log('Total relevant transactions:', allTransactions.length)
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
        // Skip empty or non-account keys if any
        const nameBytes: Uint8Array = b.name
        if (nameBytes.length !== 32) continue
        const box = await algod.getApplicationBoxByName(appId, nameBytes).do()
        const addr = algosdk.encodeAddress(nameBytes)
        const valueBuf: Uint8Array = box.value
        // UInt64 big-endian
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, activeAddress])

  const deposit = async () => {
    try {
      if (!activeAddress || activeAddress.trim() === '') throw new Error('Please connect your wallet first')
      if (!transactionSigner) throw new Error('Wallet signer unavailable')
      if (!appId || appId <= 0) throw new Error('Enter valid App ID')
      const amountAlgos = Number(depositAmount)
      if (!amountAlgos || amountAlgos <= 0) throw new Error('Enter amount in Algos')
      const amountMicroAlgos = Math.round(amountAlgos * 1000000) // Convert to microAlgos
      setLoading(true)

      const sp = await algorand.client.algod.getTransactionParams().do()
      const appAddr = getApplicationAddress(appId)
      
      if (!algosdk.isValidAddress(activeAddress)) throw new Error('Invalid wallet address')
      if (!algosdk.isValidAddress(String(appAddr))) throw new Error('Invalid app address; check App ID')
      
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
      
      const confirmedRound = (res.confirmation as any)?.['confirmed-round']
      enqueueSnackbar(`Deposited successfully in round ${confirmedRound}`, { variant: 'success' })
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
      const amountMicroAlgos = Math.round(amount * 1000000) // Convert to microAlgos
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
      
      const confirmedRound = (res.confirmation as any)?.['confirmed-round']
      enqueueSnackbar(`Withdraw executed in round ${confirmedRound}`, { variant: 'success' })
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
      enqueueSnackbar(`Bank deployed. App ID: ${newId}`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Deploy failed: ${(e as Error).message}`, { variant: 'error' })
    } finally {
      setDeploying(false)
    }
  }

  return (
    <dialog id="bank_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg">Bank Contract</h3>
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Application ID</label>
            <input className="input input-bordered" type="number" value={appId} onChange={(e) => setAppId(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter deployed Bank App ID" />
            {appAddress && (
              <div className="alert alert-info text-xs break-all">App Address: {appAddress}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-white">
              <div className="font-semibold">Deploy (optional)</div>
              <button className={`btn btn-accent ${deploying ? 'loading' : ''}`} disabled={deploying || !activeAddress} onClick={(e) => { e.preventDefault(); void deployContract() }}>Deploy Bank</button>
              <p className="text-xs text-gray-500">Or enter an existing App ID above.</p>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-white">
              <div className="font-semibold">Deposit</div>
              <input className="input input-bordered" placeholder="Memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} />
              <input className="input input-bordered" placeholder="Amount (Algos)" type="number" step="0.000001" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              <button className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading || !activeAddress || !appId} onClick={(e) => { e.preventDefault(); void deposit() }}>Deposit</button>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-white">
              <div className="font-semibold">Withdraw</div>
              <input className="input input-bordered" placeholder="Amount (Algos)" type="number" step="0.000001" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              <button className={`btn btn-secondary ${loading ? 'loading' : ''}`} disabled={loading || !activeAddress || !appId} onClick={(e) => { e.preventDefault(); void withdraw() }}>Withdraw</button>
            </div>
          </div>

          <div className="divider">Statements</div>
          <div className="max-h-56 overflow-auto bg-white rounded-lg p-2">
            {statements.length === 0 ? (
              <div className="text-sm text-gray-500">No transactions found.</div>
            ) : (
              <ul className="text-sm">
                {statements.map((s) => (
                  <li key={s.id} className="py-1 flex justify-between items-center border-b last:border-0">
                    <span className={s.type === 'deposit' ? 'text-emerald-600' : 'text-amber-700'}>{s.type}</span>
                    <span>round {s.round}</span>
                    {/* <span>{s.amount} Algos</span> */}
                    <a 
                      href={`https://lora.algokit.io/testnet/transaction/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="divider">Depositors</div>
          <div className="max-h-56 overflow-auto bg-white rounded-lg p-2">
            {depositors.length === 0 ? (
              <div className="text-sm text-gray-500">No depositors yet.</div>
            ) : (
              <ul className="text-sm">
                {depositors.map((d) => (
                  <li key={d.address} className="py-1 flex justify-between border-b last:border-0">
                    <span className="truncate mr-2">{d.address}</span>
                    <span>{d.amount} Algos</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="modal-action">
            <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
            <button className="btn btn-outline" onClick={(e) => { e.preventDefault(); void refreshStatements(); void refreshDepositors() }}>Refresh</button>
          </div>
        </div>
      </form>
    </dialog>
  )
}

export default Bank


