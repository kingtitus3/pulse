'use client'

import { useState, useRef } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { useMeStore } from '@/store/useMeStore'
import EmojiPicker from './EmojiPicker'
import StickerPicker from './StickerPicker'
import GifPicker from './GifPicker'
import ImageUploadButton from './ImageUploadButton'
import ColorPicker from './ColorPicker'

interface MessageInputProps {
  roomSlug: string
}

export default function MessageInput({ roomSlug }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showGifs, setShowGifs] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { currentRoomSlug } = useChatStore()
  const { user } = useMeStore()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const messageContent = content.trim()
    if (!messageContent) return

    // Don't allow sending while processing
    if (inputRef.current?.disabled) return

    // Ensure session exists first
    try {
      const sessionRes = await fetch('/api/session/ensure')
      if (!sessionRes.ok) {
        throw new Error('Session creation failed')
      }
    } catch (err) {
      console.error('Failed to ensure session:', err)
      alert('Failed to create session. Please refresh the page.')
      return
    }

    // Disable input while sending
    if (inputRef.current) {
      inputRef.current.disabled = true
    }
    setContent('') // Clear immediately

    try {
      const res = await fetch(`/api/rooms/${roomSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: messageContent,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[SEND] Failed:', res.status, errorData)
        // Restore content on error
        setContent(messageContent)
        alert(`Failed to send: ${errorData.error || res.statusText}`)
        return
      }

      // Success - message will appear via polling
      inputRef.current?.focus()
    } catch (error: any) {
      console.error('[SEND] Error:', error)
      // Restore content on error
      setContent(messageContent)
      alert('Failed to send message. Please try again.')
    } finally {
      // Re-enable input
      if (inputRef.current) {
        inputRef.current.disabled = false
      }
    }
  }

  const handleNudge = () => {
    // Client-side window shake
    if (typeof window !== 'undefined') {
      window.navigator.vibrate?.(200)
      // Visual shake effect
      document.body.style.animation = 'shake 0.5s'
      setTimeout(() => {
        document.body.style.animation = ''
      }, 500)
    }
  }

  const handleStickerSelect = async (mediaUrl: string, stickerId: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sticker',
          mediaUrl,
        }),
      })

      if (res.ok) {
        // Record sticker use
        await fetch('/api/stickers/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stickerId }),
        })
      }

      setShowStickers(false)
    } catch (error) {
      console.error('Failed to send sticker:', error)
    }
  }

  const handleGifSelect = async (gifUrl: string) => {
    try {
      await fetch(`/api/rooms/${roomSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gif',
          mediaUrl: gifUrl,
        }),
      })
      setShowGifs(false)
    } catch (error) {
      console.error('Failed to send GIF:', error)
    }
  }

  const handleImageSelect = async (imageUrl: string, width: number, height: number) => {
    try {
      await fetch(`/api/rooms/${roomSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          mediaUrl: imageUrl,
          width,
          height,
        }),
      })
    } catch (error) {
      console.error('Failed to send image:', error)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const start = inputRef.current?.selectionStart || content.length
    const end = inputRef.current?.selectionEnd || content.length
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    setContent(newContent)
    setTimeout(() => {
      inputRef.current?.setSelectionRange(start + emoji.length, start + emoji.length)
      inputRef.current?.focus()
    }, 0)
    setShowEmojis(false)
  }

  const handleColorSelect = (color: string) => {
    const start = inputRef.current?.selectionStart || 0
    const end = inputRef.current?.selectionEnd || 0
    const selected = content.substring(start, end)
    
    if (selected) {
      // Wrap selected text with color tags
      const colorCode = color.replace('#', '')
      const newContent = content.substring(0, start) + `[color:${colorCode}]${selected}[/color]` + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        const newStart = start + `[color:${colorCode}]`.length
        const newEnd = newStart + selected.length
        inputRef.current?.setSelectionRange(newStart, newEnd)
        inputRef.current?.focus()
      }, 0)
    } else {
      // Insert color tag at cursor position
      const colorCode = color.replace('#', '')
      const newContent = content.substring(0, start) + `[color:${colorCode}][/color]` + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        const newPos = start + `[color:${colorCode}]`.length
        inputRef.current?.setSelectionRange(newPos, newPos)
        inputRef.current?.focus()
      }, 0)
    }
    setShowColorPicker(false)
  }

  return (
    <div className="border-t-2 border-gray-400 bg-gray-100 p-2 relative">
      {/* Pickers - positioned absolutely */}
      {showEmojis && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojis(false)}
          />
        </div>
      )}
      {showStickers && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <StickerPicker
            onSelect={handleStickerSelect}
            onClose={() => setShowStickers(false)}
          />
        </div>
      )}
      {showGifs && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <GifPicker
            onSelect={handleGifSelect}
            onClose={() => setShowGifs(false)}
          />
        </div>
      )}
      {showColorPicker && (
        <ColorPicker
          onSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 mb-1">
        <button
          className="w-6 h-6 border border-gray-400 bg-white hover:bg-gray-50 text-xs font-bold"
          title="Bold"
          onClick={() => {
            const start = inputRef.current?.selectionStart || 0
            const end = inputRef.current?.selectionEnd || 0
            const selected = content.substring(start, end)
            const newContent = content.substring(0, start) + `*${selected}*` + content.substring(end)
            setContent(newContent)
            setTimeout(() => {
              inputRef.current?.setSelectionRange(start + 1, end + 1)
              inputRef.current?.focus()
            }, 0)
          }}
        >
          B
        </button>
        <button
          className="w-6 h-6 border border-gray-400 bg-white hover:bg-gray-50 text-xs italic"
          title="Italic"
          onClick={() => {
            const start = inputRef.current?.selectionStart || 0
            const end = inputRef.current?.selectionEnd || 0
            const selected = content.substring(start, end)
            const newContent = content.substring(0, start) + `_${selected}_` + content.substring(end)
            setContent(newContent)
            setTimeout(() => {
              inputRef.current?.setSelectionRange(start + 1, end + 1)
              inputRef.current?.focus()
            }, 0)
          }}
        >
          I
        </button>
        <button
          className="w-6 h-6 border border-gray-400 bg-white hover:bg-gray-50 text-xs underline"
          title="Underline"
          onClick={() => {
            const start = inputRef.current?.selectionStart || 0
            const end = inputRef.current?.selectionEnd || 0
            const selected = content.substring(start, end)
            const newContent = content.substring(0, start) + `~${selected}~` + content.substring(end)
            setContent(newContent)
            setTimeout(() => {
              inputRef.current?.setSelectionRange(start + 1, end + 1)
              inputRef.current?.focus()
            }, 0)
          }}
        >
          U
        </button>
        <div className="relative">
          <button
            className="w-6 h-6 border border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center cursor-pointer"
            title="Color"
            onClick={() => {
              setShowColorPicker(!showColorPicker)
            }}
          >
            <span className="text-xs" style={{ color: '#0066CC' }}>A</span>
          </button>
        </div>
        <label className="sr-only" htmlFor="font-family-select">
          Font family
        </label>
        <select
          id="font-family-select"
          name="font-family"
          className="text-xs border border-gray-400 bg-white px-1 py-0.5 h-6"
        >
          <option>Arial</option>
          <option>Verdana</option>
          <option>Tahoma</option>
        </select>
        <label className="sr-only" htmlFor="font-size-select">
          Font size
        </label>
        <select
          id="font-size-select"
          name="font-size"
          className="text-xs border border-gray-400 bg-white px-1 py-0.5 h-6"
        >
          <option>10</option>
          <option>12</option>
          <option>14</option>
        </select>
        <button
          className="btn-yahoo-secondary text-xs px-2 ml-auto"
          onClick={() => {
            // TODO: Implement report abuse
            alert('Report abuse feature coming soon')
          }}
        >
          Report Abuse
        </button>
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <textarea
            id="message-input"
            name="message"
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="input-yahoo flex-1 resize-none border-2 border-gray-400"
            rows={3}
            placeholder="I can type my message here!"
          />
          {/* Media Buttons */}
          <div className="flex gap-1">
            <button
              className="btn-yahoo-secondary text-xs px-2 py-1"
              onClick={() => {
                setShowEmojis(!showEmojis)
                setShowStickers(false)
                setShowGifs(false)
              }}
              title="Emojis"
            >
              ☺
            </button>
            <button
              className="btn-yahoo-secondary text-xs px-2 py-1"
              onClick={() => {
                setShowStickers(!showStickers)
                setShowEmojis(false)
                setShowGifs(false)
              }}
              title="Stickers"
            >
              😀
            </button>
            <button
              className="btn-yahoo-secondary text-xs px-2 py-1"
              onClick={() => {
                setShowGifs(!showGifs)
                setShowEmojis(false)
                setShowStickers(false)
              }}
              title="GIFs"
            >
              GIF
            </button>
            <ImageUploadButton onSelect={handleImageSelect} />
          </div>
        </div>
        <button className="btn-yahoo px-4 py-2" onClick={handleSend}>
          Send
        </button>
      </div>

      {/* Bottom Buttons */}
      <div className="flex gap-2 mt-1">
        <button className="btn-yahoo-secondary text-xs px-3 py-1">
          Hands-free
        </button>
        <button className="btn-yahoo-secondary text-xs px-3 py-1">
          Talk
        </button>
        <button className="btn-yahoo-secondary text-xs px-3 py-1">
          Mute
        </button>
      </div>
    </div>
  )
}

