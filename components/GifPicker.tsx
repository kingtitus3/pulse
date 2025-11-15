'use client'

import { useState } from 'react'

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) return

    setLoading(true)
    try {
      // Use Tenor API if available, otherwise use Giphy as fallback
      const apiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY
      
      if (apiKey) {
        const res = await fetch(
          `https://api.tenor.com/v1/search?q=${encodeURIComponent(search)}&key=${apiKey}&limit=20&media_filter=basic`
        )
        const data = await res.json()
        setGifs(data.results || [])
      } else {
        // Fallback: Use Giphy public API (no key required for basic search)
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(search)}&limit=20&rating=g&api_key=dc6zaTOxFJmzC`
        )
        const data = await res.json()
        setGifs(
          data.data?.map((gif: any) => ({
            id: gif.id,
            title: gif.title,
            media: [
              {
                gif: { url: gif.images.original.url },
                tinygif: { url: gif.images.fixed_height_small.url },
              },
            ],
          })) || []
        )
      }
    } catch (error) {
      console.error('Failed to search GIFs:', error)
      setGifs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-2 border-gray-400 shadow-lg w-96 h-96 flex flex-col">
      <div className="bg-gray-200 border-b-2 border-gray-400 px-2 py-1 flex justify-between items-center">
        <h3 className="text-xs font-bold">GIFs</h3>
        <button
          className="text-gray-700 hover:bg-gray-300 px-2 py-0.5 text-sm font-bold"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="flex gap-2 p-2 border-b border-gray-400">
        <input
          id="gif-search"
          name="gif-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="input-yahoo flex-1 text-xs"
          placeholder="Search GIFs..."
        />
        <button className="btn-yahoo text-xs px-3" onClick={handleSearch}>
          Search
        </button>
      </div>
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-600">Loading...</div>
        </div>
      )}
      {!loading && gifs.length === 0 && search && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-600">No GIFs found</div>
        </div>
      )}
      {!loading && !search && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-600">Enter a search term to find GIFs</div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {gifs.map((gif: any) => (
            <button
              key={gif.id}
              className="hover:bg-blue-200 border border-gray-300 overflow-hidden"
              onClick={() => onSelect(gif.media[0].gif.url)}
            >
              <img
                src={gif.media[0].tinygif.url}
                alt={gif.title}
                className="w-full h-auto"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

