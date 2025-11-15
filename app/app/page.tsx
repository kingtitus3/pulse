'use client'

import { useEffect, useState } from 'react'
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
  const { user, setMe, isLoading } = useMeStore()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [currentRoom, setCurrentRoomData] = useState<any>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  // Ensure session and load user data
  useEffect(() => {
    fetch('/api/session/ensure')
      .then(() => fetch('/api/me'))
      .then((res) => {
        if (!res.ok && res.status === 503) {
          setDbError('Database not configured. Please check your Vercel environment variables.')
          return { error: 'Database not configured' }
        }
        return res.json()
      })
      .then((data) => {
        if (data.user) {
          setMe(data)
        }
      })
      .catch((error) => {
        console.error('Failed to load user:', error)
        setDbError('Failed to connect to database')
      })
  }, [setMe])

  // Load rooms - run once on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        console.log('🔄 [ROOMS] Fetching rooms from /api/rooms/test...')
        setRoomsLoading(true)
        
        // Use the test endpoint which we know returns rooms reliably
        const res = await fetch('/api/rooms/test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
        
        console.log('📡 [ROOMS] Response:', {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('❌ [ROOMS] Error response:', errorText)
          if (res.status === 500) {
            setDbError('Database not configured. Please set up your database connection.')
            setRoomsLoading(false)
            return
          }
          throw new Error(`HTTP ${res.status}: ${errorText}`)
        }
        
        const data = await res.json()
        // The test endpoint returns { success, count, rooms: [...] }
        // For safety, also handle the case where it might already be an array.
        const roomsData = Array.isArray(data) ? data : Array.isArray(data.rooms) ? data.rooms : []

        console.log('✅ [ROOMS] Data received:', {
          rawType: typeof data,
          rawKeys: typeof data === 'object' && data !== null ? Object.keys(data) : null,
          length: roomsData.length,
          sample: roomsData[0] || null,
        })
        
        if (roomsData.length > 0) {
          console.log(`✨ [ROOMS] Setting ${roomsData.length} rooms to Zustand store`)
          setRooms(roomsData)
          // Check if room param is in URL
          const roomParam = searchParams?.get('room')
          if (roomParam) {
            const room = roomsData.find((r: any) => r.slug === roomParam)
            if (room) {
              console.log('🎯 [ROOMS] Setting current room from URL:', room.slug)
              setCurrentRoom(room.slug)
            } else {
              console.log('🎯 [ROOMS] Setting current room to:', roomsData[0].slug)
              setCurrentRoom(roomsData[0].slug)
            }
          } else {
            console.log('🎯 [ROOMS] Setting current room to:', roomsData[0].slug)
            setCurrentRoom(roomsData[0].slug)
          }
          console.log('✅ [ROOMS] Rooms loaded successfully!')
        } else {
          console.warn('⚠️ [ROOMS] No rooms in response or empty array')
          setDbError('No rooms found. Database may need seeding.')
        }
        setRoomsLoading(false)
      } catch (error) {
        console.error('❌ [ROOMS] Failed to load rooms:', error)
        console.error('❌ [ROOMS] Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
        })
        setDbError('Failed to load rooms: ' + (error as Error).message)
        setRoomsLoading(false)
      }
    }
    
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      loadRooms()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [setRooms, setCurrentRoom, searchParams])

  // Load messages for current room
  useEffect(() => {
    if (!currentRoomSlug) {
      console.log('⚠️ [ROOM] No currentRoomSlug, skipping room load')
      return
    }

    let cancelled = false

    console.log('🔄 [ROOM] Loading room data for:', currentRoomSlug)

    // Get room data
    fetch(`/api/rooms/${currentRoomSlug}`)
      .then((res) => {
        if (cancelled) return
        console.log('📡 [ROOM] Room fetch response:', res.status, res.ok)
        if (!res.ok) {
          console.warn('⚠️ [ROOM] Room fetch failed:', res.status)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (data) {
          console.log('✅ [ROOM] Room data loaded:', data)
          setCurrentRoomData(data)
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('❌ [ROOM] Failed to load room:', error)
      })

    // Load initial messages
    console.log('📨 [MESSAGES] Fetching messages for room:', currentRoomSlug)
    fetch(`/api/rooms/${currentRoomSlug}/messages?limit=50`)
      .then((res) => {
        if (cancelled) return
        console.log('📡 [MESSAGES] Response status:', res.status, res.ok)
        if (!res.ok) {
          console.warn('⚠️ [MESSAGES] Messages fetch failed:', res.status)
          return []
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        console.log('✅ [MESSAGES] Messages received:', {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'not an array',
        })
        if (Array.isArray(data)) {
          console.log(`✨ [MESSAGES] Setting ${data.length} messages to store`)
          setMessages(currentRoomSlug, data)
        } else {
          console.warn('⚠️ [MESSAGES] Response is not an array:', data)
          setMessages(currentRoomSlug, [])
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('❌ [MESSAGES] Failed to load messages:', error)
        setMessages(currentRoomSlug, [])
      })

    // Load online users for this room (with error handling) - make it non-blocking
    setTimeout(() => {
      if (cancelled) return
      console.log('👥 [USERS] Fetching online users for room:', currentRoomSlug)
      fetch(`/api/rooms/${currentRoomSlug}/users`)
        .then((res) => {
          if (cancelled) return
          if (!res.ok) {
            console.warn('⚠️ [USERS] Users API returned:', res.status)
            return { users: [], count: 0 }
          }
          return res.json()
        })
        .then((data) => {
          if (cancelled) return
          console.log('✅ [USERS] Users received:', data.count || 0, 'users')
          if (Array.isArray(data.users)) {
            setOnlineUsers(currentRoomSlug, data.users)
          } else {
            setOnlineUsers(currentRoomSlug, [])
          }
        })
        .catch((error) => {
          if (cancelled) return
          console.error('❌ [USERS] Failed to load users:', error)
          // Set empty array on error instead of crashing
          setOnlineUsers(currentRoomSlug, [])
        })
    }, 500) // Delay user fetch to not block room loading

    // Subscribe to new messages via Supabase Realtime
    // Note: This requires Supabase Realtime to be enabled for the messages table
    // Run: ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    let channel: any = null

    fetch(`/api/rooms/${currentRoomSlug}`)
      .then((res) => res.json())
      .then((room) => {
        if (!room?.id) return

        channel = supabase
          .channel(`room-${room.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'Message',
              filter: `roomId=eq.${room.id}`,
            },
            (payload: any) => {
              // Fetch the full message with user data
              fetch(`/api/rooms/${currentRoomSlug}/messages?limit=1`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.length > 0) {
                    addMessage(currentRoomSlug, data[data.length - 1])
                  }
                })
                .catch(console.error)
            }
          )
          .subscribe()
      })
      .catch(console.error)

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [currentRoomSlug, setMessages, addMessage, setOnlineUsers])

  const messages = currentRoomSlug ? messagesByRoom[currentRoomSlug] || [] : []
  
  // Safety check - if something is wrong, show error instead of blank screen
  if (typeof window === 'undefined') {
    return null // SSR
  }

  console.log('🖥️ [RENDER] Chat screen state:', {
    currentRoomSlug,
    messagesCount: messages.length,
    messagesByRoomKeys: Object.keys(messagesByRoom),
    currentRoom: currentRoom?.shortName || 'none',
  })

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
              You are in {currentRoom?.shortName || 'No Room'}
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

        {dbError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 text-xs">
            <strong>Setup Required:</strong> {dbError}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
          {!currentRoomSlug ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Select a room to start chatting
            </div>
          ) : messages.length === 0 && !dbError ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <div>No messages yet. Be the first to chat!</div>
              <div className="text-xs text-gray-400 mt-2">
                Room: {currentRoom?.shortName || currentRoomSlug}
              </div>
            </div>
          ) : (
            messages
              .filter((msg) => msg && msg.user) // Filter out invalid messages
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
      {selectedUserId && (
        <ProfilePopup
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
      <JoinRoomDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onJoinRoom={(slug) => {
          console.log('🎯 [JOIN] ====== JOIN ROOM CALLED ======')
          console.log('🎯 [JOIN] Slug:', slug)
          console.log('🎯 [JOIN] Current room before:', currentRoomSlug)
          
          if (!slug) {
            console.error('❌ [JOIN] No slug provided!')
            return
          }
          
          try {
            // Set the room in the store first
            console.log('🎯 [JOIN] Calling setCurrentRoom...')
            setCurrentRoom(slug)
            console.log('🎯 [JOIN] setCurrentRoom called')
            
            // Close dialog first
            setShowJoinDialog(false)
            console.log('🎯 [JOIN] Dialog closed')
            
            // Update URL using Next.js router (triggers re-render)
            const newUrl = `/app?room=${slug}`
            console.log('🎯 [JOIN] Navigating to:', newUrl)
            router.push(newUrl)
            console.log('🎯 [JOIN] Navigation triggered')
            
            // Force reload room data
            setCurrentRoomData(null)
            
            // Manually trigger room load
            console.log('🎯 [JOIN] Fetching room data...')
            fetch(`/api/rooms/${slug}`)
              .then((res) => {
                console.log('📡 [JOIN] Room fetch status:', res.status)
                if (!res.ok) {
                  throw new Error(`Failed to fetch room: ${res.status}`)
                }
                return res.json()
              })
              .then((data) => {
                console.log('✅ [JOIN] Room data loaded:', data)
                setCurrentRoomData(data)
              })
              .catch((error) => {
                console.error('❌ [JOIN] Failed to load room:', error)
              })
            
            // Load messages
            console.log('🎯 [JOIN] Fetching messages...')
            fetch(`/api/rooms/${slug}/messages?limit=50`)
              .then((res) => {
                console.log('📡 [JOIN] Messages fetch status:', res.status)
                if (!res.ok) {
                  throw new Error(`Failed to fetch messages: ${res.status}`)
                }
                return res.json()
              })
              .then((data) => {
                console.log('✅ [JOIN] Messages loaded:', Array.isArray(data) ? data.length : 'not an array')
                if (Array.isArray(data)) {
                  setMessages(slug, data)
                }
              })
              .catch((error) => {
                console.error('❌ [JOIN] Failed to load messages:', error)
              })
            
            console.log('✅ [JOIN] ====== JOIN ROOM COMPLETE ======')
          } catch (error) {
            console.error('❌ [JOIN] Error in onJoinRoom:', error)
          }
        }}
      />
      </div>
    </ErrorBoundary>
  )
}
