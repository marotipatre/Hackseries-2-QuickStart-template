import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ipfsHttpUrl, pinFileToIPFS, pinJSONToIPFS } from '../utils/pinata'

interface MintNFTProps {
  openModal: boolean
  closeModal: () => void
}

const MintNFT = ({ openModal, closeModal }: MintNFTProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [name, setName] = useState('AlgoNFT')
  const [description, setDescription] = useState('My first NFT!')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  async function sha256Hex(data: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const onMint = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    if (!file) return enqueueSnackbar('Select an image', { variant: 'error' })

    setLoading(true)
    try {
      // 1) Upload image
      const filePin = await pinFileToIPFS(file)
      const imageUrl = ipfsHttpUrl(filePin.IpfsHash)

      // 2) Create metadata
      const metadata = {
        name,
        description,
        image: imageUrl,
        image_mimetype: file.type || 'image/png',
        external_url: imageUrl,
        properties: {
          simple_property: 'Dashing Item',
        },
      }

      // 3) Upload metadata
      const jsonPin = await pinJSONToIPFS(metadata)
      const metadataUrl = `${ipfsHttpUrl(jsonPin.IpfsHash)}#arc3`

      // 4) ARC-3 metadata hash (sha256 of metadata JSON bytes)
      const metaBytes = new TextEncoder().encode(JSON.stringify(metadata))
      const metaHex = await sha256Hex(metaBytes)
      const metadataHash = new Uint8Array(metaHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

      // 5) Create ASA (NFT)
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: 1n,
        decimals: 0,
        unitName: name.slice(0, 8).replace(/\s+/g, ''),
        assetName: name,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
      })

      enqueueSnackbar(`NFT minted. ASA ID: ${result.assetId}`, { variant: 'success' })
      closeModal()
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="mint_nft_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Mint NFT (ARC-3)</h3>
        <div className="flex flex-col gap-3">
          <input className="input input-bordered" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input input-bordered" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="file-input file-input-bordered" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onMint} disabled={loading}>Mint</button>
          <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
        </div>
      </form>
    </dialog>
  )
}

export default MintNFT

