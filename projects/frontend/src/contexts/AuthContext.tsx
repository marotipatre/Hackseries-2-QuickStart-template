import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { getUserProfile, upsertUserProfile, UserProfile, checkUserExists } from '../utils/supabase'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  userProfile: UserProfile | null
  walletAddress: string | null
  refreshProfile: () => Promise<void>
  saveProfile: (profile: Omit<UserProfile, 'wallet_address' | 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>
  isNewUser: boolean
  needsAvatarSetup: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { activeAddress } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!activeAddress) {
      setUserProfile(null)
      setIsNewUser(false)
      return
    }

    setIsLoading(true)
    try {
      const exists = await checkUserExists(activeAddress)
      
      if (exists) {
        const { data, error } = await getUserProfile(activeAddress)
        if (!error && data) {
          setUserProfile(data)
          setIsNewUser(false)
        }
      } else {
        // New user - create a basic profile entry
        setIsNewUser(true)
        setUserProfile({
          wallet_address: activeAddress,
          name: '',
          description: '',
          twitter_url: '',
          linkedin_url: '',
          avatar_url: '',
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeAddress])

  const saveProfile = useCallback(
    async (profile: Omit<UserProfile, 'wallet_address' | 'id' | 'created_at' | 'updated_at'>) => {
      if (!activeAddress) {
        return { success: false, error: 'No wallet connected' }
      }

      setIsLoading(true)
      try {
        const { data, error } = await upsertUserProfile({
          wallet_address: activeAddress,
          ...profile,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data) {
          setUserProfile(data)
          setIsNewUser(false)
        }

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: message }
      } finally {
        setIsLoading(false)
      }
    },
    [activeAddress]
  )

  // Fetch profile when wallet connects
  useEffect(() => {
    refreshProfile()
  }, [activeAddress, refreshProfile])

  const value: AuthContextType = {
    isAuthenticated: !!activeAddress,
    isLoading,
    userProfile,
    walletAddress: activeAddress,
    refreshProfile,
    saveProfile,
    isNewUser,
    needsAvatarSetup: !!activeAddress && !isNewUser && !!userProfile && !userProfile.avatar_url,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
