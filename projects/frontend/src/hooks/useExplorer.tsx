import { useState } from 'react'
import { getExplorerUrl } from '../utils/explorer'
import ExplorerModal from '../components/ExplorerModal'

export const useExplorer = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [explorerUrl, setExplorerUrl] = useState('')
  const [explorerTitle, setExplorerTitle] = useState('')

  const openExplorer = (type: 'transaction' | 'asset' | 'address' | 'application', id: string) => {
    const url = getExplorerUrl(type, id)
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${id.slice(0, 8)}...${id.slice(-8)}`
    
    setExplorerUrl(url)
    setExplorerTitle(title)
    setIsOpen(true)
  }

  const closeExplorer = () => {
    setIsOpen(false)
  }

  const ExplorerModalComponent = () => (
    <ExplorerModal
      isOpen={isOpen}
      onClose={closeExplorer}
      url={explorerUrl}
      title={explorerTitle}
    />
  )

  return {
    openExplorer,
    closeExplorer,
    ExplorerModal: ExplorerModalComponent
  }
}

export default useExplorer