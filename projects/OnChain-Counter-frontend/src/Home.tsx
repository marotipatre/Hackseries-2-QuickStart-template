// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
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

        <div className="backdrop-blur-md bg-white/70 rounded-2xl p-10 shadow-xl max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-teal-700 mb-4">Algorand On-Chain Counter</h1>
          <p className="text-gray-700 mb-8">Interact with the smart contract directly from your browser.</p>

          {activeAddress && (
            <button
              data-test-id="appcalls-demo"
              className="btn bg-teal-600 text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-teal-700 transition"
              onClick={toggleAppCallsModal}
            >
              Try On-Chain Counter
            </button>
          )}
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
    </div>
  )
}

export default Home
