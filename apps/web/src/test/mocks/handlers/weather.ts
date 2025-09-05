import { http, HttpResponse } from 'msw'

interface RequestWithJson extends Request {
  json(): Promise<any>
}

const mockLocations = [
  {
    id: 1,
    name: 'Duluth',
    latitude: 46.7867,
    longitude: -92.1005,
    state: 'MN',
    region: 'North Shore',
    temperature: 72,
    weather_condition: 'Sunny',
    activities: ['hiking', 'fishing']
  },
  {
    id: 2,
    name: 'Grand Marais',
    latitude: 47.7503,
    longitude: -90.3387,
    state: 'MN',
    region: 'Cook County',
    temperature: 68,
    weather_condition: 'Partly Cloudy',
    activities: ['kayaking', 'camping']
  }
]

export const weatherHandlers = [
  // Weather search endpoint
  http.post('http://localhost:8000/api/weather/search', async ({ request }) => {
    await (request as RequestWithJson).json() // Parse body but don't use it

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return HttpResponse.json({
      success: true,
      data: mockLocations,
      meta: {
        total: mockLocations.length,
        page: 1,
        limit: 10
      }
    })
  }),

  // Individual location endpoint
  http.get('http://localhost:8000/api/locations/:id', ({ params }) => {
    const locationId = params.id as string
    const location = mockLocations.find(l => l.id === Number(locationId))

    if (!location) {
      return HttpResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: location
    })
  }),

  // Feedback submission endpoint
  http.post('http://localhost:8000/api/feedback', async ({ request }) => {
    await (request as RequestWithJson).json() // Parse body but don't use it

    return HttpResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      id: Math.floor(Math.random() * 1000)
    })
  }),

  // Health check endpoint
  http.get('http://localhost:8000/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    })
  })
]
