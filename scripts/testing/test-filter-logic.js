#!/usr/bin/env node

// Test the weather filtering logic directly

function applyWeatherFilters(locations, filters) {
  if (!locations || locations.length === 0) return []

  let filtered = [...locations]
  const startCount = filtered.length
  console.log(`\n🔍 Starting with ${startCount} locations`)
  console.log(`📊 Filters:`, filters)

  // Temperature filtering
  if (filters.temperature && filters.temperature !== '') {
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
    const tempCount = temps.length
    console.log(`🌡️ Temperature range: ${temps[0]}°F - ${temps[temps.length-1]}°F`)

    if (filters.temperature === 'cold') {
      const threshold = temps[Math.floor(tempCount * 0.4)]
      filtered = filtered.filter(loc => loc.temperature <= threshold)
      console.log(`❄️ Cold filter: temps ≤ ${threshold}°F`)
    } else if (filters.temperature === 'hot') {
      const threshold = temps[Math.floor(tempCount * 0.6)]
      filtered = filtered.filter(loc => loc.temperature >= threshold)
      console.log(`🔥 Hot filter: temps ≥ ${threshold}°F`)
    } else if (filters.temperature === 'mild') {
      const minThreshold = temps[Math.floor(tempCount * 0.1)]
      const maxThreshold = temps[Math.floor(tempCount * 0.9)]
      filtered = filtered.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold)
      console.log(`🌤️ Mild filter: temps ${minThreshold}°F - ${maxThreshold}°F`)
    }
  }

  console.log(`🎯 Weather filtering: ${startCount} → ${filtered.length} POIs`)
  return filtered
}

// Test data that simulates what the API would have
const testData = [
  { id: 1, name: "Cold Place", temperature: 50, precipitation: 10, windSpeed: 3 },
  { id: 2, name: "Cool Place", temperature: 60, precipitation: 15, windSpeed: 5 },
  { id: 3, name: "Mild Place", temperature: 70, precipitation: 20, windSpeed: 8 },
  { id: 4, name: "Warm Place", temperature: 80, precipitation: 25, windSpeed: 12 },
  { id: 5, name: "Hot Place", temperature: 90, precipitation: 5, windSpeed: 15 }
]

console.log('🧪 Testing weather filtering logic directly')

// Test cold filter
console.log('\n❄️ Testing COLD filter:')
const coldResult = applyWeatherFilters(testData, { temperature: 'cold' })
console.log(`Cold results: ${coldResult.map(p => `${p.name} (${p.temperature}°F)`).join(', ')}`)

// Test hot filter
console.log('\n🔥 Testing HOT filter:')
const hotResult = applyWeatherFilters(testData, { temperature: 'hot' })
console.log(`Hot results: ${hotResult.map(p => `${p.name} (${p.temperature}°F)`).join(', ')}`)

// Test mild filter
console.log('\n🌤️ Testing MILD filter:')
const mildResult = applyWeatherFilters(testData, { temperature: 'mild' })
console.log(`Mild results: ${mildResult.map(p => `${p.name} (${p.temperature}°F)`).join(', ')}`)

// Test with no filters
console.log('\n🔄 Testing NO filters:')
const noFilterResult = applyWeatherFilters(testData, {})
console.log(`No filter results: ${noFilterResult.map(p => `${p.name} (${p.temperature}°F)`).join(', ')}`)

console.log('\n✅ Filter logic test complete!')
