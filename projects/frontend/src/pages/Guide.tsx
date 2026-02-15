import Navbar from '../components/Navbar'

const Guide = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Getting Started Guide</h1>
          <p className="text-gray-500 mt-2">
            New to crypto? No problem. This guide will get you from zero to fundraising on Algorand in minutes.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: What is Algorand */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              <h2 className="text-xl font-semibold">What is Algorand?</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Algorand is a blockchain — think of it as a shared, transparent ledger that nobody owns but everyone can verify.
              It's fast (transactions confirm in ~3 seconds), cheap (fees are fractions of a cent), and carbon-negative.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>ALGO</strong> is the native currency. 1 ALGO ≈ $0.20 USD (varies). You'll use ALGO to create projects,
              donate to campaigns, and pay tiny transaction fees.
            </p>
          </section>

          {/* Step 2: Get a Wallet */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
              <h2 className="text-xl font-semibold">Get a Wallet</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              A wallet is like your crypto bank account. It stores your ALGO and lets you sign transactions.
              You'll need one to use PiggyBag.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://perawallet.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
              >
                <h3 className="font-semibold mb-1">Pera Wallet</h3>
                <p className="text-sm text-gray-500">Official Algorand wallet. Available on iOS, Android, and Web.</p>
                <span className="text-xs text-blue-600 font-medium mt-2 inline-block">Recommended for beginners →</span>
              </a>
              <a
                href="https://defly.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
              >
                <h3 className="font-semibold mb-1">Defly Wallet</h3>
                <p className="text-sm text-gray-500">Advanced wallet with built-in DeFi features and charts.</p>
                <span className="text-xs text-blue-600 font-medium mt-2 inline-block">For DeFi enthusiasts →</span>
              </a>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mt-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Write down your 25-word recovery phrase somewhere safe.
                If you lose it, you lose access to your funds forever. Never share it with anyone.
              </p>
            </div>
          </section>

          {/* Step 3: Get Test ALGO */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
              <h2 className="text-xl font-semibold">Get Test ALGO (Free!)</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              PiggyBag currently runs on Algorand <strong>Testnet</strong> — a practice network where tokens have no real value.
              This means you can experiment freely without spending real money.
            </p>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100 space-y-3">
              <p className="text-sm text-green-800 font-medium">How to get free test ALGO:</p>
              <ol className="text-sm text-green-700 space-y-2 ml-4 list-decimal">
                <li>
                  Go to the{' '}
                  <a
                    href="https://bank.testnet.algorand.network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-800 underline font-medium"
                  >
                    Algorand Testnet Dispenser
                  </a>
                </li>
                <li>Paste your wallet address from Pera/Defly</li>
                <li>Click "Dispense" — you'll receive 10 test ALGO instantly</li>
                <li>Switch your wallet to Testnet mode (Settings → Network → Testnet)</li>
              </ol>
            </div>
          </section>

          {/* Step 4: Connect Wallet */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
              <h2 className="text-xl font-semibold">Connect to PiggyBag</h2>
            </div>
            <ol className="text-gray-600 space-y-3 ml-4 list-decimal leading-relaxed">
              <li>Click "Connect Wallet" in the top-right corner of PiggyBag</li>
              <li>Choose your wallet provider (Pera or Defly)</li>
              <li>Approve the connection in your wallet app</li>
              <li>Your wallet address will appear — you're connected!</li>
              <li>Go to <strong>Profile</strong> and fill in your name and social links</li>
            </ol>
          </section>

          {/* Step 5: Create or Support */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">5</span>
              <h2 className="text-xl font-semibold">Create or Support a Project</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-700">🐷 As a Fundraiser</h3>
                <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                  <li>Click <strong>"Create"</strong> in the nav bar</li>
                  <li>Fill in your project name, description, and funding goal</li>
                  <li>Set up your project token (supporters receive these)</li>
                  <li>Deploy the smart contract using AlgoKit CLI</li>
                  <li>Enter the App ID and launch your fundraiser</li>
                  <li>Share your project link with friends!</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-700">💚 As a Supporter</h3>
                <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                  <li>Browse projects on the <strong>Explore</strong> page</li>
                  <li>Click on a project to see details and the founder's profile</li>
                  <li>Enter an ALGO amount and click "Donate Now"</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>You'll receive project tokens proportional to your donation</li>
                  <li>Trade tokens on Tinyman if you want</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Step 6: Token Trading */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">6</span>
              <h2 className="text-xl font-semibold">Token Trading & Liquidity</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Each project creates its own ASA token on Algorand. These tokens can be traded on{' '}
              <a href="https://testnet.tinyman.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">
                Tinyman
              </a>
              , a decentralized exchange (DEX).
            </p>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-800 mb-2">💧 What is Liquidity?</h4>
                <p className="text-purple-700 leading-relaxed">
                  Liquidity is what makes a token tradable. A liquidity pool is a pair of assets (e.g., ALGO + your token)
                  locked in a smart contract. Anyone can swap one for the other. As a project creator, you add initial
                  liquidity so supporters can trade your token.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">How to add liquidity:</h4>
                <ol className="text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Go to your project's detail page</li>
                  <li>Click "Add Liquidity" — this opens Tinyman</li>
                  <li>Provide equal value of ALGO and your project token</li>
                  <li>Confirm the transaction</li>
                  <li>Now anyone can swap ALGO for your token!</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Glossary */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-4">📖 Glossary</h2>
            <div className="space-y-3 text-sm">
              {[
                ['ALGO', 'The native currency of Algorand blockchain'],
                ['ASA', 'Algorand Standard Asset — a custom token created on Algorand (like your project token)'],
                ['Wallet', 'Software that stores your crypto keys and lets you sign transactions'],
                ['Smart Contract', 'Code that runs on the blockchain, enforcing rules automatically (like releasing funds)'],
                ['Testnet', 'A practice blockchain network with free tokens for testing'],
                ['DEX', 'Decentralized Exchange — a platform for trading tokens without a middleman'],
                ['Tinyman', 'The most popular DEX on Algorand for swapping tokens'],
                ['Liquidity Pool', 'A pair of tokens locked in a contract, enabling trading'],
                ['MBR', 'Minimum Balance Requirement — small ALGO amount needed to hold assets on Algorand'],
                ['NFT', 'Non-Fungible Token — a unique digital collectible (used for supporter rewards)'],
              ].map(([term, def]) => (
                <div key={term} className="flex gap-3">
                  <span className="font-semibold text-gray-900 w-32 flex-shrink-0">{term}</span>
                  <span className="text-gray-600">{def}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Helpful Links */}
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Helpful Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Algorand Developer Docs', url: 'https://developer.algorand.org/' },
                { label: 'Pera Wallet', url: 'https://perawallet.app/' },
                { label: 'Testnet ALGO Faucet', url: 'https://bank.testnet.algorand.network/' },
                { label: 'Tinyman DEX (Testnet)', url: 'https://testnet.tinyman.org' },
                { label: 'AlgoKit (Dev Tools)', url: 'https://developer.algorand.org/algokit/' },
                { label: 'Block Explorer', url: 'https://testnet.algoexplorer.io/' },
              ].map(({ label, url }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  {label} ↗
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Guide
