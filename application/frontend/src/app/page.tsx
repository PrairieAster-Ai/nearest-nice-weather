'use client'

import { useState, useEffect } from 'react'

interface InfrastructureStatus {
  api: string
  database: string
  redis: string
  sample_locations?: number
  timestamp: string
}

interface Location {
  name: string
  state: string
  longitude: number
  latitude: number
}

interface Operator {
  business_name: string
  business_type: string
  contact_email: string
  longitude: number
  latitude: number
}

export default function Home() {
  const [status, setStatus] = useState<InfrastructureStatus | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch infrastructure status
        const statusRes = await fetch(`${apiUrl}/infrastructure`)
        const statusData = await statusRes.json()
        setStatus(statusData)

        // Fetch locations
        const locationsRes = await fetch(`${apiUrl}/locations`)
        const locationsData = await locationsRes.json()
        if (locationsData.locations) {
          setLocations(locationsData.locations)
        }

        // Fetch operators
        const operatorsRes = await fetch(`${apiUrl}/operators`)
        const operatorsData = await operatorsRes.json()
        if (operatorsData.operators) {
          setOperators(operatorsData.operators)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [apiUrl])

  const getStatusColor = (status: string) => {
    if (status === 'running' || status === 'connected') return 'text-green-600'
    if (status.includes('error')) return 'text-red-600'
    return 'text-yellow-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading infrastructure status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌤️ Nearest Nice Weather
          </h1>
          <p className="text-xl text-gray-600">
            Weather Intelligence Platform - Infrastructure Validation
          </p>
          {status && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </p>
          )}
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            Error: {error}
          </div>
        )}

        {/* Infrastructure Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🚀 API Status</h2>
            {status && (
              <div className="space-y-2">
                <div className={`font-medium ${getStatusColor(status.api)}`}>
                  FastAPI: {status.api}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🗄️ Database</h2>
            {status && (
              <div className="space-y-2">
                <div className={`font-medium ${getStatusColor(status.database)}`}>
                  PostgreSQL: {status.database}
                </div>
                {status.sample_locations && (
                  <div className="text-sm text-gray-600">
                    Sample locations: {status.sample_locations}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Cache</h2>
            {status && (
              <div className="space-y-2">
                <div className={`font-medium ${getStatusColor(status.redis)}`}>
                  Redis: {status.redis}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample Data */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Locations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📍 Sample Locations</h2>
            {locations.length > 0 ? (
              <div className="space-y-3">
                {locations.map((location, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-medium text-gray-800">{location.name}, {location.state}</div>
                    <div className="text-sm text-gray-600">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No locations found</p>
            )}
          </div>

          {/* Tourism Operators */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🏕️ Tourism Operators</h2>
            {operators.length > 0 ? (
              <div className="space-y-3">
                {operators.map((operator, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <div className="font-medium text-gray-800">{operator.business_name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {operator.business_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-blue-600">{operator.contact_email}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No operators found</p>
            )}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🛠️ Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded">
              <div className="font-medium">FastAPI</div>
              <div className="text-sm text-gray-600">Backend API</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="font-medium">Next.js</div>
              <div className="text-sm text-gray-600">Frontend PWA</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="font-medium">PostgreSQL + PostGIS</div>
              <div className="text-sm text-gray-600">Geographic Database</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="font-medium">Redis</div>
              <div className="text-sm text-gray-600">Cache & Sessions</div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-500">
          <p>🚀 Ready for Minnesota tourism operators and outdoor enthusiasts</p>
        </footer>
      </div>
    </div>
  )
}