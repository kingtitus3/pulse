import { create } from 'zustand'

export interface Room {
  id: string
  slug: string
  type: string
  parentSlug: string | null
  shortName: string
  title: string
  category: string
  description: string | null
  tags: string[]
  nsfw: boolean
  slowModeSeconds: number
  isFeatured: boolean
  archived: boolean
  expiresAt: Date | null
  activityScore: number
  createdAt: Date
}

export interface UserSummary {
  id: string
  displayName: string
  avatar: string
}

export interface Message {
  id: string
  roomId: string
  userId: string
  type: string
  content: string | null
  mediaUrl: string | null
  width: number | null
  height: number | null
  createdAt: Date
  deletedAt: Date | null
  user: UserSummary
}

interface ChatState {
  currentRoomSlug: string | null
  rooms: Room[]
  messagesByRoom: Record<string, Message[]>
  onlineUsersByRoom: Record<string, UserSummary[]>

  setRooms: (rooms: Room[]) => void
  setCurrentRoom: (slug: string | null) => void
  setMessages: (slug: string, messages: Message[]) => void
  addMessage: (slug: string, message: Message) => void
  prependMessages: (slug: string, olderMessages: Message[]) => void
  setOnlineUsers: (slug: string, users: UserSummary[]) => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentRoomSlug: null,
  rooms: [],
  messagesByRoom: {},
  onlineUsersByRoom: {},

  setRooms: (rooms) => {
    console.log('🏪 [STORE] setRooms called with:', rooms.length, 'rooms')
    console.log('🏪 [STORE] Room slugs:', rooms.map(r => r.slug))
    set({ rooms })
    console.log('🏪 [STORE] Rooms state updated')
  },

  setCurrentRoom: (slug) => {
    console.log('🏪 [STORE] setCurrentRoom called with slug:', slug)
    set({ currentRoomSlug: slug })
    console.log('🏪 [STORE] currentRoomSlug updated to:', slug)
  },

  setMessages: (slug, messages) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [slug]: messages,
      },
    })),

  addMessage: (slug, message) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [slug]: [...(state.messagesByRoom[slug] || []), message],
      },
    })),

  prependMessages: (slug, olderMessages) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [slug]: [...olderMessages, ...(state.messagesByRoom[slug] || [])],
      },
    })),

  setOnlineUsers: (slug, users) =>
    set((state) => ({
      onlineUsersByRoom: {
        ...state.onlineUsersByRoom,
        [slug]: users,
      },
    })),
}))

