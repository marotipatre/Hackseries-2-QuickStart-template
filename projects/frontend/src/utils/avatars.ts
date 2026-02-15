export const AVAILABLE_AVATARS = ['/Avatars/1.png', '/Avatars/2.png', '/Avatars/3.png', '/Avatars/4.png', '/Avatars/5.png']

export const isValidAvatar = (avatarUrl: string): boolean => AVAILABLE_AVATARS.includes(avatarUrl)
