"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface CompactFilterOptionProps {
  label: string
  value: string
  options: Array<{ value: string; emoji: string; label: string }>
  onChange: (value: string) => void
  size?: 'small' | 'medium'
}

export function CompactFilterOption({ 
  label, 
  value, 
  options, 
  onChange, 
  size = 'small' 
}: CompactFilterOptionProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(opt => opt.value === value) || options[0]
  const isSmall = size === 'small'
  
  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          ${isSmall ? 'px-2 py-2' : 'px-3 py-2.5'}
          bg-white border border-blue-200 rounded-lg
          hover:border-purple-300 hover:bg-purple-50
          active:scale-[0.98] transition-all duration-150
          touch-manipulation select-none
          ${isSmall ? 'min-h-[44px]' : 'min-h-[48px]'}
        `}
        style={{ 
          borderColor: isOpen ? '#7563A8' : '#8DA8CC',
          backgroundColor: isOpen ? '#F8F7FB' : '#ffffff'
        }}
      >
        <div className="flex items-center gap-2">
          <span className={isSmall ? 'text-sm' : 'text-base'}>
            {selectedOption.emoji}
          </span>
          <div className="text-left">
            <div className={`font-medium text-purple-700 ${isSmall ? 'text-xs' : 'text-sm'}`}>
              {label}
            </div>
            <div className={`text-gray-600 ${isSmall ? 'text-xs' : 'text-sm'}`}>
              {selectedOption.label}
            </div>
          </div>
        </div>
        
        <ChevronDown 
          className={`
            ${isSmall ? 'w-4 h-4' : 'w-5 h-5'} 
            text-purple-600 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <div className="bg-white border border-purple-200 rounded-lg shadow-lg overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 
                  ${isSmall ? 'px-3 py-2' : 'px-4 py-3'}
                  hover:bg-purple-50 active:bg-purple-100
                  transition-colors duration-150
                  ${option.value === value ? 'bg-purple-100 border-l-4 border-purple-500' : ''}
                  touch-manipulation
                  ${isSmall ? 'min-h-[40px]' : 'min-h-[44px]'}
                `}
              >
                <span className={isSmall ? 'text-base' : 'text-lg'}>
                  {option.emoji}
                </span>
                <span className={`text-gray-700 font-medium ${isSmall ? 'text-sm' : 'text-base'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}