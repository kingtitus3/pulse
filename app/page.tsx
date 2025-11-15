'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import JoinRoomDialog from '@/components/JoinRoomDialog'

export default function Home() {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(true)

  useEffect(() => {
    // Ensure session exists
    fetch('/api/session/ensure').catch(console.error)
  }, [])

  const handleJoinRoom = (slug: string) => {
    router.push(`/app?room=${slug}`)
  }

  return (
    <div className="min-h-screen bg-[#C0C0C0] flex items-center justify-center p-4" style={{
      backgroundImage: 'repeating-linear-gradient(45deg, #C0C0C0 0px, #C0C0C0 1px, #D4D0C8 1px, #D4D0C8 2px)',
      backgroundSize: '4px 4px'
    }}>
      {/* Main Window Container - Classic Windows XP Style */}
      <div className="bg-[#ECE9D8] border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-[4px_4px_8px_rgba(0,0,0,0.3)] w-full max-w-5xl">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1084D0] to-[#000080] text-white px-3 py-1.5 flex items-center justify-between cursor-move" style={{
          background: 'linear-gradient(to bottom, #245EDB 0%, #1941A5 50%, #245EDB 100%)',
          borderBottom: '1px solid #000000'
        }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Pulse Chat</span>
          </div>
          <div className="flex gap-1">
            <button className="w-5 h-5 bg-[#C0C0C0] border border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-[10px] font-bold hover:bg-[#D4D0C8] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF]">
              _
            </button>
            <button className="w-5 h-5 bg-[#C0C0C0] border border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-[10px] font-bold hover:bg-[#D4D0C8] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF]">
              □
            </button>
            <button 
              onClick={() => router.push('/app')}
              className="w-5 h-5 bg-[#C0C0C0] border border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-[10px] font-bold hover:bg-[#FF0000] hover:text-white active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF]"
            >
              ×
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="bg-[#ECE9D8] border-b border-[#808080] px-2 py-0.5 flex gap-4 text-xs">
          <button className="px-2 py-1 hover:bg-[#316AC5] hover:text-white">File</button>
          <button className="px-2 py-1 hover:bg-[#316AC5] hover:text-white">Edit</button>
          <button className="px-2 py-1 hover:bg-[#316AC5] hover:text-white">View</button>
          <button className="px-2 py-1 hover:bg-[#316AC5] hover:text-white">Help</button>
        </div>

        {/* Content Area */}
        <div className="bg-[#ECE9D8] p-4">
          {/* Welcome Section */}
          <div className="mb-6 text-center">
            <div className="inline-block mb-4">
              <h1 className="text-4xl font-bold mb-2" style={{
                background: 'linear-gradient(to bottom, #FF0000 0%, #CC0000 50%, #FF0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '2px'
              }}>
                PULSE
              </h1>
              <div className="text-lg font-bold text-[#FF6600]">Chat</div>
            </div>
            <p className="text-sm text-[#000000] mt-2">
              Welcome to Pulse Chat - Your anonymous-first chat experience
            </p>
          </div>

          {/* Main Content Box */}
          <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-4 mb-4">
            <div className="text-sm text-[#000000] mb-4">
              <p className="mb-2">
                <strong>Pulse Chat</strong> is an anonymous-first, room-centric chat platform inspired by the classic chatrooms of the early 2000s.
              </p>
              <p className="mb-2">
                Click <strong>"Join Room"</strong> below to browse available chat rooms and start chatting!
              </p>
              <p className="text-xs text-[#666666]">
                All users are welcome. Please be respectful and follow our community guidelines.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => setShowDialog(true)}
                className="px-6 py-2 bg-[#0066CC] text-white border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] font-bold text-sm hover:bg-[#0052A3] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF]"
                style={{
                  boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)'
                }}
              >
                Join Room
              </button>
              <button
                onClick={() => router.push('/app')}
                className="px-6 py-2 bg-[#C0C0C0] text-[#000000] border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] font-bold text-sm hover:bg-[#D4D0C8] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF]"
                style={{
                  boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)'
                }}
              >
                Enter Chat
              </button>
            </div>
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-3">
              <div className="text-xs font-bold text-[#0066CC] mb-1">🔒 Privacy First</div>
              <div className="text-[10px] text-[#000000]">
                Anonymous by default. Your privacy is our priority.
              </div>
            </div>
            <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-3">
              <div className="text-xs font-bold text-[#0066CC] mb-1">💬 Room-Centric</div>
              <div className="text-[10px] text-[#000000]">
                Join topic-based rooms and chat with like-minded people.
              </div>
            </div>
            <div className="bg-[#FFFFFF] border-2 border-t-[#808080] border-l-[#808080] border-r-[#FFFFFF] border-b-[#FFFFFF] p-3">
              <div className="text-xs font-bold text-[#0066CC] mb-1">🎨 Retro Style</div>
              <div className="text-[10px] text-[#000000]">
                Classic early-2000s chatroom aesthetic for nostalgia.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-[#666666]">
            <p>Pulse Chat © 2024 | Built with Next.js & Supabase</p>
            <p className="mt-1">
              <a href="#" className="text-[#0066CC] hover:underline" onClick={(e) => e.preventDefault()}>
                Chat Safety Tips
              </a>
              {' | '}
              <a href="#" className="text-[#0066CC] hover:underline" onClick={(e) => e.preventDefault()}>
                Community Guidelines
              </a>
              {' | '}
              <a href="#" className="text-[#0066CC] hover:underline" onClick={(e) => e.preventDefault()}>
                Help
              </a>
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1 text-[10px] text-[#000000] flex justify-between">
          <span>Ready</span>
          <span>Pulse Chat v1.0</span>
        </div>
      </div>

      {/* Join Room Dialog */}
      <JoinRoomDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          // If they close without joining, redirect to app anyway
          setTimeout(() => router.push('/app'), 100)
        }}
        onJoinRoom={handleJoinRoom}
      />
    </div>
  )
}
