'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatTools from '@/components/ChatTools'
import ChatMessage from '@/components/ChatMessage'
import MessageInput from '@/components/MessageInput'
import ChattersList from '@/components/ChattersList'
import ProfilePopup from '@/components/ProfilePopup'
import JoinRoomDialog from '@/components/JoinRoomDialog'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Room {
  id: string
  slug: string
  shortName: string
  title: string
}

interface Message {
  id: string
  roomId: string
  userId: string
  type: string
  content: string | null
  mediaUrl: string | null
  createdAt: string
  user: {
    id: string
    displayName: string
    avatar: string | null
  }
}

export default function AppPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Core state - minimal and simple
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Refs for stability
  const loadingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Step 1: Ensure session exists (non-blocking)
  useEffect(() => {
    fetch('/api/session/ensure').catch(() => {})
  }, [])

  // Step 2: Load rooms once on mount
  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true

    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/rooms/test', { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (!res.ok) {
          throw new Error(`Failed to load rooms: ${res.status}`)
        }

        const data = await res.json()
        const roomsData = Array.isArray(data.rooms) ? data.rooms : []

        if (roomsData.length === 0) {
          setError('No rooms available. Please seed the database.')
          setLoading(false)
          loadingRef.current = false
          return
        }

        setRooms(roomsData)

        // Set current room from URL or first room
        const roomParam = searchParams?.get('room')
        const targetRoom = roomParam
          ? roomsData.find((r: Room) => r.slug === roomParam)
          : roomsData[0]

        if (targetRoom) {
          setCurrentRoom(targetRoom)
          if (!roomParam) {
            router.replace(`/app?room=${targetRoom.slug}`, { scroll: false })
          }
        }

        setLoading(false)
        loadingRef.current = false
      } catch (err: any) {
        console.error('[ROOMS] Error:', err)
        setError(err.message || 'Failed to load rooms')
        setLoading(false)
        loadingRef.current = false
      }
    }

    loadRooms()
  }, [searchParams, router])

  // Step 3: Load messages when room changes (simple polling)
  useEffect(() => {
    if (!currentRoom) {
      setMessages([])
      return
    }

    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoom.slug}/messages?limit=50`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (!res.ok) {
          console.error('[MESSAGES] Failed:', res.status)
          return
        }

        const data = await res.json()
        if (Array.isArray(data)) {
          // Filter out invalid messages
          const validMessages = data.filter(
            (msg: Message) => msg && msg.id && msg.user && msg.user.displayName
          )
          setMessages(validMessages)
        }
      } catch (err) {
        console.error('[MESSAGES] Error:', err)
      }
    }

    // Load immediately
    loadMessages()

    // Poll every 3 seconds for new messages
    pollIntervalRef.current = setInterval(loadMessages, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [currentRoom])

  // Step 4: Handle room joining
  const handleJoinRoom = (slug: string) => {
    const room = rooms.find((r) => r.slug === slug)
    if (room) {
      setCurrentRoom(room)
      setShowJoinDialog(false)
      router.push(`/app?room=${slug}`, { scroll: false })
    }
  }

  // Render
  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-300 overflow-hidden">
        {/* Left Panel */}
        <ChatTools onJoinRoom={() => setShowJoinDialog(true)} />

        {/* Center Panel */}
        <div className="flex-1 flex flex-col h-full bg-white">
          {/* Header */}
          <div
            className="flex justify-between items-center px-4 py-2 flex-shrink-0"
            style={{
              background: 'linear-gradient(to bottom, #1C54B3 0%, #3B7DD8 50%, #1C54B3 100%)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-white font-bold">
                <span className="text-purple-300">Pulse</span>
              </div>
              <div className="text-white text-sm">
                {loading ? 'Loading...' : currentRoom?.shortName || 'No Room'}
              </div>
            </div>
            <div className="flex items-center gap-4 text-white text-sm">
              <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()}>
                Help
              </a>
              <span>|</span>
              <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()}>
                Exit
              </a>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 text-xs">
            <strong>Error:</strong> {error}
          </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-white p-2">
            {loading ? (
              <div className="text-center text-gray-500 text-sm py-8">Loading rooms...</div>
            ) : !currentRoom ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <div>Select a room to start chatting</div>
                <button
                  onClick={() => setShowJoinDialog(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Join Room
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <div>No messages yet. Be the first to chat!</div>
                <div className="text-xs text-gray-400 mt-2">Room: {currentRoom.shortName}</div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg as any}
                  index={idx}
                  onUserClick={(userId) => setSelectedUserId(userId)}
                />
              ))
            )}
          </div>

          {/* Input */}
          {currentRoom ? (
            <MessageInput roomSlug={currentRoom.slug} />
          ) : (
            <div className="border-t-2 border-gray-400 bg-gray-100 p-2 text-sm text-gray-500 text-center">
              Select a room to start chatting
            </div>
          )}
        </div>

        {/* Right Panel */}
        <ChattersList roomSlug={currentRoom?.slug || null} />

        {/* Modals */}
        {selectedUserId && (
          <ProfilePopup userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}

        <JoinRoomDialog
          isOpen={showJoinDialog}
          onClose={() => setShowJoinDialog(false)}
          onJoinRoom={handleJoinRoom}
        />
      </div>
    </ErrorBoundary>
  )
}
