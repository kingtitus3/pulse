'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useChatStore } from '@/store/useChatStore'
import { useMeStore } from '@/store/useMeStore'
import ChatTools from '@/components/ChatTools'
import ChatMessage from '@/components/ChatMessage'
import MessageInput from '@/components/MessageInput'
import ChattersList from '@/components/ChattersList'
import ProfilePopup from '@/components/ProfilePopup'
import JoinRoomDialog from '@/components/JoinRoomDialog'
import ErrorBoundary from '@/components/ErrorBoundary'
import { supabase } from '@/lib/supabaseClient'

export default function AppPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    rooms,
    currentRoomSlug,
    messagesByRoom,
    setRooms,
    setCurrentRoom,
    setMessages,
    addMessage,
    setOnlineUsers,
  } = useChatStore()
  const { user, setMe } = useMeStore()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [currentRoom, setCurrentRoomData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  // Load user session
  useEffect(() => {
    const loadUser = async () => {
      try {
        await fetch('/api/session/ensure')
        const res = await fetch('/api/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setMe(data)
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }
    loadUser()
  }, [setMe])

  // Load rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/rooms/test', {
          cache: 'no-store',
        })

        if (!res.ok) {
          throw new Error(`Failed to load rooms: ${res.status}`)
        }

        const data = await res.json()
        const roomsData = Array.isArray(data.rooms) ? data.rooms : []

        if (roomsData.length === 0) {
          setError('No rooms available. Database may need seeding.')
          setLoading(false)
          return
        }

        setRooms(roomsData)

        // Set current room from URL or default to first room
        const roomParam = searchParams?.get('room')
        const targetRoom = roomParam
          ? roomsData.find((r: any) => r.slug === roomParam)
          : roomsData[0]

        if (targetRoom) {
          setCurrentRoom(targetRoom.slug)
          // Update URL if needed
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
  }, [setRooms, setCurrentRoom, searchParams, router])

  // Load room data and messages when room changes
  useEffect(() => {
    if (!currentRoomSlug) return

    let cancelled = false
    let channel: any = null

    const loadRoomData = async () => {
      try {
        // Load room details
        const roomRes = await fetch(`/api/rooms/${currentRoomSlug}`)
        if (cancelled) return

        if (roomRes.ok) {
          const roomData = await roomRes.json()
          if (!cancelled) {
            setCurrentRoomData(roomData)
          }
        }

        // Load messages
        const messagesRes = await fetch(`/api/rooms/${currentRoomSlug}/messages?limit=50`)
        if (cancelled) return

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          if (!cancelled && Array.isArray(messagesData)) {
            setMessages(currentRoomSlug, messagesData)
          }
        }

        // Load online users (non-blocking)
        fetch(`/api/rooms/${currentRoomSlug}/users`)
          .then((res) => res.json())
          .then((data) => {
            if (!cancelled && Array.isArray(data.users)) {
              setOnlineUsers(currentRoomSlug, data.users)
            }
          })
          .catch(() => {
            if (!cancelled) {
              setOnlineUsers(currentRoomSlug, [])
            }
          })

        // Set up Realtime subscription
        if (roomRes.ok) {
          const roomData = await roomRes.json()
          if (roomData?.id && !cancelled) {
            channel = supabase
              .channel(`room-${roomData.id}`)
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'Message',
                  filter: `roomId=eq.${roomData.id}`,
                },
                async (payload: any) => {
                  if (cancelled) return
                  // Fetch the new message with user data
                  try {
                    const newMsgRes = await fetch(
                      `/api/rooms/${currentRoomSlug}/messages?limit=1`
                    )
                    const newMessages = await newMsgRes.json()
                    if (Array.isArray(newMessages) && newMessages.length > 0) {
                      addMessage(currentRoomSlug, newMessages[newMessages.length - 1])
                    }
                  } catch (err) {
                    console.error('Failed to fetch new message:', err)
                  }
                }
              )
              .subscribe()
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load room data:', err)
        }
      }
    }

    loadRoomData()

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [currentRoomSlug, setMessages, addMessage, setOnlineUsers])

  const handleJoinRoom = useCallback(
    (slug: string) => {
      if (!slug) return

      setCurrentRoom(slug)
      setShowJoinDialog(false)
      router.push(`/app?room=${slug}`, { scroll: false })
    },
    [setCurrentRoom, router]
  )

  const messages = currentRoomSlug ? messagesByRoom[currentRoomSlug] || [] : []

  if (typeof window === 'undefined') {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-300 overflow-hidden">
        {/* Left Panel - Chat Tools */}
        <ChatTools onJoinRoom={() => setShowJoinDialog(true)} />

        {/* Center Panel - Chat */}
        <div className="flex-1 flex flex-col h-full bg-white">
          {/* Top Bar */}
          <div
            className="yahoo-header flex justify-between items-center flex-shrink-0 px-4"
            style={{
              background:
                'linear-gradient(to bottom, #1C54B3 0%, #3B7DD8 50%, #1C54B3 100%)',
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

          {/* Error Message */}
          {error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-white min-h-0">
            {loading ? (
              <div className="text-center text-gray-500 text-sm py-8">Loading rooms...</div>
            ) : !currentRoomSlug ? (
              <div className="text-center text-gray-500 text-sm py-8">
                Select a room to start chatting
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <div>No messages yet. Be the first to chat!</div>
                <div className="text-xs text-gray-400 mt-2">
                  Room: {currentRoom?.shortName || currentRoomSlug}
                </div>
              </div>
            ) : (
              messages
                .filter((msg) => msg && msg.user)
                .map((msg, idx) => (
                  <ChatMessage
                    key={msg.id || `msg-${idx}`}
                    message={msg}
                    index={idx}
                    onUserClick={(userId) => setSelectedUserId(userId)}
                  />
                ))
            )}
          </div>

          {/* Input */}
          {currentRoomSlug ? (
            <MessageInput roomSlug={currentRoomSlug} />
          ) : (
            <div className="border-t-2 border-gray-400 bg-gray-100 p-2 text-sm text-gray-500 text-center">
              Select a room to start chatting
            </div>
          )}
        </div>

        {/* Right Panel - Chatters */}
        <ChattersList roomSlug={currentRoomSlug} />

        {/* Profile Popup */}
        {selectedUserId && (
          <ProfilePopup userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}

        {/* Join Room Dialog */}
        <JoinRoomDialog
          isOpen={showJoinDialog}
          onClose={() => setShowJoinDialog(false)}
          onJoinRoom={handleJoinRoom}
        />
      </div>
    </ErrorBoundary>
  )
}
