'use client'

import { useState, useEffect } from 'react'
import { useMeStore } from '@/store/useMeStore'
import { getAvatarUrl } from '@/lib/avatar'

interface ProfilePopupProps {
  userId: string
  onClose: () => void
}

interface ProfileData {
  id: string
  displayName: string
  avatar: string
  bio: string | null
  tags: string[]
  wallets: Array<{
    id: string
    address: string
    addressTruncated: string
    label: string | null
    isPrimary: boolean
    resolvedHandle: string | null
    avatarUrl: string | null
  }>
}

export default function ProfilePopup({ userId, onClose }: ProfilePopupProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: me } = useMeStore()

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    // TODO: Show toast notification
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-yahoo-sidebar border-2 border-yahoo-borderDark p-4">
          <div className="text-sm text-yahoo-text">Loading...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yahoo-sidebar border-2 border-yahoo-borderDark max-w-md w-full shadow-lg">
        <div className="yahoo-header flex justify-between items-center">
          <span>{profile.displayName}&apos;s Profile</span>
          <button className="text-yahoo-headerText hover:bg-yahoo-buttonHover px-2 py-1" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-4 bg-yahoo-chatBg">
          <div className="flex items-start gap-4 mb-4">
            <img
              src={getAvatarUrl(profile.avatar)}
              alt={profile.displayName}
              className="w-16 h-16 rounded object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/avatars/default.png'
              }}
            />
            <div>
              <div className="text-sm font-bold">{profile.displayName}</div>
              {profile.bio && (
                <div className="text-xs text-yahoo-textMuted mt-1">{profile.bio}</div>
              )}
              {profile.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-yahoo-messageHover border border-yahoo-border px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.wallets.length > 0 && (
            <div className="border-t border-yahoo-border pt-4">
              <div className="text-xs font-bold mb-2">Wallets</div>
              {profile.wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-2 bg-yahoo-messageOdd border border-yahoo-border mb-1"
                >
                  <div>
                    <div className="text-xs font-semibold">
                      {wallet.label || (wallet.isPrimary ? 'Primary' : 'Wallet')}
                    </div>
                    <div className="text-[10px] text-yahoo-textMuted font-mono">
                      {wallet.addressTruncated}
                    </div>
                    {wallet.resolvedHandle && (
                      <div className="text-[10px] text-yahoo-textMuted">
                        {wallet.resolvedHandle}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-yahoo text-xs px-2"
                    onClick={() => copyAddress(wallet.address)}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

