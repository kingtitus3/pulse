'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import JoinRoomDialog from '@/components/JoinRoomDialog'

export default function Home() {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    // Ensure session exists
    fetch('/api/session/ensure').catch(console.error)
    // Auto-show dialog
    setShowDialog(true)
  }, [])

  const handleJoinRoom = (slug: string) => {
    router.push(`/app?room=${slug}`)
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-yahoo-bg p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-2 text-yahoo-text">
            <span className="text-purple-600">Pulse</span>
          </h1>
          <p className="text-sm text-yahoo-textMuted mb-4">
            Anonymous-first, room-centric chat
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="btn-yahoo px-8 py-2"
          >
            Join Room
          </button>
        </div>
      </div>
      <JoinRoomDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          // If they close without joining, redirect to app anyway
          setTimeout(() => router.push('/app'), 100)
        }}
        onJoinRoom={handleJoinRoom}
      />
    </>
  )
}

