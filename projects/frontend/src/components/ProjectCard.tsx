import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PiggyBankProject } from '../utils/piggybank_supabase'
import { getUserProfile, UserProfile } from '../utils/supabase'

interface ProjectCardProps {
  project: PiggyBankProject
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [founder, setFounder] = useState<UserProfile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFounder = async () => {
      const { data } = await getUserProfile(project.creator_address)
      if (data) setFounder(data)
    }
    fetchFounder()
  }, [project.creator_address])

  const goalAlgo = (project.goal_amount / 1_000_000).toFixed(2)
  const raisedAlgo = ((project.total_deposited || 0) / 1_000_000).toFixed(2)
  const progress = project.goal_amount > 0
    ? Math.min(100, ((project.total_deposited || 0) / project.goal_amount) * 100)
    : 0

  const daysAgo = project.created_at
    ? Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const bannerUrl = project.image_url?.trim() || '/Banner/piggybag-banner.png'

  return (
    <Link
      to={`/project/${project.app_id}`}
      className="group block bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-lg hover:shadow-pink-100/50 transition-all duration-300 overflow-hidden"
    >
      {/* Project Image / Gradient Header */}
      <div className="h-40 relative overflow-hidden">
        <img
          src={bannerUrl}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {project.is_goal_reached ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
              Goal Reached
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/95 text-pink-700 border border-pink-100 backdrop-blur-sm">
              Active
            </span>
          )}
        </div>
        {/* Token badge */}
        {project.token_symbol && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-black/60 text-white backdrop-blur-sm">
              ${project.token_symbol}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-pink-700 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {project.description || 'No description provided.'}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-gray-900">{raisedAlgo} ALGO raised</span>
            <span className="text-gray-500">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Goal: {goalAlgo} ALGO</span>
            <span>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
          </div>
        </div>

        {/* Founder Info */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50">
          {founder?.avatar_url ? (
            <img src={founder.avatar_url} alt="Founder avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {founder?.name ? founder.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {founder?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-400 truncate font-mono">
              {project.creator_address.slice(0, 6)}...{project.creator_address.slice(-4)}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                navigate(`/profile/${project.creator_address}`)
              }}
              className="text-xs text-pink-600 mt-0.5 hover:text-pink-700"
            >
              View creator profile
            </button>
          </div>
          {founder?.twitter_url && (
            <a
              href={founder.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-pink-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProjectCard
