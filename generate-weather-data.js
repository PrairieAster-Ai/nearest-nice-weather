#!/usr/bin/env node

/**
 * Generate 2000 realistic weather data points for Minnesota
 * Ensures 10+ results for each of 18 filter combinations:
 * - Temperature: cold, mild, hot (3 options)
 * - Precipitation: none, light, heavy (3 options)  
 * - Wind: calm, breezy, windy (3 options)
 * = 3 × 3 × 3 = 27 combinations (but we'll use 18 realistic ones)
 */

const fs = require('fs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/weather_intelligence',
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// Minnesota cities and towns (realistic locations)
const minnesotaLocations = [
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650 },
  { name: 'Saint Paul', lat: 44.9537, lng: -93.0900 },
  { name: 'Rochester', lat: 44.0121, lng: -92.4802 },
  { name: 'Duluth', lat: 46.7867, lng: -92.1005 },
  { name: 'Bloomington', lat: 44.8408, lng: -93.2983 },
  { name: 'Brooklyn Park', lat: 45.0941, lng: -93.3563 },
  { name: 'Plymouth', lat: 45.0105, lng: -93.4555 },
  { name: 'Saint Cloud', lat: 45.5608, lng: -94.1622 },
  { name: 'Eagan', lat: 44.8041, lng: -93.1668 },
  { name: 'Woodbury', lat: 44.9239, lng: -92.9594 },
  { name: 'Maple Grove', lat: 45.0725, lng: -93.4558 },
  { name: 'Eden Prairie', lat: 44.8547, lng: -93.4708 },
  { name: 'Coon Rapids', lat: 45.1200, lng: -93.3030 },
  { name: 'Burnsville', lat: 44.7678, lng: -93.2777 },
  { name: 'Blaine', lat: 45.1607, lng: -93.2349 },
  { name: 'Lakeville', lat: 44.6497, lng: -93.2427 },
  { name: 'Minnetonka', lat: 44.9211, lng: -93.4687 },
  { name: 'Apple Valley', lat: 44.7319, lng: -93.2177 },
  { name: 'Edina', lat: 44.8897, lng: -93.3499 },
  { name: 'St. Louis Park', lat: 44.9486, lng: -93.3483 },
  { name: 'Mankato', lat: 44.1636, lng: -93.9994 },
  { name: 'Maplewood', lat: 44.9530, lng: -92.9952 },
  { name: 'Cottage Grove', lat: 44.8278, lng: -92.9438 },
  { name: 'Richfield', lat: 44.8833, lng: -93.2833 },
  { name: 'Roseville', lat: 45.0061, lng: -93.1566 },
  { name: 'Inver Grove Heights', lat: 44.8516, lng: -93.0391 },
  { name: 'Andover', lat: 45.2333, lng: -93.2911 },
  { name: 'Savage', lat: 44.7764, lng: -93.3363 },
  { name: 'Fridley', lat: 45.0864, lng: -93.2633 },
  { name: 'Oakdale', lat: 44.9633, lng: -92.9652 },
  { name: 'Minnehaha Park', lat: 44.9153, lng: -93.2103 },
  { name: 'Como Park', lat: 44.9619, lng: -93.1506 },
  { name: 'Highland Park', lat: 44.9267, lng: -93.1816 },
  { name: 'Macalester', lat: 44.9378, lng: -93.1691 },
  { name: 'University of Minnesota', lat: 44.9727, lng: -93.2354 },
  { name: 'Fort Snelling', lat: 44.8958, lng: -93.1816 },
  { name: 'Stillwater', lat: 45.0566, lng: -92.8066 },
  { name: 'White Bear Lake', lat: 45.0847, lng: -93.0099 },
  { name: 'Hastings', lat: 44.7436, lng: -92.8521 },
  { name: 'Faribault', lat: 44.2950, lng: -93.2688 },
  { name: 'Northfield', lat: 44.4583, lng: -93.1616 },
  { name: 'Owatonna', lat: 44.0839, lng: -93.2260 },
  { name: 'Austin', lat: 43.6661, lng: -92.9748 },
  { name: 'Winona', lat: 44.0498, lng: -91.6407 },
  { name: 'Albert Lea', lat: 43.6483, lng: -93.3683 },
  { name: 'Moorhead', lat: 46.8739, lng: -96.7667 },
  { name: 'Fergus Falls', lat: 46.2830, lng: -96.0776 },
  { name: 'Willmar', lat: 45.1219, lng: -95.0434 },
  { name: 'Crookston', lat: 47.7741, lng: -96.6081 },
  { name: 'Thief River Falls', lat: 48.1169, lng: -96.1756 },
  { name: 'Brainerd', lat: 46.3580, lng: -94.2008 },
  { name: 'Grand Rapids', lat: 47.2378, lng: -93.5308 },
  { name: 'Hibbing', lat: 47.4272, lng: -92.9377 },
  { name: 'Virginia', lat: 47.5235, lng: -92.5360 },
  { name: 'International Falls', lat: 48.6014, lng: -93.4083 },
  { name: 'Ely', lat: 47.9044, lng: -91.8668 },
  { name: 'Two Harbors', lat: 47.0226, lng: -91.6718 },
  { name: 'Cloquet', lat: 46.7211, lng: -92.4594 },
  { name: 'Bemidji', lat: 47.4734, lng: -94.8803 },
  { name: 'Detroit Lakes', lat: 46.8172, lng: -95.8453 },
  { name: 'Alexandria', lat: 45.8850, lng: -95.3772 },
  { name: 'Morris', lat: 45.5866, lng: -95.9142 },
  { name: 'Marshall', lat: 44.4469, lng: -95.7880 },
  { name: 'Redwood Falls', lat: 44.5403, lng: -95.1169 },
  { name: 'New Ulm', lat: 44.3133, lng: -94.4608 },
  { name: 'Hutchinson', lat: 44.8869, lng: -94.3708 },
  { name: 'Litchfield', lat: 45.1294, lng: -94.5281 },
  { name: 'Montevideo', lat: 44.9269, lng: -95.7142 },
  { name: 'Benson', lat: 45.3169, lng: -95.6006 },
  { name: 'Glenwood', lat: 45.6494, lng: -95.3881 },
  { name: 'Sauk Centre', lat: 45.7372, lng: -94.9531 },
  { name: 'Little Falls', lat: 45.9761, lng: -94.3622 },
  { name: 'Baxter', lat: 46.3500, lng: -94.2669 },
  { name: 'Crosslake', lat: 46.6605, lng: -94.1072 },
  { name: 'Nisswa', lat: 46.5155, lng: -94.2886 },
  { name: 'Park Rapids', lat: 46.9253, lng: -95.0586 },
  { name: 'Walker', lat: 47.0983, lng: -94.5847 },
  { name: 'Aitkin', lat: 46.5331, lng: -93.7069 },
  { name: 'Pine City', lat: 45.8269, lng: -92.9713 },
  { name: 'Hinckley', lat: 46.0133, lng: -92.9866 },
  { name: 'Sandstone', lat: 46.1283, lng: -92.8630 },
  { name: 'Moose Lake', lat: 46.4572, lng: -92.7594 },
  { name: 'Carlton', lat: 46.6589, lng: -92.4222 },
  { name: 'Proctor', lat: 46.7489, lng: -92.2222 },
  { name: 'Hermantown', lat: 46.8111, lng: -92.2372 },
  { name: 'Silver Bay', lat: 47.2983, lng: -91.2529 },
  { name: 'Grand Marais', lat: 47.7506, lng: -90.3432 },
  { name: 'Cook', lat: 47.8506, lng: -92.6896 },
  { name: 'Orr', lat: 48.0881, lng: -92.8385 },
  { name: 'Tower', lat: 47.8081, lng: -92.2838 },
  { name: 'Babbitt', lat: 47.7069, lng: -91.9504 },
  { name: 'Chisholm', lat: 47.4897, lng: -92.8838 },
  { name: 'Keewatin', lat: 47.3961, lng: -93.0730 },
  { name: 'Bovey', lat: 47.2944, lng: -93.4116 },
  { name: 'Cohasset', lat: 47.2672, lng: -93.6239 },
  { name: 'Deer River', lat: 47.3319, lng: -93.7755 },
  { name: 'Remer', lat: 47.1361, lng: -93.9133 },
  { name: 'Longville', lat: 46.9708, lng: -94.2272 },
  { name: 'Hackensack', lat: 46.9147, lng: -94.4597 },
  { name: 'Backus', lat: 46.8069, lng: -94.5172 },
  { name: 'Pine River', lat: 46.7069, lng: -94.3947 },
  { name: 'Pequot Lakes', lat: 46.6011, lng: -94.3069 },
  { name: 'Crosby', lat: 46.4792, lng: -93.9580 },
  { name: 'Ironton', lat: 46.4561, lng: -94.0197 },
  { name: 'Deerwood', lat: 46.4700, lng: -93.9014 },
  { name: 'Outing', lat: 46.7953, lng: -93.8547 },
  { name: 'Emily', lat: 46.7236, lng: -93.9422 },
  { name: 'Fifty Lakes', lat: 46.6269, lng: -94.0347 }
];

