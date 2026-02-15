import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { useSnackbar } from 'notistack'
import ConnectWallet from '../components/ConnectWallet'
import Navbar from '../components/Navbar'
import { getProjectsByCreator, PiggyBankProject } from '../utils/piggybank_supabase'
import { AVAILABLE_AVATARS } from '../utils/avatars'

const Profile: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { isAuthenticated, isLoading, userProfile, walletAddress, saveProfile, isNewUser } = useAuth()

  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    twitter_url: '',
    linkedin_url: '',
    avatar_url: AVAILABLE_AVATARS[0],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<PiggyBankProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        description: userProfile.description || '',
        twitter_url: userProfile.twitter_url || '',
        linkedin_url: userProfile.linkedin_url || '',
        avatar_url: userProfile.avatar_url || AVAILABLE_AVATARS[0],
      })
    }
  }, [userProfile])

  useEffect(() => {
    const fetchProjects = async () => {
      if (!walletAddress || !isAuthenticated) {
        setProjects([])
        return
      }

      setProjectsLoading(true)
      try {
        const { data } = await getProjectsByCreator(walletAddress)
        setProjects(data || [])
      } finally {
        setProjectsLoading(false)
      }
    }

    fetchProjects()
  }, [walletAddress, isAuthenticated])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    setIsSaving(true)
    const result = await saveProfile(formData)
    setIsSaving(false)

    if (result.success) {
      enqueueSnackbar('Profile saved successfully!', { variant: 'success' })
    } else {
      enqueueSnackbar(`Error saving profile: ${result.error}`, { variant: 'error' })
    }
  }

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const totalRaised = projects.reduce((sum, item) => sum + (item.total_deposited || 0), 0)
  const reachedGoals = projects.filter((item) => item.is_goal_reached).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {isNewUser ? 'Create your profile' : 'Your profile'}
            </h1>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Build trust with supporters by sharing who you are and keeping your project profiles updated.
            </p>
            {walletAddress && (
              <p className="text-sm text-gray-500 mt-3">
                Wallet: <span className="font-mono text-gray-700">{ellipseAddress(walletAddress)}</span>
              </p>
            )}
          </div>
          <button
            className={`text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 ${
              isAuthenticated
                ? 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-100'
                : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-500/25'
            }`}
            onClick={toggleWalletModal}
          >
            {isAuthenticated ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
        </section>

        {isAuthenticated && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-pink-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Projects Created</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{(totalRaised / 1_000_000).toFixed(2)} ALGO</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Goals Reached</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reachedGoals}</p>
            </div>
          </section>
        )}

        {!isAuthenticated ? (
          <section className="bg-white rounded-2xl border border-pink-100 p-12 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Connect your wallet</h3>
            <p className="text-gray-500 mb-6">Connect to view your profile and manage your fundraiser projects.</p>
            <button
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 font-semibold rounded-xl transition-colors"
              onClick={toggleWalletModal}
            >
              Connect Wallet
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-pink-100 p-6 md:p-8">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading profile...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Avatar</label>
                    <div className="grid grid-cols-5 gap-3">
                      {AVAILABLE_AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar_url: avatar }))}
                          className={`rounded-full p-1 border-2 transition-colors ${formData.avatar_url === avatar ? 'border-pink-500' : 'border-transparent hover:border-pink-200'}`}
                        >
                          <img src={avatar} alt="Avatar option" className="w-full aspect-square rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-pink-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-colors"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio / Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell supporters about yourself and why your work matters..."
                      rows={4}
                      className="w-full px-4 py-3 border border-pink-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-colors resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.description.length}/500 characters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter / X URL
                      </label>
                      <input
                        type="url"
                        id="twitter_url"
                        name="twitter_url"
                        value={formData.twitter_url}
                        onChange={handleInputChange}
                        placeholder="https://x.com/username"
                        className="w-full px-4 py-3 border border-pink-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        id="linkedin_url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-3 border border-pink-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      isNewUser ? 'Create Profile' : 'Save Profile'
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-pink-100 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile Preview</h3>
                <div className="flex items-start gap-3">
                  <img src={formData.avatar_url} alt="Selected avatar" className="w-12 h-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-gray-900 font-semibold truncate">{formData.name || 'Your Name'}</p>
                    <p className="text-sm text-gray-500 line-clamp-3">{formData.description || 'Add a short bio to build trust with supporters.'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-pink-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Project Profiles</h3>
                  <Link to="/create" className="text-sm font-medium text-pink-600 hover:text-pink-700">+ Create</Link>
                </div>

                {projectsLoading ? (
                  <p className="text-sm text-gray-500">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    <p>No projects yet.</p>
                    <Link to="/create" className="text-pink-600 hover:text-pink-700 font-medium">Launch your first fundraiser →</Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {projects.map((project) => {
                      const raised = (project.total_deposited || 0) / 1_000_000
                      const goal = project.goal_amount / 1_000_000
                      const progress = project.goal_amount > 0
                        ? Math.min(100, ((project.total_deposited || 0) / project.goal_amount) * 100)
                        : 0

                      return (
                        <Link
                          key={project.app_id}
                          to={`/project/${project.app_id}`}
                          className="block rounded-xl border border-pink-100 p-3 hover:bg-pink-50/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 line-clamp-1">{project.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                              {project.is_goal_reached ? 'Reached' : 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{raised.toFixed(2)} / {goal.toFixed(2)} ALGO</p>
                          <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${progress}%` }} />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default Profile
