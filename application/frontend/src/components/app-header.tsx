"use client"

import { Button } from "@/components/ui/button"
import { User, Settings, Menu } from "lucide-react"
import { PrairieAsterLogo } from "@/components/prairie-aster-logo"

export function AppHeader() {
  return (
    <header className="sticky top-0 bg-white" style={{height: '3rem'}}>
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full h-full">
        {/* Logo - Clean Layout */}
        <div className="flex items-center gap-3">
          <PrairieAsterLogo size={36} />
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold leading-none text-purple-700" style={{color: '#7563A8'}}>
              Nearest Nice Weather
            </h1>
            <p className="parent-brand" style={{color: '#8DA8CC'}}>
              by PrairieAster.Ai
            </p>
          </div>
        </div>

        {/* User Menu - Compact */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}