// Weather conditions that create realistic distributions
const weatherConditions = [
  'Sunny', 'Clear', 'Partly Cloudy', 'Cloudy', 'Overcast', 
  'Light Rain', 'Rain', 'Heavy Rain', 'Drizzle', 'Showers',
  'Snow', 'Light Snow', 'Heavy Snow', 'Sleet', 'Freezing Rain',
  'Thunderstorms', 'Hail', 'Fog', 'Mist', 'Windy'
];

// Generate realistic weather data that ensures proper filter distribution
function generateWeatherData() {
  const locations = [];
  const targetPerCombination = Math.ceil(2000 / 18); // ~111 per combination
  
  // 18 realistic filter combinations for Minnesota weather
  const filterCombinations = [
    { temp: 'cold', precip: 'none', wind: 'calm' },
    { temp: 'cold', precip: 'none', wind: 'breezy' },
    { temp: 'cold', precip: 'light', wind: 'calm' },
    { temp: 'cold', precip: 'light', wind: 'breezy' },
    { temp: 'cold', precip: 'heavy', wind: 'windy' },
    { temp: 'mild', precip: 'none', wind: 'calm' },
    { temp: 'mild', precip: 'none', wind: 'breezy' },
    { temp: 'mild', precip: 'light', wind: 'calm' },
    { temp: 'mild', precip: 'light', wind: 'breezy' },
    { temp: 'mild', precip: 'light', wind: 'windy' },
    { temp: 'mild', precip: 'heavy', wind: 'windy' },
    { temp: 'hot', precip: 'none', wind: 'calm' },
    { temp: 'hot', precip: 'none', wind: 'breezy' },
    { temp: 'hot', precip: 'light', wind: 'calm' },
    { temp: 'hot', precip: 'light', wind: 'breezy' },
    { temp: 'hot', precip: 'heavy', wind: 'breezy' },
    { temp: 'hot', precip: 'heavy', wind: 'windy' },
    { temp: 'cold', precip: 'none', wind: 'windy' }
  ];

  let locationId = 1;
  
  // Generate data for each filter combination
  filterCombinations.forEach(combo => {
    for (let i = 0; i < targetPerCombination; i++) {
      const baseLocation = minnesotaLocations[Math.floor(Math.random() * minnesotaLocations.length)];
      
      // Add small random variations to coordinates for realistic spread
      const lat = baseLocation.lat + (Math.random() - 0.5) * 0.1; // ~5 mile radius
      const lng = baseLocation.lng + (Math.random() - 0.5) * 0.1;
      
      // Generate weather values that match the filter combination
      const temperature = getTemperatureForFilter(combo.temp);
      const precipitation = getPrecipitationForFilter(combo.precip);
      const windSpeed = getWindSpeedForFilter(combo.wind);
      
      const condition = getRealisticCondition(temperature, precipitation, windSpeed);
      const description = getRealisticDescription(baseLocation.name, condition);
      
      locations.push({
        id: `loc_${locationId.toString().padStart(4, '0')}`,
        name: `${baseLocation.name} ${i + 1}`,
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        temperature: Math.round(temperature),
        condition: condition,
        description: description,
        precipitation: Math.round(precipitation),
        windSpeed: Math.round(windSpeed * 10) / 10
      });
      
      locationId++;
    }
  });
  
  return locations;
}

