import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface CreateASAProps {
  openModal: boolean
  closeModal: () => void
}

const CreateASA = ({ openModal, closeModal }: CreateASAProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [name, setName] = useState('MyToken')
  const [unit, setUnit] = useState('MTK')
  const [decimals, setDecimals] = useState('6')
  const [total, setTotal] = useState('1000000')
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const onCreate = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    setLoading(true)
    try {
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: BigInt(total),
        decimals: Number(decimals),
        unitName: unit,
        assetName: name,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        defaultFrozen: false,
      })
      enqueueSnackbar(`ASA created. ID: ${result.assetId}`, { variant: 'success' })
      closeModal()
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="create_asa_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Create Fungible Token (ASA)</h3>
        <div className="flex flex-col gap-3">
          <input className="input input-bordered" placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input input-bordered" placeholder="Unit name" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <input className="input input-bordered" placeholder="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          <input className="input input-bordered" placeholder="Total (base units)" value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onCreate} disabled={loading}>Create</button>
          <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
        </div>
      </form>
    </dialog>
  )
}

export default CreateASA

