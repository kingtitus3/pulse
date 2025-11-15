'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useMeStore } from '@/store/useMeStore'
import { getAvatarUrl } from '@/lib/avatar'

interface ProfileEditorProps {
  onClose: () => void
}

// Preset avatar options
const AVATAR_OPTIONS = [
  'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5',
  'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'avatar-10',
]

export default function ProfileEditor({ onClose }: ProfileEditorProps) {
  const { user, setMe } = useMeStore()
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('avatar-1')
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [bio, setBio] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showWallets, setShowWallets] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      // Check if avatar is a URL (custom) or preset ID
      if (user.avatar?.startsWith('http://') || user.avatar?.startsWith('https://')) {
        setCustomAvatarUrl(user.avatar)
        setAvatar('custom')
      } else {
        setAvatar(user.avatar || 'avatar-1')
        setCustomAvatarUrl(null)
      }
      setBio(user.bio || '')
      setTags(user.tags || [])
      setShowWallets(user.showWallets !== false)
    }
  }, [user])

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use custom avatar URL if set, otherwise use preset avatar ID
      const avatarValue = customAvatarUrl || avatar

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatar: avatarValue,
          bio: bio.trim() || null,
          tags,
          showWallets,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await res.json()
      setMe(data)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 8) {
      const newTag = tagInput.trim().substring(0, 20)
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 1MB for avatars)
    if (file.size > 1 * 1024 * 1024) {
      setError('Avatar must be less than 1MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      // Get upload URL
      const urlRes = await fetch('/api/avatars/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      })

      if (!urlRes.ok) {
        const data = await urlRes.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await urlRes.json()

      // Upload file
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload avatar')
      }

      // Set custom avatar
      setCustomAvatarUrl(publicUrl)
      setAvatar('custom')
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yahoo-sidebar border-2 border-yahoo-borderDark max-w-lg w-full shadow-lg">
        <div className="yahoo-header flex justify-between items-center">
          <span>Edit Profile</span>
          <button
            className="text-yahoo-headerText hover:bg-yahoo-buttonHover px-2 py-1"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4 bg-yahoo-chatBg max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 mb-3 text-xs">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-gray-700">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-yahoo w-full text-sm"
              placeholder="Enter your display name"
              maxLength={24}
            />
            <div className="text-[10px] text-gray-500 mt-1">
              3-24 characters, alphanumeric, spaces, hyphens, underscores
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-2 text-gray-700">
              Avatar
            </label>
            
            {/* Current Avatar Preview */}
            <div className="mb-3 flex items-center gap-3">
              <div className="relative">
                <img
                  src={customAvatarUrl || getAvatarUrl(avatar)}
                  alt="Current avatar"
                  className="w-16 h-16 border-2 border-gray-400 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/avatars/default.png'
                  }}
                />
                {customAvatarUrl && (
                  <button
                    onClick={() => {
                      setCustomAvatarUrl(null)
                      setAvatar('avatar-1')
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    title="Remove custom avatar"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  className="btn-yahoo-secondary text-xs px-3 py-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Custom Avatar'}
                </button>
                <div className="text-[10px] text-gray-500 mt-1">
                  Max 1MB, PNG/JPEG/WebP/GIF
                </div>
              </div>
            </div>

            {/* Preset Avatars */}
            <div className="mb-2">
              <div className="text-[10px] text-gray-600 mb-1">Or choose a preset:</div>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((avatarId) => (
                  <button
                    key={avatarId}
                    onClick={() => {
                      setAvatar(avatarId)
                      setCustomAvatarUrl(null)
                    }}
                    className={`border-2 p-1 ${
                      avatar === avatarId && !customAvatarUrl
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={`/avatars/${avatarId}.png`}
                      alt={avatarId}
                      className="w-full h-auto"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/avatars/default.png'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-gray-700">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-yahoo w-full text-sm resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
              maxLength={280}
            />
            <div className="text-[10px] text-gray-500 mt-1">
              {bio.length}/280 characters
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-gray-700">
              Tags ({tags.length}/8)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="input-yahoo flex-1 text-sm"
                placeholder="Add a tag..."
                maxLength={20}
              />
              <button
                className="btn-yahoo text-xs px-3"
                onClick={handleAddTag}
                disabled={tags.length >= 8 || !tagInput.trim()}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-yahoo-messageHover border border-yahoo-border px-2 py-0.5 text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Show Wallets */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={showWallets}
                onChange={(e) => setShowWallets(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show wallets on profile</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              className="btn-yahoo-secondary text-xs px-4 py-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn-yahoo text-xs px-4 py-2"
              onClick={handleSave}
              disabled={loading || !displayName.trim()}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

