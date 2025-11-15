'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { useMeStore } from '@/store/useMeStore'
import ProfileEditor from './ProfileEditor'

interface ChattersListProps {
  roomSlug: string | null
}

export default function ChattersList({ roomSlug }: ChattersListProps) {
  const { onlineUsersByRoom } = useChatStore()
  const { user: me } = useMeStore()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [status, setStatus] = useState("I'm Available")
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  const users = roomSlug ? onlineUsersByRoom[roomSlug] || [] : []

  return (
    <div className="w-64 bg-gray-100 border-l-2 border-gray-400 flex flex-col h-full">
      {/* Title Bar */}
      <div
        className="yahoo-header flex justify-between items-center flex-shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #1C54B3 0%, #3B7DD8 50%, #1C54B3 100%)',
        }}
      >
        <span className="text-white font-bold text-sm">Chatters</span>
        <div className="flex gap-1">
          <button className="text-white hover:bg-blue-700 px-2 text-xs">_</button>
          <button className="text-white hover:bg-red-600 px-2 text-xs">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex gap-2">
        <select className="text-xs bg-white border border-gray-400 px-1 py-0.5 flex-1">
          <option>Menu</option>
        </select>
        <select className="text-xs bg-white border border-gray-400 px-1 py-0.5 flex-1">
          <option>Emotions</option>
        </select>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {users.length === 0 ? (
          <div className="px-2 py-4 text-xs text-gray-500 text-center">
            No users online
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`px-2 py-1 text-xs cursor-pointer flex items-center gap-2 ${
                selectedUser === user.id
                  ? 'bg-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-yellow-500">☺</span>
              <span className="flex-1 truncate">{user.displayName}</span>
            </div>
          ))
        )}
      </div>

      {/* Bottom Section */}
      <div className="bg-gray-200 border-t border-gray-400 p-2 space-y-2">
        {me && (
          <div className="mb-2 pb-2 border-b border-gray-400">
            <div className="text-xs font-bold mb-1">You:</div>
            <div className="text-xs text-gray-700 mb-1">{me.displayName}</div>
            <button
              className="btn-yahoo text-xs px-2 py-1 w-full"
              onClick={() => setShowProfileEditor(true)}
            >
              Edit Profile
            </button>
          </div>
        )}
        <div className="flex gap-1">
          <button className="btn-yahoo-secondary text-xs px-3 py-1 flex-1">
            IM
          </button>
          <button className="btn-yahoo-secondary text-xs px-3 py-1 flex-1">
            Ignore
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 whitespace-nowrap">
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs bg-white border border-gray-400 px-1 py-0.5 flex-1"
          >
            <option>I&apos;m Available</option>
            <option>Busy</option>
            <option>Away</option>
            <option>Invisible</option>
          </select>
        </div>
      </div>
      {showProfileEditor && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}
    </div>
  )
}

