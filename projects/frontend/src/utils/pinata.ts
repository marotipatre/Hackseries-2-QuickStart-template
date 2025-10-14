export interface PinataFileResult {
  IpfsHash: string
}

export interface PinataJsonResult {
  IpfsHash: string
}

export async function pinFileToIPFS(file: File): Promise<PinataFileResult> {
  const jwt = import.meta.env.VITE_PINATA_JWT
  if (!jwt) throw new Error('Missing VITE_PINATA_JWT')

  const form = new FormData()
  form.append('file', file)

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Pinata file upload failed (${res.status})`)
  return (await res.json()) as PinataFileResult
}

export async function pinJSONToIPFS(json: unknown): Promise<PinataJsonResult> {
  const jwt = import.meta.env.VITE_PINATA_JWT
  if (!jwt) throw new Error('Missing VITE_PINATA_JWT')

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  })
  if (!res.ok) throw new Error(`Pinata JSON upload failed (${res.status})`)
  return (await res.json()) as PinataJsonResult
}

export function ipfsHttpUrl(cid: string): string {
  const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://ipfs.io/ipfs'
  return `${gateway}/${cid}`
}

