/**
 * ========================================================================
 * WEATHER FILTERING TYPES & CONSTANTS
 * ========================================================================
 *
 * Shared types and tuning constants for weather/geographic filtering. Split out
 * of weatherFilteringUtils.ts so the filtering logic ({@link ./weatherFilteringUtils})
 * and the geographic helpers ({@link ./geoUtils}) can both depend on these without
 * a circular import. weatherFilteringUtils re-exports everything here for callers.
 */

/** Earth's mean radius in miles, used by the Haversine distance calculation. */
export const EARTH_RADIUS_MILES = 3959;

/**
 * Percentile cut points that turn an absolute weather distribution into the
 * coarse cold/mild/hot, dry/light/heavy, calm/breezy/windy buckets the UI filters on.
 *
 * @remarks
 * These are intentionally relative (percentile-based), not absolute thresholds:
 * "mild" means the middle of whatever the current result set looks like, not a
 * fixed temperature. Changing these values directly changes how restrictive each
 * filter feels, so treat them as product-tuning knobs and adjust only on request.
 * @example
 * ```ts
 * // Coldest 40% of locations qualify as "cold"
 * const isCold = percentileRank <= WEATHER_PERCENTILES.COLD_THRESHOLD;
 * ```
 */
export const WEATHER_PERCENTILES = {
  // Temperature filtering percentiles
  COLD_THRESHOLD: 0.4,     // Coldest 40%
  HOT_THRESHOLD: 0.6,      // Hottest 40% (starting from 60th percentile)
  MILD_MIN: 0.1,          // Exclude extreme 10% cold
  MILD_MAX: 0.9,          // Exclude extreme 10% hot

  // Precipitation filtering percentiles
  DRY_THRESHOLD: 0.6,      // Driest 60%
  LIGHT_MIN: 0.2,         // Light rain range 20th-70th percentile
  LIGHT_MAX: 0.7,
  HEAVY_THRESHOLD: 0.7,    // Wettest 30%

  // Wind filtering percentiles
  CALM_THRESHOLD: 0.5,     // Calmest 50%
  BREEZY_MIN: 0.3,        // Breezy range 30th-70th percentile
  BREEZY_MAX: 0.7,
  WINDY_THRESHOLD: 0.7     // Windiest 30%
} as const;

/** A geographic point expressed as `[latitude, longitude]` in decimal degrees. */
export type Coordinates = [number, number]; // [latitude, longitude]

/** An outdoor recreation location with the weather fields needed for filtering and sorting. */
export interface Location {
  /** Stable unique identifier for the POI. */
  id: string;
  /** Human-readable POI name (e.g. "Gooseberry Falls State Park"). */
  name: string;
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
  /** Temperature in degrees Fahrenheit. */
  temperature: number;
  /** Precipitation probability as a 0–100 percentage. */
  precipitation: number;
  /** Wind speed in miles per hour. */
  windSpeed: number;
  /** Short condition label (e.g. "Clear", "Overcast"). */
  condition: string;
  /** Longer human-readable weather description. */
  description: string;
}

/**
 * The user's selected weather preferences, one coarse bucket per axis.
 * An empty string means "no preference" and is treated as a pass-through (no filtering on that axis).
 */
export interface WeatherFilters {
  /** Temperature bucket, or `''` for no temperature constraint. */
  temperature?: 'cold' | 'mild' | 'hot' | '';
  /** Precipitation bucket, or `''` for no precipitation constraint. */
  precipitation?: 'none' | 'light' | 'heavy' | '';
  /** Wind bucket, or `''` for no wind constraint. */
  wind?: 'calm' | 'breezy' | 'windy' | '';
}

/** Map of filter-option key → number of locations that would match it, used for UI badge counts. */
export interface FilterCounts {
  [key: string]: number;
}

/** Absolute temperature cut points (°F) derived from the current dataset via {@link WEATHER_PERCENTILES}. */
export interface WeatherThresholds {
  /** Upper bound for the "cold" bucket. */
  cold: number;
  /** Lower bound for the "hot" bucket. */
  hot: number;
  /** Lower bound of the "mild" band. */
  mildMin: number;
  /** Upper bound of the "mild" band. */
  mildMax: number;
}

/** Absolute precipitation cut points (% chance) derived from the current dataset. */
export interface PrecipitationThresholds {
  /** Upper bound for the "dry"/none bucket. */
  dry: number;
  /** Lower bound of the "light" precipitation band. */
  lightMin: number;
  /** Upper bound of the "light" precipitation band. */
  lightMax: number;
  /** Lower bound for the "heavy" precipitation bucket. */
  heavy: number;
}

/** Absolute wind cut points (mph) derived from the current dataset. */
export interface WindThresholds {
  /** Upper bound for the "calm" bucket. */
  calm: number;
  /** Lower bound of the "breezy" band. */
  breezyMin: number;
  /** Upper bound of the "breezy" band. */
  breezyMax: number;
  /** Lower bound for the "windy" bucket. */
  windy: number;
}
