import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProjectFeed from './components/ProjectFeed'
import { getAllProjects } from './utils/piggybank_supabase'

const Home: React.FC = () => {
  const { activeAddress } = useWallet()
  const [projectCount, setProjectCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await getAllProjects()
      if (data) setProjectCount(data.length)
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-pink-50 border border-pink-100">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-pink-600">
              Student Fundraising on Algorand
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 text-gray-900 leading-[1]">
            Fund what matters.
          </h1>

          <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-xl mx-auto mb-8">
            Create a fundraiser, launch a token, and let your community support you — all on-chain, transparent, and instant.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/create"
              className="px-8 py-3 bg-pink-600 text-white font-medium rounded-full hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/25"
            >
              Start a Fundraiser
            </Link>
            <Link
              to="/guide"
              className="px-8 py-3 bg-white text-gray-700 font-medium rounded-full hover:bg-pink-50 transition-colors border border-pink-100"
            >
              New to Crypto? Start Here
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-16">
          <div className="text-center py-4">
            <span className="text-2xl font-bold text-gray-900">{projectCount || '—'}</span>
            <p className="text-xs text-gray-500 mt-1">Projects</p>
          </div>
          <div className="text-center py-4 border-x border-gray-200">
            <span className="text-2xl font-bold text-gray-900">Testnet</span>
            <p className="text-xs text-gray-500 mt-1">Network</p>
          </div>
          <div className="text-center py-4">
            <span className="text-2xl font-bold text-gray-900">$0</span>
            <p className="text-xs text-gray-500 mt-1">Fees to Donate</p>
          </div>
        </div>

        {/* Project Feed */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Explore Projects</h2>
            {activeAddress && (
              <Link
                to="/create"
                className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                + Create Project
              </Link>
            )}
          </div>
          <ProjectFeed />
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How PiggyBag Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl mx-auto mb-4">
                🐷
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Create a Project</h3>
              <p className="text-sm text-gray-500">
                Describe your idea, set a funding goal, and launch your own token.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4">
                💚
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Get Funded</h3>
              <p className="text-sm text-gray-500">
                Supporters donate ALGO and receive your project tokens in return.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center text-2xl mx-auto mb-4">
                🔄
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Trade & Grow</h3>
              <p className="text-sm text-gray-500">
                Tokens are tradable on Tinyman DEX. Add liquidity, build community.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 pb-4 text-center">
          <p className="text-sm text-gray-400">
            PiggyBag — Built on Algorand. Transparent. Instant.{' '}
            <a href="https://developer.algorand.org" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">
              Learn about Algorand →
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

export default Home