// Helper functions to generate realistic weather values
function getTemperatureForFilter(tempFilter) {
  switch(tempFilter) {
    case 'cold': return Math.random() * 30 + 10; // 10-40°F
    case 'mild': return Math.random() * 30 + 50; // 50-80°F  
    case 'hot': return Math.random() * 20 + 80; // 80-100°F
    default: return 60;
  }
}

function getPrecipitationForFilter(precipFilter) {
  switch(precipFilter) {
    case 'none': return Math.random() * 10; // 0-10%
    case 'light': return Math.random() * 40 + 20; // 20-60%
    case 'heavy': return Math.random() * 40 + 60; // 60-100%
    default: return 30;
  }
}

function getWindSpeedForFilter(windFilter) {
  switch(windFilter) {
    case 'calm': return Math.random() * 5; // 0-5 mph
    case 'breezy': return Math.random() * 10 + 5; // 5-15 mph
    case 'windy': return Math.random() * 15 + 15; // 15-30 mph
    default: return 8;
  }
}

function getRealisticCondition(temp, precip, wind) {
  if (precip > 70) return temp < 32 ? 'Heavy Snow' : 'Heavy Rain';
  if (precip > 40) return temp < 32 ? 'Light Snow' : 'Light Rain';
  if (precip > 20) return 'Partly Cloudy';
  if (wind > 20) return 'Windy';
  if (temp > 85) return 'Sunny';
  if (temp < 20) return 'Clear';
  return 'Partly Cloudy';
}

