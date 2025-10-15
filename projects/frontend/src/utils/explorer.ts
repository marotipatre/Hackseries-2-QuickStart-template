// Explorer utility functions
export const getNetworkFromEnv = (): 'mainnet' | 'testnet' | 'localnet' => {
  const network = import.meta.env.VITE_ALGOD_NETWORK
  console.log('Detected network:', network)
  if (network === 'mainnet') return 'mainnet'
  if (network === 'localnet') return 'localnet'
  return 'testnet' // default to testnet
}

export const getExplorerUrl = (type: 'transaction' | 'asset' | 'address' | 'application', id: string): string => {
  const network = getNetworkFromEnv()
  console.log('Getting explorer URL for network:', network, 'type:', type, 'id:', id)
  
  if (network === 'localnet') {
    // For localnet, use dappflow explorer
    return `http://localhost:8980/explorer/${type}/${id}`
  }
  
  const baseUrl = network === 'mainnet' 
    ? 'https://lora.algokit.io/mainnet' 
    : 'https://lora.algokit.io/testnet'
  
  const url = `${baseUrl}/${type}/${id}`
  console.log('Generated explorer URL:', url)
  return url
}

export const openInExplorer = (type: 'transaction' | 'asset' | 'address' | 'application', id: string): void => {
  const url = getExplorerUrl(type, id)
  console.log('Opening explorer URL:', url)
  
  // Simple, single window.open call
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Alternative: Open in a smaller popup window
export const openInExplorerPopup = (type: 'transaction' | 'asset' | 'address' | 'application', id: string): void => {
  const url = getExplorerUrl(type, id)
  console.log('Opening explorer popup:', url)
  
  const popup = window.open(
    url, 
    'explorer', 
    'width=1000,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
  )
  
  if (popup) {
    popup.focus()
  }
}

// Success message with explorer link
export const getSuccessMessage = (type: 'transaction' | 'asset' | 'application', id: string, action: string): string => {
  return `🎉 ${action} successful! ${type.charAt(0).toUpperCase() + type.slice(1)} ID: ${id}`
}