"use client"

import { PrairieAsterLogo } from "@/components/prairie-aster-logo"
import { AdSpace } from "@/components/ad-space"

export function AppHeader() {
  return (
    <header className="sticky top-0 bg-white" style={{height: '75px'}}>
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full h-full px-4 lg:px-8" style={{paddingTop: '2px', paddingBottom: '1px'}}>
        {/* Logo - Optimized for Tight Space */}
        <div className="flex items-center gap-3">
          <PrairieAsterLogo size={48} />
          <div className="flex flex-col justify-center" style={{height: '100%'}}>
            <h1 className="text-xl font-bold text-purple-700" style={{color: '#7563A8', lineHeight: '1.2', marginBottom: '2px'}}>
              Nearest Nice Weather
            </h1>
            <p className="parent-brand text-xs font-medium" style={{color: '#8DA8CC'}}>
              by PrairieAster.Ai
            </p>
          </div>
        </div>

        {/* Revenue Space - Standard Ad Placement with Clear Separation */}
        <div className="flex items-center ml-8 mr-4">
          <AdSpace size="header" />
        </div>
      </div>
    </header>
  )
}