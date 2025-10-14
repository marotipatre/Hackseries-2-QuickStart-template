import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AssetOptInProps {
  openModal: boolean
  closeModal: () => void
}

const AssetOptIn = ({ openModal, closeModal }: AssetOptInProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [asaId, setAsaId] = useState('')
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const onOptIn = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    const id = BigInt(asaId)
    if (id <= 0n) return enqueueSnackbar('Enter a valid ASA ID', { variant: 'error' })
    setLoading(true)
    try {
      await algorand.send.assetOptIn({ sender: activeAddress, assetId: id })
      enqueueSnackbar('Opt-in successful', { variant: 'success' })
      closeModal()
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="asset_optin_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Asset Opt-In</h3>
        <div className="flex flex-col gap-3">
          <input className="input input-bordered" placeholder="ASA ID" value={asaId} onChange={(e) => setAsaId(e.target.value)} />
        </div>
        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onOptIn} disabled={loading}>Opt-In</button>
          <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
        </div>
      </form>
    </dialog>
  )
}

export default AssetOptIn

