"use client"

import { useState } from "react"
import { WeatherFiltersComponent } from "@/components/weather-filters"
import { WeatherResultsComponent } from "@/components/weather-results"
import { AppHeader } from "@/components/app-header"

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

  // This would be called by the WeatherFiltersComponent when filters change
  const handleSearch = async (filters: any) => {
    setResultsLoading(true)
    setShowResults(true)
    
    console.log('Auto-searching with filters:', filters)
    
    // Simulate API call delay
    setTimeout(() => {
      setResultsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Main Content Area */}
      <main className="pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8" style={{paddingTop: '5px'}}>
          {/* Filters Section */}
          <section className="mb-6">
            <div className="bg-white rounded-xl shadow-sm p-3 lg:p-4">
              <WeatherFiltersComponent onSearch={handleSearch} />
            </div>
          </section>

          {/* Weather Results */}
          <section>
            <WeatherResultsComponent 
              results={resultsLoading ? [] : mockResults}
              loading={resultsLoading}
            />
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
    </div>
  )
}