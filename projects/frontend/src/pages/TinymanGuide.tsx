import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

const TinymanGuide = () => {
  const [searchParams] = useSearchParams()
  const tokenIdParam = searchParams.get('tokenId')

  const tokenId = useMemo(() => {
    const parsed = Number(tokenIdParam)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [tokenIdParam])

  const testnetPoolUrl = tokenId
    ? `https://testnet.tinyman.org/#/pool/add-liquidity?asset_1=0&asset_2=${tokenId}`
    : 'https://testnet.tinyman.org/#/pool/add-liquidity'

  const testnetSwapUrl = tokenId
    ? `https://testnet.tinyman.org/#/swap?asset_in=0&asset_out=${tokenId}`
    : 'https://testnet.tinyman.org/#/swap'

  const mainnetPoolUrl = tokenId
    ? `https://app.tinyman.org/#/pool/add-liquidity?asset_1=0&asset_2=${tokenId}`
    : 'https://app.tinyman.org/#/pool/add-liquidity'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tinyman Trading Launch Guide</h1>
          <p className="text-gray-500 mt-2">
            Launch your token for trading by creating the first ALGO/token liquidity pool on Tinyman.
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Before You Start</h2>
            <ul className="list-disc ml-5 text-gray-600 space-y-2 text-sm">
              <li>Use the same creator wallet that launched your PiggyBag project.</li>
              <li>Confirm your wallet holds your project token and enough ALGO for fees.</li>
              <li>If you are testing, keep wallet and Tinyman on Testnet.</li>
            </ul>
            {tokenId && (
              <p className="mt-4 text-sm text-gray-700">
                Token detected from URL: <span className="font-mono font-semibold">{tokenId}</span>
              </p>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">How to Launch Trading</h2>
            <ol className="list-decimal ml-5 text-gray-600 space-y-2 text-sm">
              <li>Open Tinyman pool add-liquidity page.</li>
              <li>Select ALGO as one asset and your token as the second asset.</li>
              <li>Set starting amounts for both assets (this sets the initial price).</li>
              <li>Approve any required token opt-ins and transaction signatures.</li>
              <li>Confirm liquidity add transaction.</li>
              <li>After pool creation, share the swap link so users can trade.</li>
            </ol>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Direct Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={testnetPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-purple-600 text-white text-sm font-medium text-center hover:bg-purple-700 transition-colors"
              >
                Open Testnet Pool
              </a>
              <a
                href={testnetSwapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium text-center hover:bg-black transition-colors"
              >
                Open Testnet Swap
              </a>
              <a
                href={mainnetPoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-white border border-gray-300 text-sm font-medium text-center hover:bg-gray-50 transition-colors"
              >
                Open Mainnet Pool
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default TinymanGuide
