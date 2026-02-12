// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import SendAlgo from './components/SendAlgo'
import MintNFT from './components/MintNFT'
import CreateASA from './components/CreateASA'
import AssetOptIn from './components/AssetOptIn'
import Bank from './components/Bank'
// ChainGuardian Components
import { RiskDashboard } from './components/RiskDashboard'
import { GuardianVault } from './components/GuardianVault'
import { AIAnalysisPanel } from './components/AIAnalysisPanel'
import { AuditLog } from './components/AuditLog'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [sendAlgoModal, setSendAlgoModal] = useState<boolean>(false)
  const [mintNftModal, setMintNftModal] = useState<boolean>(false)
  const [createAsaModal, setCreateAsaModal] = useState<boolean>(false)
  const [assetOptInModal, setAssetOptInModal] = useState<boolean>(false)
  const [bankModal, setBankModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-teal-400 via-cyan-300 to-sky-400 relative">
      {/* Top-right wallet connect button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          data-test-id="connect-wallet"
          className="btn btn-accent px-5 py-2 text-sm font-medium rounded-full shadow-md"
          onClick={toggleWalletModal}
        >
          {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
      </div>

      {/* Centered content with background blur for readability */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="backdrop-blur-md bg-white/70 rounded-2xl p-8 shadow-xl max-w-5xl w-full">
          <h1 className="text-4xl font-extrabold text-teal-700 mb-6 text-center">Algorand Workshop Template</h1>
          <p className="text-gray-700 mb-8 text-center">Algorand operations in one-place.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Send Algo</h2>
                <p>Send a payment transaction to any address.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setSendAlgoModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Mint NFT (ARC-3)</h2>
                <p>Upload to IPFS via Pinata and mint a single NFT.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setMintNftModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Create Token (ASA)</h2>
                <p>Mint a fungible ASA with custom supply and decimals.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setCreateAsaModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Asset Opt-In</h2>
                <p>Opt-in to any existing ASA to receive tokens.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setAssetOptInModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl md:col-span-2 lg:col-span-1">
              <div className="card-body">
                <h2 className="card-title">Counter (App ID 747652603)</h2>
                <p>Interact with the shared on-chain counter app.</p>
                <div className="card-actions justify-end">
                  <button
                    data-test-id="appcalls-demo"
                    className="btn btn-outline"
                    disabled={!activeAddress}
                    onClick={toggleAppCallsModal}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-xl md:col-span-2 lg:col-span-1">
              <div className="card-body">
                <h2 className="card-title">Bank</h2>
                <p>Deposit and withdraw ALGOs and view statements.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setBankModal(true)}>Open</button>
                </div>
              </div>
            </div>
          </div>

          {/* ChainGuardian Section */}
          <div className="divider">ChainGuardian - AI-Powered DeFi Risk Management</div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Risk Dashboard
                </h2>
                <p>View your vault status, risk score, and quick actions.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress}>View Dashboard</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Analysis
                </h2>
                <p>Analyze transactions using AI-powered risk assessment.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress}>Analyze Transaction</button>
                </div>
              </div>
            </div>
          </div>

          {/* ChainGuardian Components */}
          <div className="space-y-6 mt-6">
            <RiskDashboard />
            <GuardianVault />
            <AIAnalysisPanel />
            <AuditLog />
          </div>
        </div>
      </div>

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
