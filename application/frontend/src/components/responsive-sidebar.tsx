"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResponsiveSidebarProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveSidebar({ children, className }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Debug logging
  // console.log('ResponsiveSidebar render - isOpen:', isOpen, 'isMounted:', isMounted)
  
  const handleMenuToggle = () => {
    // console.log('Button clicked! Current state:', isOpen, 'Setting to:', !isOpen);
    setIsOpen(!isOpen);
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Desktop Sidebar - Always visible on lg+ screens */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:bg-white lg:border-r lg:border-gray-200 lg:overflow-y-auto lg:z-30",
        className
      )}>
        <div className="flex-1 flex flex-col min-h-0 pt-20">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex-1 px-3 space-y-1">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Modal - Shows on screens < lg */}
      <div className="lg:hidden">
        {/* Hamburger Menu Button - Fixed size and positioning */}
        <button
          className="fixed top-16 left-4 z-50 bg-white shadow-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 lg:hidden"
          data-testid="mobile-menu-trigger"
          onClick={handleMenuToggle}
          type="button"
          style={{ 
            width: '40px', 
            height: '40px',
            minWidth: '40px',
            minHeight: '40px'
          }}
        >
          <svg 
            className="text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth="2"
            width="20"
            height="20"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="sr-only">Open filters</span>
        </button>

        {/* Custom Modal - Only show when mounted and open */}
        {isMounted && isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
              data-testid="modal-backdrop"
            />
            
            {/* Modal Content */}
            <div 
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-lg z-50 lg:hidden overflow-y-auto"
              data-testid="modal-content"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0">
                <h2 className="text-lg font-semibold text-gray-800">
                  Weather Filters
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
                  data-testid="close-modal"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
              
              {/* Content */}
              <div className="px-4 py-4">
                {children}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}