import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface SendAlgoProps {
  openModal: boolean
  closeModal: () => void
}

const SendAlgo = ({ openModal, closeModal }: SendAlgoProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const quickAmounts = ['0.1', '0.5', '1', '5', '10']

  const calculateFee = () => {
    return '0.001'
  }

  const calculateTotal = () => {
    const amountNum = Number(amount) || 0
    const feeNum = Number(calculateFee())
    return (amountNum + feeNum).toFixed(3)
  }

  const onSend = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    const microAlgos = BigInt(Math.floor(Number(amount) * 1e6))
    if (!to || microAlgos <= 0n) return enqueueSnackbar('Enter valid address and amount', { variant: 'error' })
    
    setLoading(true)
    try {
      const result = await algorand.send.payment({ 
        sender: activeAddress, 
        receiver: to, 
        amount: algokit.microAlgos(microAlgos) 
      })
      
      enqueueSnackbar(`💸 Payment sent successfully!`, { variant: 'success' })
      closeModal()
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="send_algo_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl bg-gradient-to-br from-blue-900/90 via-cyan-900/90 to-teal-900/90 backdrop-blur-xl border border-blue-500/30">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white hover:bg-white/10" 
          onClick={closeModal}
        >
          ✕
        </button>
        
        <h3 className="font-bold text-3xl mb-6 text-center bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
          💸 Send ALGO
        </h3>

        <div className="space-y-6">
          {/* Recipient Address */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-white">Recipient Address</span>
            </label>
            <input 
              className="input input-bordered bg-white/10 border-blue-500/30 text-white placeholder-gray-300" 
              placeholder="Enter Algorand address..." 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
            {to && (
              <label className="label">
                <span className={`label-text-alt ${to.length === 58 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {to.length === 58 ? '✅ Valid address format' : '⚠️ Address should be 58 characters'}
                </span>
              </label>
            )}
          </div>

          {/* Amount Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-white">Amount (ALGO)</span>
            </label>
            <input 
              className="input input-bordered bg-white/10 border-blue-500/30 text-white placeholder-gray-300 text-lg" 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.001"
              min="0"
            />
            
            {/* Quick Amount Buttons */}
            <div className="mt-3">
              <label className="label">
                <span className="label-text-alt text-gray-400">Quick amounts:</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    className="btn btn-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30"
                    onClick={() => setAmount(quickAmount)}
                  >
                    {quickAmount} ALGO
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          {amount && to && (
            <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
              <div className="card-body p-6">
                <h4 className="font-bold text-white mb-4 text-center">📋 Transaction Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-medium">{amount} ALGO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Network Fee:</span>
                    <span className="text-white font-medium">{calculateFee()} ALGO</span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-white font-bold">Total:</span>
                    <span className="text-green-400 font-bold">{calculateTotal()} ALGO</span>
                  </div>
                </div>
                
                {/* Recipient Preview */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <div className="text-sm">
                    <span className="text-gray-400">To: </span>
                    <span className="text-white font-mono text-xs break-all">
                      {to.slice(0, 10)}...{to.slice(-10)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="alert bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400">ℹ️</div>
              <div className="text-sm">
                <p className="font-medium text-white">Security Notice</p>
                <p className="text-gray-300">Always verify the recipient address before sending. Transactions on Algorand are irreversible.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action mt-6">
          <button 
            className="btn btn-ghost text-gray-300 hover:bg-white/10" 
            onClick={closeModal} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className={`btn btn-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-none ${loading ? 'loading' : ''}`}
            onClick={onSend} 
            disabled={loading || !to || !amount || Number(amount) <= 0}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Sending...
              </span>
            ) : (
              '🚀 Send Payment'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default SendAlgo