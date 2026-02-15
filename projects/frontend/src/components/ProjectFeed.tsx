import { useEffect, useState } from 'react'
import ProjectCard from './ProjectCard'
import {
  getAllProjects,
  getTrendingProjects,
  searchProjects,
  PiggyBankProject,
} from '../utils/piggybank_supabase'

type FeedTab = 'all' | 'trending' | 'new'

const ProjectFeed = () => {
  const [projects, setProjects] = useState<PiggyBankProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FeedTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PiggyBankProject[] | null>(null)

  const fetchProjects = async (tab: FeedTab) => {
    setLoading(true)
    try {
      let result
      if (tab === 'trending') {
        result = await getTrendingProjects(20)
      } else {
        result = await getAllProjects()
      }

      if (result.data) {
        let sorted = result.data
        if (tab === 'new') {
          sorted = [...result.data].sort(
            (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )
        }
        setProjects(sorted)
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects(activeTab)
  }, [activeTab])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setLoading(true)
    try {
      const { data } = await searchProjects(searchQuery)
      setSearchResults(data || [])
    } catch (e) {
      console.error('Search failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      } else {
        setSearchResults(null)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const displayProjects = searchResults !== null ? searchResults : projects

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="relative flex-1 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all"
          />
        </div>

        <div className="flex gap-1 bg-pink-50 p-1 rounded-lg border border-pink-100">
          {(['all', 'trending', 'new'] as FeedTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); setSearchResults(null) }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab && !searchQuery
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-gray-500 hover:text-pink-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'trending' ? '🔥 Trending' : '✨ New'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {searchQuery && searchResults !== null && (
        <p className="text-sm text-gray-500 mb-4">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-pink-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-pink-100/60" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-pink-100 rounded w-2/3" />
                <div className="h-4 bg-pink-50 rounded w-full" />
                <div className="h-4 bg-pink-50 rounded w-4/5" />
                <div className="h-2 bg-pink-50 rounded-full w-full mt-4" />
                <div className="flex items-center gap-2 pt-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full" />
                  <div className="h-4 bg-pink-50 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayProjects.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🐷</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No projects match "${searchQuery}". Try a different search.`
              : 'Be the first to create a fundraiser and bring your idea to life on Algorand!'}
          </p>
        </div>
      ) : (
        /* Project grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project) => (
            <ProjectCard key={project.id || project.app_id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectFeed
