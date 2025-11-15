'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PulseWindowShell from '@/components/PulseWindowShell'
import { getAvatarUrl } from '@/lib/avatar'

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
  createdAt: string
}

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen flex items-center justify-center bg-yahoo-bg">
        <PulseWindowShell title="Loading...">
          <div className="text-sm text-yahoo-text p-4">Loading profile...</div>
        </PulseWindowShell>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yahoo-bg">
        <PulseWindowShell title="Profile Not Found">
          <div className="text-sm text-yahoo-text p-4">User not found</div>
        </PulseWindowShell>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-yahoo-bg p-4">
      <PulseWindowShell title={`${profile.displayName}'s Profile`}>
        <div className="max-w-md">
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
                <div className="text-xs text-yahoo-textMuted mt-1">
                  {profile.bio}
                </div>
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
      </PulseWindowShell>
    </div>
  )
}

