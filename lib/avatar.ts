/**
 * Get avatar URL from avatar field
 * Handles both preset avatars (e.g., "avatar-1") and custom URLs
 */
export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) {
    return '/avatars/default.png'
  }

  // If it's a URL (custom avatar), return it directly
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  // Otherwise, it's a preset avatar ID
  return `/avatars/${avatar}.png`
}

