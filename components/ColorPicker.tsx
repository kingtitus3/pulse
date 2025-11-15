'use client'

import { useState, useRef, useEffect } from 'react'

interface ColorPickerProps {
  onSelect: (color: string) => void
  onClose: () => void
}

// Common colors matching classic chat apps
const PRESET_COLORS = [
  '#000000', '#000080', '#008000', '#008080', '#800000', '#800080', '#808000', '#808080',
  '#C0C0C0', '#0000FF', '#00FF00', '#00FFFF', '#FF0000', '#FF00FF', '#FFFF00', '#FFFFFF',
  '#FF8040', '#FF4080', '#8040FF', '#4080FF', '#40FF80', '#80FF40', '#FF4080', '#FF8040',
]

export default function ColorPicker({ onSelect, onClose }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onSelect(color)
    onClose()
  }

  return (
    <div
      ref={pickerRef}
      className="bg-white border-2 border-gray-400 shadow-lg p-2 absolute bottom-full right-0 mb-2 z-50"
    >
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold">Text Color</h3>
        <button
          className="text-gray-700 hover:bg-gray-300 px-1 text-sm font-bold"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-8 gap-1 mb-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className="w-6 h-6 border border-gray-400 hover:border-blue-500"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="border-t border-gray-400 pt-2">
        <label className="text-xs text-gray-700 mb-1 block">Custom Color:</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-12 h-8 border border-gray-400 cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                setSelectedColor(e.target.value)
              }
            }}
            className="input-yahoo text-xs w-20"
            placeholder="#000000"
          />
          <button
            className="btn-yahoo text-xs px-2 py-1"
            onClick={() => handleColorSelect(selectedColor)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

