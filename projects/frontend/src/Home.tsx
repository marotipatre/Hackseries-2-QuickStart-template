import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState, useEffect } from 'react'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import SendAlgo from './components/SendAlgo'
import MintNFT from './components/MintNFT'
import CreateASA from './components/CreateASA'
import AssetOptIn from './components/AssetOptIn'
import Bank from './components/Bank'

interface HomeProps {}

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  )
}

// Matrix rain effect
const MatrixRain = () => {
  const columns = Array.from({ length: 15 }, (_, i) => i)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {columns.map((i) => (
        <div
          key={i}
          className="absolute text-green-400 text-xs font-mono animate-matrix"
          style={{
            left: `${(i * 100) / 15}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        >
          {Array.from({ length: 20 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
        </div>
      ))}
    </div>
  )
}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [sendAlgoModal, setSendAlgoModal] = useState<boolean>(false)
  const [mintNftModal, setMintNftModal] = useState<boolean>(false)
  const [createAsaModal, setCreateAsaModal] = useState<boolean>(false)
  const [assetOptInModal, setAssetOptInModal] = useState<boolean>(false)
  const [bankModal, setBankModal] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { activeAddress } = useWallet()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const cardData = [
    {
      title: "Send Algo",
      description: "Send payment transactions to any address with lightning speed",
      gradient: "from-sky-500 via-blue-500 to-cyan-500",
      icon: "💸",
      action: () => setSendAlgoModal(true)
    },
    {
      title: "Mint NFT (ARC-3)",
      description: "Create unique digital collectibles with IPFS storage",
      gradient: "from-fuchsia-500 via-purple-500 to-pink-500",
      icon: "🎨",
      action: () => setMintNftModal(true)
    },
    {
      title: "Create Token (ASA)",
      description: "Launch your own fungible tokens with custom parameters",
      gradient: "from-emerald-500 via-teal-500 to-green-500",
      icon: "🪙",
      action: () => setCreateAsaModal(true)
    },
    {
      title: "Asset Opt-In",
      description: "Opt-in to receive any existing Algorand Standard Asset",
      gradient: "from-indigo-500 via-blue-600 to-purple-500",
      icon: "🔗",
      action: () => setAssetOptInModal(true)
    },
    {
      title: "Counter App",
      description: "Interact with on-chain smart contract applications",
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      icon: "🔢",
      action: toggleAppCallsModal
    },
    {
      title: "Bank Contract",
      description: "Deposit, withdraw ALGOs and view transaction history",
      gradient: "from-rose-500 via-red-500 to-pink-500",
      icon: "🏦",
      action: () => setBankModal(true)
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient" />
      <div className="absolute inset-0 cyber-grid" />
      <FloatingParticles />
      <MatrixRain />
      
      {/* Mouse follower effect */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transition: 'all 0.1s ease-out'
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white holographic">
              AlgoForge
            </h1>
          </div>
          
          <button
            data-test-id="connect-wallet"
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 interactive-hover ${
              activeAddress 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 animate-pulse-glow' 
                : 'glass text-white border-2 border-blue-400/50 hover:border-blue-400'
            }`}
            onClick={toggleWalletModal}
          >
            {activeAddress ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Connected
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-4 sm:px-6 pb-12">
        {/* Hero section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-neon">
            Build on <span className="holographic">Algorand</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience the future of blockchain development with lightning-fast transactions, 
            minimal fees, and carbon-neutral consensus.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              ⚡ 4.5s Finality
            </span>
            <span className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              💰 $0.001 Fees
            </span>
            <span className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              🌱 Carbon Negative
            </span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {cardData.map((card, index) => (
              <div
                key={card.title}
                className="group relative glass-dark rounded-2xl p-6 sm:p-8 interactive-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="text-4xl mb-4 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                    {card.icon}
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:holographic transition-all duration-300">
                    {card.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {card.description}
                  </p>
                  
                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      activeAddress
                        ? `bg-gradient-to-r ${card.gradient} text-white hover:shadow-lg hover:scale-105 active:scale-95`
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!activeAddress}
                    onClick={card.action}
                  >
                    {activeAddress ? 'Launch' : 'Connect Wallet First'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-20">
          <div className="glass-dark rounded-2xl p-6 sm:p-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 holographic">
              Why Algorand?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2 animate-neon">
                  1000+
                </div>
                <div className="text-gray-300">TPS Throughput</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2 animate-neon">
                  99.99%
                </div>
                <div className="text-gray-300">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2 animate-neon">
                  0.001$
                </div>
                <div className="text-gray-300">Transaction Cost</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
      <SendAlgo openModal={sendAlgoModal} closeModal={() => setSendAlgoModal(false)} />
      <MintNFT openModal={mintNftModal} closeModal={() => setMintNftModal(false)} />
      <CreateASA openModal={createAsaModal} closeModal={() => setCreateAsaModal(false)} />
      <AssetOptIn openModal={assetOptInModal} closeModal={() => setAssetOptInModal(false)} />
      <Bank openModal={bankModal} closeModal={() => setBankModal(false)} />
    </div>
  )
}

export default Home
