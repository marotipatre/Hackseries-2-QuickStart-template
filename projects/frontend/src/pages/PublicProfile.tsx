import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getUserProfile, UserProfile } from '../utils/supabase'
import { getProjectsByCreator, PiggyBankProject } from '../utils/piggybank_supabase'
import { ellipseAddress } from '../utils/ellipseAddress'

const PublicProfile = () => {
  const { walletAddress } = useParams<{ walletAddress: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<PiggyBankProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [profileResult, projectsResult] = await Promise.all([
          getUserProfile(walletAddress),
          getProjectsByCreator(walletAddress),
        ])

        setProfile(profileResult.data)
        setProjects(projectsResult.data || [])
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [walletAddress])

  const totalRaised = projects.reduce((sum, project) => sum + (project.total_deposited || 0), 0)
  const reachedGoals = projects.filter((project) => project.is_goal_reached).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
        <Navbar />
        <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto text-center">
          <p className="text-gray-500">Invalid profile URL.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto space-y-8">
        <section className="bg-white rounded-2xl border border-pink-100 p-6 md:p-8">
          <div className="flex items-start gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Creator avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-2xl font-bold text-white">
                {(profile?.name || walletAddress).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                {profile?.name || 'Creator Profile'}
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">{ellipseAddress(walletAddress)}</p>
              <p className="text-gray-600 mt-3 whitespace-pre-wrap">
                {profile?.description || 'No bio added yet.'}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                {profile?.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                    Twitter / X
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

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

        <section className="bg-white rounded-2xl border border-pink-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>

          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects created yet.</p>
          ) : (
            <div className="space-y-3">
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
                    className="block rounded-xl border border-pink-100 p-4 hover:bg-pink-50/40 transition-colors"
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
        </section>
      </main>
    </div>
  )
}

export default PublicProfile
