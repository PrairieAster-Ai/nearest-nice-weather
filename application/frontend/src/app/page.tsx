"use client"

import { useState } from "react"
import { WeatherResultsComponent } from "@/components/weather-results"
import { FabFilterGroups } from "@/components/fab-filter-groups"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"

interface WeatherResult {
  id: string
  locationName: string
  distance: string
  temperature: number
  precipitation: string
  wind: string
  description: string
}

// Mock data for prototype demonstration
const mockResults: WeatherResult[] = [
  {
    id: "1",
    locationName: "Brainerd Lakes Area",
    distance: "92 miles N",
    temperature: 72,
    precipitation: "unlikely",
    wind: "low",
    description: "Perfect conditions for lake activities with calm winds and clear skies. Ideal for fishing, kayaking, and outdoor camping."
  },
  {
    id: "2", 
    locationName: "Duluth North Shore",
    distance: "156 miles NE",
    temperature: 68,
    precipitation: "sporadic",
    wind: "medium",
    description: "Great weather for hiking and sightseeing along Lake Superior. Light afternoon breeze with occasional clouds."
  },
  {
    id: "3",
    locationName: "Grand Rapids",
    distance: "124 miles N",
    temperature: 75,
    precipitation: "unlikely",
    wind: "low",
    description: "Excellent conditions for BWCA entry point activities. Calm, warm weather perfect for canoe trips and wilderness camping."
  }
]

export default function Home() {
  const [showResults, setShowResults] = useState(true) // Show results by default
  const [resultsLoading, setResultsLoading] = useState(false)
  const [currentResults, setCurrentResults] = useState(mockResults) // Start with default results
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  
  // Weather filter state
  const [filters, setFilters] = useState({
    temperature: "comfortable",
    precipitation: "unlikely", 
    wind: "low"
  })

  // Handle filter changes from FAB groups
  const handleFilterChange = (category: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    handleSearch(newFilters)
  }

  // This would be called when filters change
  const handleSearch = async (searchFilters: any) => {
    // console.log('handleSearch called with:', searchFilters)
    
    // Skip animation ONLY for the very first automatic load
    if (!hasInitiallyLoaded) {
      setHasInitiallyLoaded(true)
      // console.log('Initial load - skipping loading animation')
      // But still set the results without animation
      setCurrentResults([...mockResults])
      return
    }
    
    // ALWAYS trigger loading animation for user-initiated searches
    // console.log('User-initiated search - showing loading animation')
    setResultsLoading(true)
    setShowResults(true)
    
    // console.log('Auto-searching with filters:', searchFilters)
    
    // Simulate API call delay - always show animation for user feedback
    setTimeout(() => {
      // console.log('Search completed, setting results')
      // Always set results (even if they're the same) to provide consistent UX
      setCurrentResults([...mockResults]) // Create new array reference to force re-render
      setResultsLoading(false)
    }, 4000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Main Content Area */}
      <main className="pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Weather Results with Larger Map */}
          <section>
            <div className="relative">
              <WeatherResultsComponent 
                results={currentResults}
                loading={resultsLoading}
              />
              
              {/* FAB Filter Groups positioned over the map */}
              <FabFilterGroups 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </section>
        </div>
      </main>

      {/* PWA Install Banner */}
      <div className="hidden fixed bottom-4 left-4 right-4 lg:left-84 max-w-sm mx-auto lg:mx-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">☀️</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Install App</div>
              <div className="text-sm text-gray-600">Add to home screen for easy access</div>
            </div>
            <button className="text-primary-blue font-medium text-sm">Add</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <AppFooter />
    </div>
  )
}