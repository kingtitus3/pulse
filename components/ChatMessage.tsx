'use client'

import { type Message } from '@/store/useChatStore'
import { useMeStore } from '@/store/useMeStore'
import { useState } from 'react'
import { parseMessageFormat } from '@/lib/formatMessage'

interface ChatMessageProps {
  message: Message
  index: number
  onUserClick: (userId: string) => void
}

export default function ChatMessage({
  message,
  index,
  onUserClick,
}: ChatMessageProps) {
  const { user: me } = useMeStore()
  const [showProfile, setShowProfile] = useState(false)
  const isSelf = me?.id === message.user.id
  const isEven = index % 2 === 0

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (message.type === 'system') {
    return (
      <div className="text-center text-xs text-gray-500 py-1 italic">
        {message.content}
      </div>
    )
  }

  // Check if user is special (could be based on role, wallet, etc.)
  const isSpecialUser = false // TODO: Implement special user detection

  const renderFormattedContent = (content: string) => {
    const parts = parseMessageFormat(content)
    return (
      <>
        {parts.map((part, idx) => {
          const style: React.CSSProperties = {}
          if (part.color) {
            style.color = part.color
          }

          let className = ''
          if (part.bold) className += ' font-bold'
          if (part.italic) className += ' italic'
          if (part.underline) className += ' underline'

          return (
            <span key={idx} style={style} className={className}>
              {part.text}
            </span>
          )
        })}
      </>
    )
  }

  return (
    <div
      className={`px-2 py-1 text-sm ${
        isEven ? 'message-row-even' : 'message-row-odd'
      } hover:message-row-hover`}
    >
      <div className="flex items-start">
        <span
          className={`font-bold cursor-pointer hover:underline mr-1 ${
            isSpecialUser ? 'text-red-600' : 'text-blue-600'
          }`}
          onClick={() => onUserClick(message.user.id)}
        >
          {message.user.displayName}
        </span>
        <span className="text-gray-700">:</span>
        <span className={`ml-1 ${isSpecialUser ? 'text-red-600' : 'text-black'}`}>
          {message.type === 'text' && (
            <span className="whitespace-pre-wrap break-words">
              {renderFormattedContent(message.content || '')}
            </span>
          )}
          {message.type === 'sticker' && message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="Sticker"
              className="max-w-[120px] max-h-[120px] inline-block"
              loading="lazy"
            />
          )}
          {message.type === 'gif' && message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="GIF"
              className="max-w-[300px] max-h-[300px] inline-block"
              loading="lazy"
            />
          )}
          {message.type === 'image' && message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="Image"
              className="max-w-full max-h-[400px] inline-block"
              loading="lazy"
            />
          )}
        </span>
      </div>
    </div>
  )
}

