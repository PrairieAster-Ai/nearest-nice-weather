"use client"

import { PrairieAsterLogo } from "@/components/prairie-aster-logo"

export function AppFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <PrairieAsterLogo size={24} />
            <div className="flex flex-col">
              <span className="text-sm font-medium" style={{color: '#7563A8'}}>
                Weather Intelligence Platform
              </span>
              <a 
                href="https://prairieaster.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs hover:underline transition-colors"
                style={{color: '#8DA8CC'}}
              >
                Powered by PrairieAster.Ai
              </a>
            </div>
          </div>

          {/* Right: Legal Links */}
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <button 
              onClick={() => window.open('/terms', '_blank')}
              className="hover:text-gray-800 transition-colors hover:underline"
            >
              Terms & Conditions
            </button>
            <button 
              onClick={() => window.open('/privacy', '_blank')}
              className="hover:text-gray-800 transition-colors hover:underline"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}