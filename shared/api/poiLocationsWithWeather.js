/**
 * ========================================================================
 * SHARED CORE: POI Locations + Weather
 * ========================================================================
 *
 * Framework-agnostic orchestration for the primary map endpoint. Both API
 * adapters call this with environment-specific dependencies injected:
 *
 *   - localhost  → dev-api-server.js          (Express + node-postgres)
 *   - production → apps/web/api/...           (Vercel + @neondatabase/serverless)
 *
 * The ONLY things that legitimately differ between environments are the
 * database driver and the weather fetcher, so those are injected. Everything
 * else (row normalization, weather enrichment, filtering, response shape) lives
 * here once — eliminating the copy-paste that previously drifted between the
 * two implementations (e.g. the localhost weather_description/source/timestamp
 * fields were silently undefined before this consolidation).
 *
 * @SYNC_NOTE: This replaces the duplicated orchestration in both adapters.
 * ========================================================================
 */

import { transformPOIResults } from '../database/queries.js'
import { applyWeatherFilters } from '../weather/filters.js'

const noopLogger = { info() {}, debug() {}, warn() {}, error() {} }

/**
 * @param {Object} params - Raw request query params
 * @param {string} [params.lat] - User latitude
 * @param {string} [params.lng] - User longitude
 * @param {string} [params.radius='50'] - Search radius (informational/debug only)
 * @param {string} [params.limit='200'] - Max results (capped at 500)
 * @param {string} [params.temperature] - Weather filter
 * @param {string} [params.precipitation] - Weather filter
 * @param {string} [params.wind] - Weather filter
 * @param {Object} deps
 * @param {(args: {lat, lng, limit}) => Promise<Array>} deps.runPOIQuery
 *        Returns raw POI rows. The adapter owns driver choice + schema fallback.
 * @param {(lat: number, lng: number) => Promise<Object>} deps.fetchWeather
 *        Returns weather fields ({temperature, condition, weather_description,
 *        precipitation, windSpeed, weather_source, weather_timestamp}).
 * @param {Object} [deps.logger] - Optional {info, debug, warn, error}
 * @returns {Promise<Object>} Response body { success, data, count, timestamp, debug }
 */
export async function getPOILocationsWithWeather(
  params,
  { runPOIQuery, fetchWeather, logger = noopLogger }
) {
  const {
    lat, lng, radius = '50', limit = '200',
    temperature, precipitation, wind,
  } = params
  const limitNum = Math.min(parseInt(limit) || 200, 500)

  // 1. Fetch POIs — adapter handles the driver + expanded/basic schema fallback
  const rows = await runPOIQuery({ lat, lng, limit: limitNum })

  // 2. Normalize rows to the canonical POI shape (single shared transform)
  const baseData = transformPOIResults(rows)

  // 3. Enrich each POI with weather (adapter injects the env-specific fetcher)
  logger.debug('Fetching weather data for POIs', { poiCount: baseData.length })
  const withWeather = await Promise.all(
    baseData.map(async (poi) => {
      const w = await fetchWeather(poi.lat, poi.lng)
      return {
        ...poi,
        temperature: w.temperature,
        condition: w.condition,
        weather_description: w.weather_description,
        precipitation: w.precipitation,
        windSpeed: w.windSpeed,
        weather_source: w.weather_source,
        weather_timestamp: w.weather_timestamp,
      }
    })
  )

  // 4. Apply weather-based filtering
  const data = applyWeatherFilters(withWeather, { temperature, precipitation, wind })
  logger.info('Weather filtering complete', {
    originalCount: withWeather.length,
    filteredCount: data.length,
    hasFilters: !!(temperature || precipitation || wind),
  })

  // 5. Standardized response
  return {
    success: true,
    data,
    count: data.length,
    timestamp: new Date().toISOString(),
    debug: {
      query_type: lat && lng ? 'proximity_with_weather' : 'all_pois_with_weather',
      user_location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      radius,
      limit: limitNum.toString(),
      data_source: 'poi_with_real_weather',
      weather_api: 'openweather',
    },
  }
}