function getRealisticDescription(baseName, condition) {
  const descriptors = [
    'Near downtown', 'Residential area', 'By the lake', 'City center',
    'Suburban neighborhood', 'Historic district', 'Near park', 'Shopping district',
    'Industrial area', 'Waterfront', 'Hilltop', 'Valley location'
  ];
  
  return `${baseName} - ${descriptors[Math.floor(Math.random() * descriptors.length)]}`;
}

// Database insertion function
async function insertWeatherData(locations) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat DECIMAL(10, 6) NOT NULL,
        lng DECIMAL(10, 6) NOT NULL,
        temperature INTEGER NOT NULL,
        condition TEXT NOT NULL,
        description TEXT NOT NULL,
        precipitation INTEGER NOT NULL,
        wind_speed DECIMAL(4, 1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Clear existing data
    await client.query('DELETE FROM weather_locations');
    
    // Insert new data in batches
    console.log(`Inserting ${locations.length} weather locations...`);
    
    for (let i = 0; i < locations.length; i += 100) {
      const batch = locations.slice(i, i + 100);
      const values = batch.map(loc => 
        `('${loc.id}', '${loc.name}', ${loc.lat}, ${loc.lng}, ${loc.temperature}, '${loc.condition}', '${loc.description}', ${loc.precipitation}, ${loc.windSpeed})`
      ).join(',');
      
      await client.query(`
        INSERT INTO weather_locations (id, name, lat, lng, temperature, condition, description, precipitation, wind_speed)
        VALUES ${values}
      `);
      
      console.log(`Inserted ${i + batch.length} locations...`);
    }
    
    await client.query('COMMIT');
    console.log('✅ Successfully inserted all weather data!');
    
    // Verify the data
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN temperature < 40 THEN 1 END) as cold,
        COUNT(CASE WHEN temperature BETWEEN 40 AND 79 THEN 1 END) as mild,
        COUNT(CASE WHEN temperature >= 80 THEN 1 END) as hot,
        COUNT(CASE WHEN precipitation < 20 THEN 1 END) as dry,
        COUNT(CASE WHEN precipitation BETWEEN 20 AND 59 THEN 1 END) as light_precip,
        COUNT(CASE WHEN precipitation >= 60 THEN 1 END) as heavy_precip
      FROM weather_locations
    `);
    
    console.log('\n📊 Data Distribution:');
    console.log(`Total locations: ${result.rows[0].total}`);
    console.log(`Cold weather: ${result.rows[0].cold}`);
    console.log(`Mild weather: ${result.rows[0].mild}`);
    console.log(`Hot weather: ${result.rows[0].hot}`);
    console.log(`Dry conditions: ${result.rows[0].dry}`);
    console.log(`Light precipitation: ${result.rows[0].light_precip}`);
    console.log(`Heavy precipitation: ${result.rows[0].heavy_precip}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    console.log('🌤️ Generating 2000 realistic Minnesota weather data points...');
    
    const weatherData = generateWeatherData();
    
    console.log(`Generated ${weatherData.length} locations`);
    console.log('Sample data:');
    console.log(weatherData.slice(0, 3));
    
    await insertWeatherData(weatherData);
    
    console.log('\n✅ Weather data generation complete!');
    console.log('🔍 Now test the application with comprehensive filter combinations.');
    
  } catch (error) {
    console.error('❌ Error generating weather data:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateWeatherData, insertWeatherData };