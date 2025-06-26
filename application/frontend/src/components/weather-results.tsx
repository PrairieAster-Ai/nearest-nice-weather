"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MapPin, Thermometer, CloudRain, Wind } from "lucide-react"

interface WeatherResult {
  id: string
  locationName: string
  distance: string
  temperature: number
  precipitation: string
  wind: string
  description: string
}

interface WeatherResultsProps {
  results: WeatherResult[]
  loading?: boolean
}

export function WeatherResultsComponent({ results, loading = false }: WeatherResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Finding nice weather near you...
        </h2>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl weather-loading" />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div>
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No results yet
            </h3>
            <p className="text-gray-500">
              Select your weather preferences above and click "Find Nice Weather" to see locations with your ideal conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-6">
        Nice weather found! ({results.length} locations)
      </h2>
      
      <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
        <Card key={result.id} className="hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-blue" />
                {result.locationName}
              </h3>
              <span className="bg-prairie-green text-white px-3 py-1 rounded-full text-sm font-medium">
                {result.distance}
              </span>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Thermometer className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{result.temperature}°F</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <CloudRain className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium capitalize">{result.precipitation}</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <Wind className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium capitalize">{result.wind}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              {result.description}
            </p>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  )
}