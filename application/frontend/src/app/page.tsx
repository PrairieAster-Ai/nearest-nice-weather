"use client"

import { useState, useEffect } from "react"
import { DEBUG } from "@/lib/debug"
import { WeatherResultsComponent } from "@/components/weather-results"
import { FabFilterGroups } from "@/components/fab-filter-groups"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { FeedbackWidget } from "@/components/feedback-widget"
import { LocationCycleFab } from "@/components/location-cycle-fab"
import { generateMockWeatherData } from "@/lib/mock-weather-data"

interface WeatherResult {
  id: string
  locationName: string
  distance: string
  temperature: number
  precipitation: string
  wind: string
  description: string
}

export default function Home() {
  DEBUG.render('Home');
  
  // Simplified state with debug logging
  const [showResults, setShowResults] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  
  const [userLocation, setUserLocation] = useState({
    name: "Minneapolis",
    coords: [44.9778, -93.2650] as [number, number]
  })
  
  const [filters, setFilters] = useState({
    temperature: "comfortable",
    precipitation: "unlikely", 
    wind: "low"
  })
  
  const [currentResults, setCurrentResults] = useState(() => {
    const results = generateMockWeatherData(filters, 6, userLocation.coords)
    DEBUG.log('Home', 'initialResults', `Generated ${results.length} results`);
    return results;
  })
  
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  // Handle filter changes with debug logging
  const handleFilterChange = (category: keyof typeof filters, value: string) => {
    DEBUG.log('Home', 'filterChange', { category, value });
    
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    DEBUG.state('Home', 'filters', newFilters);
    
    handleSearch(newFilters)
  }

  // Handle location changes with debug logging
  const handleLocationChange = (location: { name: string; coords: [number, number] }) => {
    DEBUG.log('Home', 'locationChange', location);
    
    setUserLocation(location)
    DEBUG.state('Home', 'userLocation', location);
    
    const newResults = generateMockWeatherData(filters, 8, location.coords)
    setCurrentResults(newResults)
    DEBUG.log('Home', 'locationResults', `Generated ${newResults.length} results for ${location.name}`);
  }

  const handleSearch = async (searchFilters: any) => {
    DEBUG.log('Home', 'searchStart', { filters: searchFilters, hasInitiallyLoaded });
    
    if (!hasInitiallyLoaded) {
      setHasInitiallyLoaded(true)
      DEBUG.state('Home', 'hasInitiallyLoaded', true);
      
      const initialResults = generateMockWeatherData(searchFilters, 6, userLocation.coords)
      setCurrentResults(initialResults)
      DEBUG.log('Home', 'initialSearch', `Loaded ${initialResults.length} results`);
      return
    }
    
    setResultsLoading(true)
    DEBUG.state('Home', 'resultsLoading', true);
    setShowResults(true)
    
    setTimeout(() => {
      const newResults = generateMockWeatherData(searchFilters, 8, userLocation.coords)
      setCurrentResults(newResults)
      setResultsLoading(false)
      DEBUG.state('Home', 'resultsLoading', false);
      DEBUG.log('Home', 'searchComplete', `Updated to ${newResults.length} results`);
    }, 2500)
  }

  const handleFeedbackClick = () => {
    DEBUG.log('Home', 'feedbackClick');
    setShowFeedback(true)
    DEBUG.state('Home', 'showFeedback', true);
  }

  const handleFeedbackClose = () => {
    DEBUG.log('Home', 'feedbackClose');
    setShowFeedback(false)
    DEBUG.state('Home', 'showFeedback', false);
  }

  return (
    <div className="bg-gray-50" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      
      {/* Main Content Area - Preserving original branded layout */}
      <main style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8" style={{ flex: '1', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <section style={{ flex: '1', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="relative" style={{ flex: '1', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <WeatherResultsComponent 
                results={currentResults}
                loading={resultsLoading}
              />
              
              <FabFilterGroups 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              
              <LocationCycleFab 
                onLocationChange={handleLocationChange}
              />
            </div>
          </section>
        </div>
      </main>

      {/* PWA Install Banner - Preserved from branded version */}
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

      <AppFooter onFeedbackClick={handleFeedbackClick} />
      
      <FeedbackWidget 
        show={showFeedback}
        onClose={handleFeedbackClose}
      />
    </div>
  )
}