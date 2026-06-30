/**
 * ========================================================================
 * MAP TYPES
 * ========================================================================
 *
 * Shared types for the MapContainer component and its extracted hooks
 * (useLeafletMap, usePoiMarkers, useUserLocationMarker, useMapPopupNavigation).
 * Lives in its own module so the hooks and the component can both import
 * POILocation without a circular dependency.
 */

/** A weather-enriched outdoor-recreation POI as rendered on the Leaflet map. */
export interface POILocation {
  /** Stable unique identifier for the POI. */
  id: string;
  /** Human-readable POI name. */
  name: string;
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
  /** Temperature in degrees Fahrenheit. */
  temperature: number;
  /** Short condition label (e.g. "Clear"). */
  condition: string;
  /** Longer human-readable weather description. */
  description: string;
  /** Precipitation probability as a 0–100 percentage. */
  precipitation: number;
  /** Wind speed, formatted for display (e.g. "8 mph"). */
  windSpeed: string;
  /** Distance from the user in miles, when known. */
  distance?: number;
  /** Park classification (e.g. "State Park"). */
  park_type?: string;
  /** Name of the weather station the conditions came from. */
  weather_station_name?: string;
  /** Distance to that weather station, formatted for display. */
  weather_distance_miles?: string;
}
