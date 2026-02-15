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

  const onSend = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    const microAlgos = BigInt(Math.floor(Number(amount) * 1e6))
    if (!to || microAlgos <= 0n) return enqueueSnackbar('Enter valid address and amount', { variant: 'error' })
    setLoading(true)
    try {
      await algorand.send.payment({ sender: activeAddress, receiver: to, amount: algokit.microAlgos(microAlgos) })
      enqueueSnackbar('Payment sent', { variant: 'success' })
      closeModal()
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="send_algo_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Send Algo</h3>
        <div className="flex flex-col gap-3">
          <input className="input input-bordered" placeholder="Recipient address" value={to} onChange={(e) => setTo(e.target.value)} />
          <input className="input input-bordered" placeholder="Amount (ALGO)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onSend} disabled={loading}>Send</button>
          <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
        </div>
      </form>
    </dialog>
  )
}

export default SendAlgo

