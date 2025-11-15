'use client'

import { useState, useEffect } from 'react'
import { useChatStore, type Room } from '@/store/useChatStore'
import { useMeStore } from '@/store/useMeStore'

interface JoinRoomDialogProps {
  isOpen: boolean
  onClose: () => void
  onJoinRoom: (slug: string) => void
}

// Categories for organizing rooms
const CATEGORIES = [
  { id: 'featured', name: 'Featured Rooms', icon: '📌' },
  { id: 'core', name: 'Core Rooms', icon: '⭐' },
  { id: 'topics', name: 'Topic Rooms', icon: '💬' },
]

export default function JoinRoomDialog({
  isOpen,
  onClose,
  onJoinRoom,
}: JoinRoomDialogProps) {
  const { rooms, setRooms } = useChatStore()
  const { user } = useMeStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('core')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomNameInput, setRoomNameInput] = useState('')
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Load rooms when dialog opens
  useEffect(() => {
    if (!isOpen) return
    
    console.log('📂 [DIALOG] Dialog opened, rooms in store:', rooms.length)
    
    // If we already have rooms, use them
    if (rooms.length > 0) {
      console.log('✅ [DIALOG] Using existing rooms from store')
      // Auto-select first category that has rooms
      const coreRooms = rooms.filter((r: Room) => r.type === 'core')
      const topicRooms = rooms.filter((r: Room) => r.type === 'topic' && !r.archived)
      if (coreRooms.length > 0) {
        setSelectedCategory('core')
      } else if (topicRooms.length > 0) {
        setSelectedCategory('topics')
      } else if (rooms.length > 0) {
        setSelectedCategory('featured')
      }
      return
    }
    
    // Otherwise, fetch rooms
    console.log('🔄 [DIALOG] Fetching rooms from API...')
    setLoadingRooms(true)
    fetch('/api/rooms?sort=activity')
      .then((res) => {
        console.log('📡 [DIALOG] Rooms API response:', res.status)
        if (!res.ok) {
          throw new Error(`Failed to fetch rooms: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log('📦 [DIALOG] Rooms data received:', Array.isArray(data) ? data.length : 'not an array')
        if (Array.isArray(data) && data.length > 0) {
          setRooms(data)
          // Auto-select first category that has rooms
          const coreRooms = data.filter((r: Room) => r.type === 'core')
          const topicRooms = data.filter((r: Room) => r.type === 'topic' && !r.archived)
          if (coreRooms.length > 0) {
            setSelectedCategory('core')
          } else if (topicRooms.length > 0) {
            setSelectedCategory('topics')
          } else if (data.length > 0) {
            setSelectedCategory('featured')
          }
        } else {
          console.warn('⚠️ [DIALOG] No rooms in response')
        }
        setLoadingRooms(false)
      })
      .catch((error) => {
        console.error('❌ [DIALOG] Failed to load rooms:', error)
        setLoadingRooms(false)
      })
  }, [isOpen, rooms, setRooms])

  // Filter rooms by category
  useEffect(() => {
    if (rooms.length === 0) {
      setFilteredRooms([])
      return
    }

    if (selectedCategory === 'core') {
      const coreRooms = rooms.filter((r) => r.type === 'core')
      setFilteredRooms(coreRooms)
      // If no core rooms, try to switch to a category that has rooms
      if (coreRooms.length === 0) {
        const topicRooms = rooms.filter((r) => r.type === 'topic' && !r.archived)
        if (topicRooms.length > 0) {
          setSelectedCategory('topics')
        } else if (rooms.length > 0) {
          setSelectedCategory('featured')
        }
      }
    } else if (selectedCategory === 'topics') {
      const topicRooms = rooms.filter((r) => r.type === 'topic' && !r.archived)
      setFilteredRooms(topicRooms)
      // If no topic rooms, switch to core or featured
      if (topicRooms.length === 0) {
        const coreRooms = rooms.filter((r) => r.type === 'core')
        if (coreRooms.length > 0) {
          setSelectedCategory('core')
        } else if (rooms.length > 0) {
          setSelectedCategory('featured')
        }
      }
    } else if (selectedCategory === 'featured') {
      // Featured = most active rooms (all rooms sorted by activity)
      const featured = [...rooms]
        .filter((r) => !r.archived)
        .sort((a, b) => (b.activityScore || 0) - (a.activityScore || 0))
        .slice(0, 20)
      setFilteredRooms(featured)
    } else {
      setFilteredRooms([])
    }
  }, [selectedCategory, rooms])

  // Get user count for a room (placeholder - would need real-time data)
  const getUserCount = (room: Room) => {
    // In a real implementation, this would come from real-time presence data
    return Math.floor(Math.random() * 50) + 1 // Placeholder
  }

  const handleGoToRoom = () => {
    console.log('🚀 [DIALOG] handleGoToRoom called')
    console.log('🚀 [DIALOG] selectedRoom:', selectedRoom)
    console.log('🚀 [DIALOG] roomNameInput:', roomNameInput)
    console.log('🚀 [DIALOG] rooms available:', rooms.length)
    console.log('🚀 [DIALOG] filteredRooms:', filteredRooms.length)
    
    let roomToJoin: Room | null = null
    
    if (selectedRoom) {
      roomToJoin = selectedRoom
      console.log('✅ [DIALOG] Using selected room:', selectedRoom.slug)
    } else if (roomNameInput.trim()) {
      // Try to find room by name
      const room = rooms.find(
        (r) =>
          r.shortName.toLowerCase() === roomNameInput.trim().toLowerCase() ||
          r.slug === roomNameInput.trim().toLowerCase()
      )
      if (room) {
        roomToJoin = room
        console.log('✅ [DIALOG] Found room by name:', room.slug)
      } else {
        console.warn('⚠️ [DIALOG] Room not found by name:', roomNameInput)
        alert(`Room "${roomNameInput}" not found. Please select a room from the list.`)
        return
      }
    } else if (filteredRooms.length > 0) {
      // Auto-select first room if none selected
      roomToJoin = filteredRooms[0]
      console.log('✅ [DIALOG] Auto-selecting first room:', roomToJoin.slug)
    } else {
      console.error('❌ [DIALOG] No room available to join!')
      alert('No rooms available. Please try again.')
      return
    }
    
    if (roomToJoin) {
      console.log('🎯 [DIALOG] Calling onJoinRoom with:', roomToJoin.slug)
      try {
        onJoinRoom(roomToJoin.slug)
        console.log('✅ [DIALOG] onJoinRoom called successfully')
        onClose()
      } catch (error) {
        console.error('❌ [DIALOG] Error calling onJoinRoom:', error)
        alert('Error joining room. Please try again.')
      }
    }
  }

  const handleDoubleClickRoom = (room: Room) => {
    onJoinRoom(room.slug)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-gray-400 shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* XP-style Title Bar */}
        <div
          className="yahoo-header flex justify-between items-center flex-shrink-0"
          style={{
            background:
              'linear-gradient(to bottom, #1C54B3 0%, #3B7DD8 50%, #1C54B3 100%)',
          }}
        >
          <span className="text-white font-bold text-sm">Join Room</span>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 px-3 py-1 text-lg font-bold"
            style={{ lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Info */}
          <div className="w-64 bg-gray-50 border-r-2 border-gray-300 p-3 flex flex-col text-xs overflow-y-auto">
            <div className="mb-4">
              <div className="text-lg font-bold mb-1">
                <span className="text-purple-600">Pulse</span>
              </div>
              <a
                href="#"
                className="text-blue-600 hover:underline text-xs"
                onClick={(e) => e.preventDefault()}
              >
                Chat Safety Tips - More Help
              </a>
            </div>

            <div className="mb-4 text-xs text-gray-700 leading-relaxed">
              <p className="mb-2">
                The numbers next to the chatroom name tell you the number of
                chatters in the room. <strong>Markets (9)</strong> means that
                there are 9 chatters in the room. Double-click the room name to
                join.
              </p>
              <p className="mb-2">
                Pulse is available to all users. User-created topic rooms
                are available.
              </p>
            </div>

            <div className="mt-auto pt-4 text-xs text-gray-500">
              <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                <div className="text-blue-700 font-semibold mb-1">
                  Get Started
                </div>
                <div className="text-gray-600 text-[10px]">
                  Select a category, then choose a room to join.
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Room Selection */}
          <div className="flex-1 flex flex-col p-3">
            {/* Top: Enter Chat room as */}
            <div className="mb-3 flex items-center gap-2">
              <label className="text-xs text-gray-700 whitespace-nowrap">
                Enter Chat room as:
              </label>
              <input
                type="text"
                value={roomNameInput || user?.displayName || ''}
                onChange={(e) => setRoomNameInput(e.target.value)}
                className="input-yahoo flex-1 text-xs"
                placeholder="Your display name"
              />
            </div>

            {/* Middle: Categories and Rooms */}
            <div className="flex-1 flex gap-2 mb-3">
              {/* Left: Categories */}
              <div className="w-48 border-2 border-gray-400 bg-white">
                <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 text-xs font-bold">
                  Categories
                </div>
                <div className="overflow-y-auto" style={{ height: '400px' }}>
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-1 text-xs cursor-pointer flex items-center gap-1 ${
                        selectedCategory === cat.id
                          ? 'bg-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-yellow-500">📁</span>
                      <span className="text-gray-500">+</span>
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Rooms */}
              <div className="flex-1 border-2 border-gray-400 bg-white">
                <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 text-xs font-bold">
                  Pulse Rooms
                </div>
                <div className="overflow-y-auto" style={{ height: '400px' }}>
                  {loadingRooms ? (
                    <div className="px-2 py-4 text-xs text-gray-500 text-center">
                      Loading rooms...
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-gray-500 text-center">
                      <div>No rooms available.</div>
                      <div className="text-[10px] mt-1">
                        Set up database to see rooms.
                      </div>
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-gray-500 text-center">
                      <div>No rooms in this category.</div>
                      <div className="text-[10px] mt-1">
                        Try selecting a different category.
                      </div>
                    </div>
                  ) : (
                    filteredRooms.map((room) => {
                      const userCount = getUserCount(room)
                      const isSelected = selectedRoom?.id === room.id
                      return (
                        <div
                          key={room.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🖱️ [DIALOG] Room clicked:', room.slug, room.shortName)
                            setSelectedRoom(room)
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🖱️🖱️ [DIALOG] Room double-clicked:', room.slug)
                            handleDoubleClickRoom(room)
                          }}
                          className={`px-2 py-1 text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-blue-200'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {room.shortName}({userCount})
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Buttons */}
            <div className="flex justify-between items-center">
              <a
                href="#"
                className="text-blue-600 hover:underline text-xs"
                onClick={(e) => e.preventDefault()}
              >
                chat rules
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔘 [DIALOG] Go to Room button clicked!')
                    console.log('🔘 [DIALOG] selectedRoom:', selectedRoom)
                    console.log('🔘 [DIALOG] filteredRooms:', filteredRooms.length)
                    handleGoToRoom()
                  }}
                  className="btn-yahoo text-xs px-4 py-1"
                >
                  Go to Room
                </button>
                <button
                  onClick={onClose}
                  className="btn-yahoo-secondary text-xs px-4 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

