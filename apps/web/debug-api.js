#!/usr/bin/env node

// Simple script to test the API and simulate browser behavior
import https from 'https';
import http from 'http';

console.log('🔍 Debugging Weather API Integration');
console.log('==================================');

// Test 1: Direct API call
async function testDirectAPI() {
  console.log('\n📡 Testing Direct API Call...');
  
  try {
    const response = await fetch('http://localhost:4000/api/weather-locations?limit=5');
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Success:', data.success);
    console.log('✅ Data Count:', data.count);
    console.log('✅ Sample Location:', data.data[0]?.name);
    console.log('✅ Timestamp:', data.timestamp);
    
    return data;
  } catch (error) {
    console.error('❌ API Call Failed:', error.message);
    return null;
  }
}

// Test 2: Test with user location
async function testWithUserLocation() {
  console.log('\n🗺️ Testing API with User Location...');
  
  try {
    const params = new URLSearchParams({
      lat: '46.7296',
      lng: '-94.6859',
      radius: '50',
      limit: '10'
    });
    
    const response = await fetch(`http://localhost:4000/api/weather-locations?${params}`);
    const data = await response.json();
    
    console.log('✅ User Location Response Status:', response.status);
    console.log('✅ User Location Success:', data.success);
    console.log('✅ User Location Data Count:', data.count);
    console.log('✅ Debug Info:', data.debug?.query_type);
    
    return data;
  } catch (error) {
    console.error('❌ User Location API Call Failed:', error.message);
    return null;
  }
}

// Test 3: Test IP location service
async function testIPLocation() {
  console.log('\n🌐 Testing IP Location Service...');
  
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    console.log('✅ IP Location Response Status:', response.status);
    console.log('✅ IP Location:', data.latitude, data.longitude);
    console.log('✅ IP City:', data.city);
    console.log('✅ IP Region:', data.region);
    
    return data;
  } catch (error) {
    console.error('❌ IP Location Failed:', error.message);
    return null;
  }
}

// Test 4: Test CORS and headers
async function testCORS() {
  console.log('\n🔒 Testing CORS Headers...');
  
  try {
    const response = await fetch('http://localhost:4000/api/weather-locations?limit=1');
    
    console.log('✅ CORS Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('✅ CORS Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('✅ Content-Type:', response.headers.get('Content-Type'));
    
    return response;
  } catch (error) {
    console.error('❌ CORS Test Failed:', error.message);
    return null;
  }
}

// Test 5: Simulate browser environment
async function simulateBrowserEnvironment() {
  console.log('\n🌐 Simulating Browser Environment...');
  
  // Set up globals that might be missing
  global.navigator = {
    geolocation: {
      getCurrentPosition: (success, error) => {
        console.log('📍 Geolocation API called');
        error({ message: 'Geolocation not available in Node.js' });
      }
    }
  };
  
  console.log('✅ Browser globals set up');
  
  // Test the useWeatherLocations hook logic
  const options = {
    userLocation: null,
    radius: 50,
    limit: 40
  };
  
  const params = new URLSearchParams({
    limit: options.limit.toString()
  });
  
  if (options.userLocation) {
    params.append('lat', options.userLocation[0].toString());
    params.append('lng', options.userLocation[1].toString());
    params.append('radius', options.radius.toString());
  }
  
  const apiUrl = `http://localhost:4000/api/weather-locations?${params}`;
  console.log('🔗 API URL:', apiUrl);
  
  try {
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    console.log('✅ Hook Simulation Success:', result.success);
    console.log('✅ Hook Simulation Count:', result.count);
    
    return result;
  } catch (error) {
    console.error('❌ Hook Simulation Failed:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive API debug...\n');
  
  // Run all tests
  await testDirectAPI();
  await testWithUserLocation();
  await testIPLocation();
  await testCORS();
  await simulateBrowserEnvironment();
  
  console.log('\n🏁 Debug Complete');
  console.log('=================');
  console.log('If all tests pass, the issue is likely in the browser environment.');
  console.log('Check the browser console for:');
  console.log('- Network tab for failed requests');
  console.log('- Console tab for JavaScript errors');
  console.log('- Sources tab for breakpoints in useWeatherLocations.ts');
}

main().catch(console.error);