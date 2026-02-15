import { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'
import { useAuth } from '../contexts/AuthContext'
import { AVAILABLE_AVATARS } from '../utils/avatars'

const AvatarSetupPrompt = () => {
  const { needsAvatarSetup, userProfile, saveProfile } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (needsAvatarSetup) {
      setSelectedAvatar(userProfile?.avatar_url || AVAILABLE_AVATARS[0])
      setIsOpen(true)
    }
  }, [needsAvatarSetup, userProfile?.avatar_url])

  if (!isOpen || !needsAvatarSetup || !userProfile) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveProfile({
      name: userProfile.name || '',
      description: userProfile.description || '',
      twitter_url: userProfile.twitter_url || '',
      linkedin_url: userProfile.linkedin_url || '',
      avatar_url: selectedAvatar,
    })
    setIsSaving(false)

    if (result.success) {
      enqueueSnackbar('Avatar saved!', { variant: 'success' })
      setIsOpen(false)
      return
    }

    enqueueSnackbar(`Error saving avatar: ${result.error}`, { variant: 'error' })
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-pink-100 shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-900">Set your avatar</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">Choose one avatar for your profile. You can change it anytime from your profile page.</p>

        <div className="grid grid-cols-5 gap-3">
          {AVAILABLE_AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              className={`rounded-full p-1 border-2 transition-colors ${selectedAvatar === avatar ? 'border-pink-500' : 'border-transparent hover:border-pink-200'}`}
            >
              <img src={avatar} alt="Avatar option" className="w-full aspect-square rounded-full object-cover" />
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-pink-100 text-gray-600 hover:bg-pink-50"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarSetupPrompt
