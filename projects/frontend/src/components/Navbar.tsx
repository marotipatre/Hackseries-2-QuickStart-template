import { useWallet } from '@txnlab/use-wallet-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ConnectWallet from './ConnectWallet'
import { ellipseAddress } from '../utils/ellipseAddress'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const { activeAddress } = useWallet()
  const { userProfile } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <span className="text-xl font-bold tracking-tight text-gray-900">PiggyBag</span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-1 bg-pink-50/80 p-1 rounded-lg">
            <Link
              to="/"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-pink-700'
              }`}
            >
              Explore
            </Link>
            <Link
              to="/create"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/create') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-pink-700'
              }`}
            >
              Create
            </Link>
            <Link
              to="/guide"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/guide') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-pink-700'
              }`}
            >
              Guide
            </Link>
            <Link
              to="/tinyman-guide"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                isActive('/tinyman-guide') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-pink-700'
              }`}
            >
              Tinyman
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {activeAddress && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-pink-50 transition-colors"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {activeAddress.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-600 font-mono">
                  {ellipseAddress(activeAddress)}
                </span>
              </Link>
            )}
            <button
              onClick={() => setOpenWalletModal(true)}
              className={`text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 ${
                activeAddress
                  ? 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                  : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-500/25'
              }`}
            >
              {activeAddress ? 'Wallet' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-2">
          <Link
            to="/"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/') ? 'bg-pink-50 text-pink-700' : 'text-gray-500'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/create"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/create') ? 'bg-pink-50 text-pink-700' : 'text-gray-500'
            }`}
          >
            Create
          </Link>
          <Link
            to="/guide"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/guide') ? 'bg-pink-50 text-pink-700' : 'text-gray-500'
            }`}
          >
            Guide
          </Link>
          <Link
            to="/tinyman-guide"
            className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive('/tinyman-guide') ? 'bg-pink-50 text-pink-700' : 'text-gray-500'
            }`}
          >
            Tinyman
          </Link>
          {activeAddress && (
            <Link
              to="/profile"
              className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                isActive('/profile') ? 'bg-pink-50 text-pink-700' : 'text-gray-500'
              }`}
            >
              Profile
            </Link>
          )}
        </div>
      </nav>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </>
  )
}

export default Navbar
