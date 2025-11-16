'use client'

import { useState, useEffect } from 'react'
import { useMeStore } from '@/store/useMeStore'

interface DisplayNameBoxProps {
  onNameChange?: (name: string) => void
}

export default function DisplayNameBox({ onNameChange }: DisplayNameBoxProps) {
  const { user, setMe } = useMeStore()
  const [displayName, setDisplayName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setMe(data.user)
            setDisplayName(data.user.displayName || '')
          }
        } else if (res.status === 401) {
          // No session yet - will be created when they enter
          setDisplayName('Guest')
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [setMe])

  // Update display name when user changes
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName)
    }
  }, [user])

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty')
      return
    }

    if (displayName.trim().length < 3) {
      setError('Display name must be at least 3 characters')
      return
    }

    if (displayName.trim().length > 24) {
      setError('Display name must be 24 characters or less')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update display name')
      }

      const data = await res.json()
      setMe(data.user)
      setIsEditing(false)
      if (onNameChange) {
        onNameChange(data.user.displayName)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save display name')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || '')
    setIsEditing(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-3 mb-3">
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="text-xs sm:text-sm font-bold text-[#000000] mb-2">
        Your Display Name
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              } else if (e.key === 'Escape') {
                handleCancel()
              }
            }}
            className="w-full px-2 py-1.5 text-sm border-2 border-t-[#000000] border-l-[#000000] border-r-[#FFFFFF] border-b-[#FFFFFF] bg-white focus:outline-none focus:border-[#0066CC]"
            placeholder="Enter display name (3-24 characters)"
            maxLength={24}
            autoFocus
          />
          {error && (
            <div className="text-xs text-red-600">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#0066CC] text-white border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-xs font-bold hover:bg-[#0052A3] active:bg-[#003366] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-1.5 bg-[#C0C0C0] text-[#000000] border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-xs font-bold hover:bg-[#D4D0C8] active:bg-[#B0B0B0] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              Cancel
            </button>
          </div>
          <div className="text-[10px] text-gray-500">
            Press Enter to save, Esc to cancel
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#0066CC] break-words">
                {displayName || 'Guest'}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                This name will appear in chat rooms
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="ml-2 px-3 py-1 bg-[#C0C0C0] text-[#000000] border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-xs font-bold hover:bg-[#D4D0C8] active:bg-[#B0B0B0] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF] touch-manipulation whitespace-nowrap"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

