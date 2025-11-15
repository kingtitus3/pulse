'use client'

import { useState } from 'react'
import ProfileEditor from './ProfileEditor'

interface ChatToolsProps {
  onJoinRoom: () => void
}

export default function ChatTools({ onJoinRoom }: ChatToolsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  return (
    <div className="w-48 bg-gray-200 border-r-2 border-gray-400 flex flex-col h-full">
      {/* Top Bar */}
      <div
        className="yahoo-header flex justify-between items-center flex-shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #1C54B3 0%, #3B7DD8 50%, #1C54B3 100%)',
        }}
      >
        <span className="text-white font-bold text-xs">Pulse</span>
      </div>

      {/* Tool Buttons */}
      <div className="p-2 space-y-1">
        <button
          onClick={() => setActiveTab(activeTab === 'tools' ? null : 'tools')}
          className={`w-full px-3 py-2 text-xs text-left border-2 ${
            activeTab === 'tools'
              ? 'border-blue-500 bg-blue-100'
              : 'border-gray-400 bg-gray-100 hover:bg-gray-50'
          }`}
          style={{
            boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)',
          }}
        >
          Chat Tools
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'settings' ? null : 'settings')}
          className={`w-full px-3 py-2 text-xs text-left border-2 ${
            activeTab === 'settings'
              ? 'border-blue-500 bg-blue-100'
              : 'border-gray-400 bg-gray-100 hover:bg-gray-50'
          }`}
          style={{
            boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)',
          }}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'favorites' ? null : 'favorites')}
          className={`w-full px-3 py-2 text-xs text-left border-2 ${
            activeTab === 'favorites'
              ? 'border-blue-500 bg-blue-100'
              : 'border-gray-400 bg-gray-100 hover:bg-gray-50'
          }`}
          style={{
            boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)',
          }}
        >
          Favorite Rooms
        </button>
        <button
          onClick={onJoinRoom}
          className={`w-full px-3 py-2 text-xs text-left border-2 border-gray-400 bg-gray-100 hover:bg-gray-50`}
          style={{
            boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)',
          }}
        >
          Change Room
        </button>
      </div>

      {/* Dynamic Content Area */}
      {activeTab && (
        <div className="flex-1 bg-white border-t-2 border-gray-400 p-2 overflow-y-auto">
          {activeTab === 'tools' && (
            <div className="text-xs text-gray-700">
              <div className="mb-2 font-bold">Chat Tools</div>
              <div className="space-y-1">
                <div
                  className="cursor-pointer hover:bg-gray-100 px-1 py-0.5"
                  onClick={() => setShowProfileEditor(true)}
                >
                  Edit My Profile
                </div>
                <div className="cursor-pointer hover:bg-gray-100 px-1 py-0.5">
                  Ignore User
                </div>
                <div className="cursor-pointer hover:bg-gray-100 px-1 py-0.5">
                  Private Message
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-xs text-gray-700">
              <div className="mb-2 font-bold">Settings</div>
              <div className="space-y-1">
                <label className="flex items-center gap-1" htmlFor="settings-sound-alerts">
                  <input
                    id="settings-sound-alerts"
                    name="settings-sound-alerts"
                    type="checkbox"
                    className="w-3 h-3"
                  />
                  <span>Sound alerts</span>
                </label>
                <label className="flex items-center gap-1" htmlFor="settings-show-timestamps">
                  <input
                    id="settings-show-timestamps"
                    name="settings-show-timestamps"
                    type="checkbox"
                    className="w-3 h-3"
                  />
                  <span>Show timestamps</span>
                </label>
                <label className="flex items-center gap-1" htmlFor="settings-auto-scroll">
                  <input
                    id="settings-auto-scroll"
                    name="settings-auto-scroll"
                    type="checkbox"
                    className="w-3 h-3"
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
            </div>
          )}
          {activeTab === 'favorites' && (
            <div className="text-xs text-gray-700">
              <div className="mb-2 font-bold">Favorite Rooms</div>
              <div className="text-gray-500">No favorites yet</div>
            </div>
          )}
        </div>
      )}
      {showProfileEditor && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}
    </div>
  )
}

