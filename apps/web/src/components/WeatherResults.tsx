import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  CircularProgress,
  Fade,
  Slide 
} from '@mui/material'

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

export function WeatherResults({ results, loading = false }: WeatherResultsProps) {
  const [showCompletionIndicator, setShowCompletionIndicator] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  // Show completion indicator when results arrive
  useEffect(() => {
    if (results.length > 0 && !loading) {
      setShowCompletionIndicator(true)
      const timer = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setShowCompletionIndicator(false), 500)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [results, loading])

  const getWeatherEmoji = (precipitation: string, wind: string) => {
    if (precipitation === "unlikely" && wind === "low") return "☀️"
    if (precipitation === "sporadic") return "⛅"
    if (precipitation === "likely") return "🌧️"
    if (wind === "high") return "💨"
    return "🌤️"
  }

  const getWindLabel = (wind: string) => {
    switch (wind) {
      case 'low': return 'Calm'
      case 'medium': return 'Breezy'
      case 'high': return 'Windy'
      default: return wind
    }
  }

  const getPrecipitationLabel = (precipitation: string) => {
    switch (precipitation) {
      case 'unlikely': return 'Sunny'
      case 'sporadic': return 'Mixed'
      case 'likely': return 'Rainy'
      default: return precipitation
    }
  }

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center h-96 space-y-4">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" className="text-gray-600">
          Finding perfect weather locations...
        </Typography>
        <Typography variant="body2" className="text-gray-500 text-center max-w-md">
          Analyzing conditions across Minnesota to find your ideal outdoor adventure spots
        </Typography>
      </Box>
    )
  }

  if (results.length === 0) {
    return (
      <Box className="text-center py-16">
        <div className="text-6xl mb-4">🌤️</div>
        <Typography variant="h4" className="text-gray-700 mb-4 font-light">
          Nearest Nice Weather
        </Typography>
        <Typography variant="h6" className="text-gray-500 mb-8">
          Select your perfect weather conditions using the filters below
        </Typography>
        <Box className="max-w-2xl mx-auto text-gray-400">
          <Typography variant="body1" className="mb-4">
            Choose your preferred temperature, precipitation, and wind conditions to discover the closest locations with ideal weather for your outdoor activities.
          </Typography>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🌡️</span>
              <span>Temperature</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🌧️</span>
              <span>Precipitation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">💨</span>
              <span>Wind</span>
            </div>
          </div>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      {/* Completion Indicator */}
      {showCompletionIndicator && (
        <Fade in={!fadeOut} timeout={500}>
          <Box className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardContent className="text-center p-6">
                <div className="text-4xl mb-2">✨</div>
                <Typography variant="h6" className="text-green-800 mb-1">
                  Perfect Weather Found!
                </Typography>
                <Typography variant="body2" className="text-green-600">
                  {results.length} location{results.length > 1 ? 's' : ''} match your preferences
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}

      {/* Results Header */}
      <Box className="text-center mb-8">
        <Typography variant="h4" className="text-gray-800 mb-2 font-light">
          Weather Results
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Found {results.length} location{results.length > 1 ? 's' : ''} with your ideal conditions
        </Typography>
      </Box>

      {/* Results Grid */}
      <Box className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((result, index) => (
          <Slide
            key={result.id}
            direction="up"
            in={true}
            timeout={300 + (index * 100)}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
              <CardContent className="p-6">
                <Box className="flex items-start justify-between mb-4">
                  <div>
                    <Typography variant="h6" className="text-gray-800 font-semibold mb-1">
                      {result.locationName}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                      {result.distance}
                    </Typography>
                  </div>
                  <div className="text-3xl">
                    {getWeatherEmoji(result.precipitation, result.wind)}
                  </div>
                </Box>

                <Box className="flex items-center space-x-4 mb-4">
                  <div className="text-center">
                    <Typography variant="h4" className="text-blue-600 font-bold">
                      {result.temperature}°
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      Temperature
                    </Typography>
                  </div>
                  
                  <Box className="flex flex-col space-y-2">
                    <Chip 
                      label={getPrecipitationLabel(result.precipitation)}
                      size="small"
                      color={result.precipitation === 'unlikely' ? 'primary' : 'default'}
                      variant={result.precipitation === 'unlikely' ? 'filled' : 'outlined'}
                    />
                    <Chip 
                      label={getWindLabel(result.wind)}
                      size="small"
                      color={result.wind === 'low' ? 'primary' : 'default'}
                      variant={result.wind === 'low' ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" className="text-gray-600 leading-relaxed">
                  {result.description}
                </Typography>

                <Box className="mt-4 pt-4 border-t border-gray-100">
                  <Typography variant="caption" className="text-gray-400">
                    Perfect for outdoor activities • Updated 2 hours ago
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        ))}
      </Box>

      {/* Call to Action */}
      <Box className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <Typography variant="h6" className="text-gray-700 mb-2">
          Ready for your adventure?
        </Typography>
        <Typography variant="body2" className="text-gray-500 mb-4">
          These locations offer ideal conditions for your preferred weather
        </Typography>
        <Box className="flex justify-center space-x-4">
          <div className="text-center">
            <span className="text-2xl">🎯</span>
            <Typography variant="caption" className="block text-gray-600">
              Precise Match
            </Typography>
          </div>
          <div className="text-center">
            <span className="text-2xl">⏱️</span>
            <Typography variant="caption" className="block text-gray-600">
              Real-time Data
            </Typography>
          </div>
          <div className="text-center">
            <span className="text-2xl">📍</span>
            <Typography variant="caption" className="block text-gray-600">
              Minnesota Focus
            </Typography>
          </div>
        </Box>
      </Box>
    </Box>
  )
}