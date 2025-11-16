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
import Pusher from 'pusher-js'

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
  const pusherChannelRef = useRef<any>(null)
  const pusherClientRef = useRef<Pusher | null>(null)
  const isMountedRef = useRef(true)
  const messageIdsRef = useRef<Set<string>>(new Set())

  // Step 0: Listen for local \"message sent\" events from MessageInput
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (event: any) => {
      const detail = event.detail || {}
      const newMsg = detail.message as Message | undefined
      const slug = detail.roomSlug as string | undefined

      if (!newMsg || !newMsg.id) {
        console.warn('[LOCAL MESSAGE] Invalid message payload:', detail)
        return
      }

      // Ensure it belongs to the current room
      if (!currentRoom || newMsg.roomId !== currentRoom.id) {
        return
      }

      // If a slug was provided, ensure it matches
      if (slug && slug !== currentRoomSlug) {
        return
      }

      // Prevent duplicates
      if (messageIdsRef.current.has(newMsg.id)) {
        console.log('[LOCAL MESSAGE] Duplicate message ignored:', newMsg.id)
        return
      }

      console.log('[LOCAL MESSAGE] Adding new message to state:', newMsg.id)
      messageIdsRef.current.add(newMsg.id)

      if (!isMountedRef.current) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev
        }
        const updated = [...prev, newMsg].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        console.log('[LOCAL MESSAGE] Updated messages count:', prev.length, '->', updated.length)
        return updated
      })

      // Auto-scroll to bottom
      setTimeout(() => {
        const messagesEnd = document.getElementById('messages-end')
        messagesEnd?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }

    window.addEventListener('pulse:new-message', handler as EventListener)

    return () => {
      window.removeEventListener('pulse:new-message', handler as EventListener)
    }
  }, [currentRoomSlug, currentRoom])

  // Initialize
  useEffect(() => {
    isMountedRef.current = true
    
    // Initialize Pusher client
    if (typeof window !== 'undefined') {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us3'
      
      if (pusherKey) {
        console.log('[PUSHER] Initializing client with key:', pusherKey.substring(0, 10) + '...', 'cluster:', pusherCluster)
        pusherClientRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster,
        })
      } else {
        console.warn('[PUSHER] NEXT_PUBLIC_PUSHER_KEY not found - Pusher will not work')
      }
    }
    
    return () => {
      isMountedRef.current = false
      if (pusherChannelRef.current) {
        pusherChannelRef.current.unbind_all()
        pusherChannelRef.current.unsubscribe()
        pusherChannelRef.current = null
      }
      if (pusherClientRef.current) {
        pusherClientRef.current.disconnect()
        pusherClientRef.current = null
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

  // Step 4: Load messages and set up Pusher for instant updates
  useEffect(() => {
    if (!currentRoomSlug || !currentRoom) {
      setMessages([])
      messageIdsRef.current.clear()
      return
    }

    // Clean up previous subscription
    if (pusherChannelRef.current) {
      pusherChannelRef.current.unbind_all()
      pusherChannelRef.current.unsubscribe()
      pusherChannelRef.current = null
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
              console.log('[MESSAGES] Setting', validMessages.length, 'messages in state')
              setMessages(validMessages)
              
              // Auto-scroll to bottom after loading
              setTimeout(() => {
                const messagesEnd = document.getElementById('messages-end')
                messagesEnd?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }
          }
        }
      } catch (err) {
        console.error('[MESSAGES] Initial load error:', err)
      }
    }

    loadInitialMessages()

    // Load online users for chatters list
    const loadOnlineUsers = async () => {
      if (cancelled || !isMountedRef.current) return
      
      try {
        const res = await fetch(`/api/rooms/${currentRoomSlug}/users`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (cancelled || !isMountedRef.current) return
        
        if (res.ok) {
          const data = await res.json()
          if (data.users && Array.isArray(data.users)) {
            // Update chatters list via store
            const { useChatStore } = await import('@/store/useChatStore')
            useChatStore.getState().setOnlineUsers(currentRoomSlug, data.users)
            console.log('[CHATTERS] Loaded', data.users.length, 'users for room:', currentRoomSlug)
          }
        }
      } catch (err) {
        console.error('[CHATTERS] Error loading users:', err)
      }
    }

    // Load users initially and then every 10 seconds
    loadOnlineUsers()
    const usersPollInterval = setInterval(() => {
      if (!cancelled && isMountedRef.current) {
        loadOnlineUsers()
      }
    }, 10000)

    // Set up Pusher subscription for instant updates
    if (pusherClientRef.current) {
      try {
        console.log('[PUSHER] Subscribing to room:', currentRoom.id)
        const channel = pusherClientRef.current.subscribe(`room-${currentRoom.id}`)

        channel.bind('new-message', (data: Message) => {
          if (cancelled || !isMountedRef.current) return

          console.log('[PUSHER] Received message event:', {
            id: data.id,
            roomId: data.roomId,
            userId: data.userId,
            hasUser: !!data.user,
            userDisplayName: data.user?.displayName,
          })

          // Prevent duplicates
          if (messageIdsRef.current.has(data.id)) {
            console.log('[PUSHER] Duplicate message ignored:', data.id)
            return
          }

          console.log('[PUSHER] Adding new message to state:', data.id)
          messageIdsRef.current.add(data.id)

          if (!cancelled && isMountedRef.current) {
            setMessages((prev) => {
              // Final duplicate check
              if (prev.some((m) => m.id === data.id)) {
                console.log('[PUSHER] Message already in state, skipping:', data.id)
                return prev
              }
              const updated = [...prev, data].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              console.log('[PUSHER] Updated messages count:', prev.length, '->', updated.length)
              return updated
            })

            // Auto-scroll to new message
            setTimeout(() => {
              const messagesEnd = document.getElementById('messages-end')
              messagesEnd?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        })

        channel.bind('pusher:subscription_succeeded', () => {
          console.log('[PUSHER] ✅ Successfully subscribed to room:', currentRoomSlug)
        })

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('[PUSHER] ❌ Subscription error:', error)
        })

        pusherChannelRef.current = channel
      } catch (pusherError: any) {
        console.error('[PUSHER] Failed to set up subscription:', pusherError)
      }
    } else {
      console.warn('[PUSHER] Pusher client not initialized - check NEXT_PUBLIC_PUSHER_KEY')
      // Fallback: poll for new messages every 2 seconds
      console.log('[POLLING] Setting up fallback polling (2s interval)')
      const pollInterval = setInterval(() => {
        if (cancelled || !isMountedRef.current) {
          clearInterval(pollInterval)
          return
        }
        loadInitialMessages()
      }, 2000)
      
      return () => {
        cancelled = true
        clearInterval(pollInterval)
        messageIdsRef.current.clear()
      }
    }

    return () => {
      cancelled = true
      if (usersPollInterval) {
        clearInterval(usersPollInterval)
      }
      if (pusherChannelRef.current) {
        pusherChannelRef.current.unbind_all()
        pusherChannelRef.current.unsubscribe()
        pusherChannelRef.current = null
      }
      messageIdsRef.current.clear()
    }
  }, [currentRoomSlug, currentRoom])

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
