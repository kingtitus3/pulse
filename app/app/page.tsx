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
import { supabase } from '@/lib/supabaseClient'

interface Room {
  id: string
  slug: string
  shortName: string
  title: string
  type: string
  archived: boolean
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
  
  // State
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Refs
  const channelRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdsRef = useRef<Set<string>>(new Set())

  // Ensure user session exists
  useEffect(() => {
    fetch('/api/session/ensure').catch(console.error)
  }, [])

  // Load rooms once
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/rooms/test', { cache: 'no-store' })
        
        if (!res.ok) {
          throw new Error(`Failed to load rooms: ${res.status}`)
        }

        const data = await res.json()
        const roomsData = Array.isArray(data.rooms) ? data.rooms : []

        if (roomsData.length === 0) {
          setError('No rooms available')
          setLoading(false)
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
      } catch (err: any) {
        console.error('Failed to load rooms:', err)
        setError(err.message || 'Failed to load rooms')
        setLoading(false)
      }
    }

    loadRooms()
  }, [searchParams, router])

  // Load messages and set up Realtime subscription
  useEffect(() => {
    if (!currentRoom) {
      setMessages([])
      return
    }

    // Clean up previous subscription
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (err) {
        console.error('Error removing channel:', err)
      }
      channelRef.current = null
    }
    messageIdsRef.current.clear()

    let cancelled = false

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoom.slug}/messages?limit=50`, {
          cache: 'no-store',
        })

        if (cancelled) return

        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const newMessageIds = new Set<string>()
            const uniqueMessages = data.filter((msg: Message) => {
              if (newMessageIds.has(msg.id)) return false
              newMessageIds.add(msg.id)
              return true
            })
            
            messageIdsRef.current = newMessageIds
            setMessages(uniqueMessages)
            
            // Scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load messages:', err)
          setMessages([])
        }
      }
    }

    loadMessages()

    // Set up Realtime subscription (graceful failure)
    try {
      const channel = supabase
        .channel(`room-${currentRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Message',
            filter: `roomId=eq.${currentRoom.id}`,
          },
          async (payload: any) => {
            if (cancelled) return
            
            try {
              const newMessageId = payload.new?.id
              if (!newMessageId || messageIdsRef.current.has(newMessageId)) {
                return
              }

              // Fetch the new message
              const msgRes = await fetch(
                `/api/rooms/${currentRoom.slug}/messages?limit=50`,
                { cache: 'no-store' }
              )
              
              if (msgRes.ok) {
                const msgData = await msgRes.json()
                if (Array.isArray(msgData) && msgData.length > 0) {
                  // Get the newest message
                  const newMsg = msgData[msgData.length - 1]
                  if (!messageIdsRef.current.has(newMsg.id)) {
                    messageIdsRef.current.add(newMsg.id)
                    setMessages((prev) => {
                      if (prev.some((m) => m.id === newMsg.id)) {
                        return prev
                      }
                      return [...prev, newMsg]
                    })
                    
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }
                }
              }
            } catch (err) {
              console.error('Error handling new message:', err)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscribed')
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Realtime error, falling back to polling')
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error('Failed to set up Realtime:', err)
    }

    // Fallback: Poll every 5 seconds if Realtime fails
    const pollInterval = setInterval(() => {
      if (!cancelled) {
        loadMessages()
      }
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (err) {
          console.error('Error cleaning up channel:', err)
        }
        channelRef.current = null
      }
      messageIdsRef.current.clear()
    }
  }, [currentRoom])

  const handleJoinRoom = useCallback(
    (slug: string) => {
      const room = rooms.find((r) => r.slug === slug)
      if (room) {
        setCurrentRoom(room)
        setShowJoinDialog(false)
        router.push(`/app?room=${slug}`, { scroll: false })
      }
    },
    [rooms, router]
  )

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
              <div className="text-center text-gray-500 text-sm py-8">Loading...</div>
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
                {messages
                  .filter((msg) => msg && msg.user)
                  .map((msg, idx) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg as any}
                      index={idx}
                      onUserClick={(userId) => setSelectedUserId(userId)}
                    />
                  ))}
                <div ref={messagesEndRef} />
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
