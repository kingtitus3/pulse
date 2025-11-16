'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  
  // Core state
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomSlug, setCurrentRoomSlug] = useState<string | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Refs for stability
  const roomsLoadedRef = useRef(false)
  const sseEventSourceRef = useRef<EventSource | null>(null)
  const isMountedRef = useRef(true)
  const messageIdsRef = useRef<Set<string>>(new Set())

  // Initialize
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (sseEventSourceRef.current) {
        sseEventSourceRef.current.close()
        sseEventSourceRef.current = null
      }
    }
  }, [])

  // Step 1: Ensure session exists (non-blocking)
  useEffect(() => {
    fetch('/api/session/ensure').catch(() => {})
  }, [])

  // Step 2: Load rooms once on mount
  useEffect(() => {
    if (roomsLoadedRef.current) return
    
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

        if (!isMountedRef.current) return

        if (roomsData.length === 0) {
          setError('No rooms available. Please seed the database.')
          setLoading(false)
          return
        }

        setRooms(roomsData)
        roomsLoadedRef.current = true

        // Set current room from URL or first room
        const roomParam = searchParams?.get('room')
        const targetRoom = roomParam
          ? roomsData.find((r: Room) => r.slug === roomParam)
          : roomsData[0]

        if (targetRoom) {
          setCurrentRoomSlug(targetRoom.slug)
          setCurrentRoom(targetRoom)
          if (!roomParam) {
            router.replace(`/app?room=${targetRoom.slug}`, { scroll: false })
          }
        }

        setLoading(false)
      } catch (err: any) {
        if (!isMountedRef.current) return
        console.error('[ROOMS] Error:', err)
        setError(err.message || 'Failed to load rooms')
        setLoading(false)
      }
    }

    loadRooms()
  }, [searchParams, router])

  // Step 3: Update current room when URL changes
  useEffect(() => {
    const roomParam = searchParams?.get('room')
    if (roomParam && roomParam !== currentRoomSlug) {
      const room = rooms.find((r) => r.slug === roomParam)
      if (room) {
        setCurrentRoomSlug(roomParam)
        setCurrentRoom(room)
      }
    }
  }, [searchParams, rooms, currentRoomSlug])

  // Step 4: Load initial messages and set up SSE for real-time updates
  useEffect(() => {
    if (!currentRoomSlug) {
      setMessages([])
      messageIdsRef.current.clear()
      return
    }

    // Close existing SSE connection
    if (sseEventSourceRef.current) {
      sseEventSourceRef.current.close()
      sseEventSourceRef.current = null
    }
    messageIdsRef.current.clear()

    let cancelled = false

    // Load initial messages
    const loadInitialMessages = async () => {
      if (cancelled || !isMountedRef.current) return

      try {
        const res = await fetch(`/api/rooms/${currentRoomSlug}/messages?limit=50`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (cancelled || !isMountedRef.current) return

        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const validMessages = data.filter(
              (msg: Message) => 
                msg && 
                msg.id && 
                msg.user && 
                msg.user.displayName &&
                msg.roomId
            )

            const newIds = new Set(validMessages.map(m => m.id))
            messageIdsRef.current = newIds

            if (!cancelled && isMountedRef.current) {
              setMessages(validMessages)
            }
          }
        }
      } catch (err) {
        console.error('[MESSAGES] Initial load error:', err)
      }
    }

    loadInitialMessages()

    // Set up Server-Sent Events for real-time updates
    try {
      console.log('[SSE] Setting up EventSource for room:', currentRoomSlug)
      const eventSource = new EventSource(`/api/rooms/${currentRoomSlug}/messages/stream`)

      eventSource.onopen = () => {
        console.log('[SSE] ✅ Connection opened')
      }

      eventSource.onmessage = (event) => {
        if (cancelled || !isMountedRef.current) return

        try {
          const data = JSON.parse(event.data)

          if (data.type === 'connected') {
            console.log('[SSE] Connected to stream')
            return
          }

          if (data.type === 'message' && data.message) {
            const newMsg = data.message

            // Prevent duplicates
            if (messageIdsRef.current.has(newMsg.id)) {
              return
            }

            messageIdsRef.current.add(newMsg.id)

            if (!cancelled && isMountedRef.current) {
              setMessages((prev) => {
                // Final duplicate check
                if (prev.some((m) => m.id === newMsg.id)) {
                  return prev
                }
                return [...prev, newMsg].sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
              })

              // Auto-scroll to new message
              setTimeout(() => {
                const messagesEnd = document.getElementById('messages-end')
                messagesEnd?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[SSE] ❌ EventSource error:', err)
        // EventSource will automatically reconnect
      }

      sseEventSourceRef.current = eventSource
    } catch (sseError: any) {
      console.error('[SSE] Failed to set up EventSource:', sseError)
    }

    return () => {
      cancelled = true
      if (sseEventSourceRef.current) {
        sseEventSourceRef.current.close()
        sseEventSourceRef.current = null
      }
      messageIdsRef.current.clear()
    }
  }, [currentRoomSlug])

  // Step 5: Handle room joining
  const handleJoinRoom = useCallback((slug: string) => {
    const room = rooms.find((r) => r.slug === slug)
    if (room) {
      setCurrentRoomSlug(slug)
      setCurrentRoom(room)
      setShowJoinDialog(false)
      router.push(`/app?room=${slug}`, { scroll: false })
    }
  }, [rooms, router])

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
              <>
                {messages.map((msg, idx) => {
                  if (!msg || !msg.id || !msg.user) return null
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg as any}
                      index={idx}
                      onUserClick={(userId) => setSelectedUserId(userId)}
                    />
                  )
                })}
                <div id="messages-end" />
              </>
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
        <ChattersList roomSlug={currentRoomSlug} />

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
