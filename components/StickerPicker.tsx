'use client'

import { useState, useEffect } from 'react'

interface StickerPack {
  id: string
  slug: string
  name: string
  kind: string
  basePath?: string
  stickers?: Array<{
    id: string
    filename: string
    emoji: string | null
  }>
}

interface StickerPickerProps {
  onSelect: (mediaUrl: string, stickerId: string) => void
  onClose: () => void
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [overview, setOverview] = useState<any>(null)
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null)
  const [activeTab, setActiveTab] = useState<'recents' | 'favorites' | 'trending' | string>('recents')

  useEffect(() => {
    fetch('/api/stickers/overview')
      .then((res) => res.json())
      .then((data) => setOverview(data))
      .catch(console.error)
  }, [])

  const handlePackClick = async (pack: StickerPack) => {
    if (!pack.stickers || pack.stickers.length === 0) {
      // Fetch pack details
      const res = await fetch(`/api/stickers/packs/${pack.id}`)
      const data = await res.json()
      setSelectedPack(data)
    } else {
      setSelectedPack(pack)
    }
  }

  const handleStickerClick = (sticker: { id: string; filename: string }, pack: StickerPack) => {
    // Build sticker URL
    if (!pack.basePath) return
    const mediaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/stickers/${pack.basePath}/${sticker.filename}`
    onSelect(mediaUrl, sticker.id)
  }

  if (selectedPack && selectedPack.stickers) {
    return (
      <div className="bg-white border-2 border-gray-400 shadow-lg w-96 h-96 flex flex-col">
        <div className="bg-gray-200 border-b-2 border-gray-400 px-2 py-1 flex justify-between items-center">
          <h3 className="text-xs font-bold">{selectedPack.name}</h3>
          <button
            className="text-gray-700 hover:bg-gray-300 px-2 py-0.5 text-sm font-bold"
            onClick={() => setSelectedPack(null)}
          >
            ← Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-4 gap-2">
            {selectedPack.stickers.map((sticker) => (
              <button
                key={sticker.id}
                className="p-2 hover:bg-blue-200 border border-gray-300"
                onClick={() => handleStickerClick(sticker, selectedPack)}
              >
                {selectedPack.basePath && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/stickers/${selectedPack.basePath}/${sticker.filename}`}
                    alt={sticker.emoji || 'Sticker'}
                    className="w-full h-auto object-contain"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="bg-white border-2 border-gray-400 shadow-lg w-80 h-64 flex items-center justify-center">
        <div className="text-xs text-gray-600">Loading stickers...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-400 shadow-lg w-80 h-96 flex flex-col">
      <div className="bg-gray-200 border-b-2 border-gray-400 px-2 py-1 flex justify-between items-center">
        <h3 className="text-xs font-bold">Stickers</h3>
        <button
          className="text-gray-700 hover:bg-gray-300 px-2 py-0.5 text-sm font-bold"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="flex gap-1 mb-1 border-b border-gray-400 bg-gray-100 px-1">
        <button
          className={`px-2 py-1 text-xs ${
            activeTab === 'recents'
              ? 'bg-white border-b-2 border-blue-500 font-bold'
              : 'hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('recents')}
        >
          Recents
        </button>
        <button
          className={`px-2 py-1 text-xs ${
            activeTab === 'favorites'
              ? 'bg-white border-b-2 border-blue-500 font-bold'
              : 'hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
        <button
          className={`px-2 py-1 text-xs ${
            activeTab === 'trending'
              ? 'bg-white border-b-2 border-blue-500 font-bold'
              : 'hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('trending')}
        >
          Trending
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {(activeTab === 'recents'
          ? overview.recents
          : activeTab === 'favorites'
          ? overview.favorites
          : overview.trending
        ).map((pack: StickerPack) => (
          <button
            key={pack.id}
            className="w-full text-left p-2 hover:bg-blue-200 mb-1 border border-gray-300"
            onClick={() => handlePackClick(pack)}
          >
            <div className="text-xs font-semibold">{pack.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

