#!/usr/bin/env node

import { chromium } from 'playwright';

async function inspectMarkerDOM() {
  console.log('🔍 INSPECTING MARKER DOM STRUCTURE');
  console.log('=================================');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  try {
    console.log('🌐 Loading localhost...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for map and location to load
    await page.waitForTimeout(8000);

    console.log('🔍 Analyzing marker DOM structure...');

    const markerAnalysis = await page.evaluate(() => {
      const results = {
        totalMarkers: 0,
        markerDetails: [],
        leafletLayers: [],
        draggableElements: []
      };

      // Check all marker icons
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      results.totalMarkers = markers.length;

      markers.forEach((marker, index) => {
        const parent = marker.parentElement;
        const detail = {
          index,
          className: marker.className,
          src: marker.src ? marker.src.substring(0, 100) + '...' : 'none',
          parentClass: parent ? parent.className : 'none',
          isDraggable: parent ? parent.classList.contains('leaflet-marker-draggable') : false,
          style: {
            cursor: marker.style.cursor,
            transform: marker.style.transform
          }
        };
        results.markerDetails.push(detail);

        if (detail.isDraggable) {
          results.draggableElements.push(index);
        }
      });

      // Check if we can access Leaflet map and layers
      if (window.leafletMapInstance) {
        const map = window.leafletMapInstance;

        map.eachLayer((layer) => {
          if (layer.options) {
            results.leafletLayers.push({
              isUserMarker: layer.options.isUserMarker || false,
              draggable: layer.options.draggable || false,
              hasLatLng: !!layer.getLatLng,
              type: layer.constructor.name
            });
          }
        });
      }

      return results;
    });

    console.log('\n📊 MARKER DOM ANALYSIS:');
    console.log('======================');
    console.log(`Total markers: ${markerAnalysis.totalMarkers}`);
    console.log(`Draggable elements: ${markerAnalysis.draggableElements.length}`);
    console.log(`Leaflet layers: ${markerAnalysis.leafletLayers.length}`);

    console.log('\n🔍 MARKER DETAILS:');
    markerAnalysis.markerDetails.slice(0, 5).forEach(detail => {
      console.log(`Marker ${detail.index}:`);
      console.log(`  Class: ${detail.className}`);
      console.log(`  Parent: ${detail.parentClass}`);
      console.log(`  Draggable: ${detail.isDraggable}`);
      console.log(`  Cursor: ${detail.style.cursor || 'default'}`);
      console.log(`  Transform: ${detail.style.transform || 'none'}`);
      console.log('');
    });

    console.log('\n🗺️ LEAFLET LAYERS:');
    markerAnalysis.leafletLayers.forEach((layer, index) => {
      console.log(`Layer ${index}:`);
      console.log(`  Type: ${layer.type}`);
      console.log(`  User Marker: ${layer.isUserMarker}`);
      console.log(`  Draggable: ${layer.draggable}`);
      console.log(`  Has LatLng: ${layer.hasLatLng}`);
      console.log('');
    });

    if (markerAnalysis.draggableElements.length === 0) {
      console.log('❌ PROBLEM FOUND: No markers have leaflet-marker-draggable class!');
      console.log('This means Leaflet is not making any markers draggable in the DOM.');
    } else {
      console.log(`✅ Found ${markerAnalysis.draggableElements.length} draggable markers at indices: ${markerAnalysis.draggableElements.join(', ')}`);
    }

    const userMarkerLayers = markerAnalysis.leafletLayers.filter(l => l.isUserMarker);
    if (userMarkerLayers.length === 0) {
      console.log('❌ PROBLEM: No Leaflet layers marked as user markers found!');
    } else {
      console.log(`✅ Found ${userMarkerLayers.length} user marker layer(s)`);
      userMarkerLayers.forEach((layer, i) => {
        if (!layer.draggable) {
          console.log(`❌ PROBLEM: User marker layer ${i} is not marked as draggable!`);
        } else {
          console.log(`✅ User marker layer ${i} is correctly marked as draggable`);
        }
      });
    }

    // Take screenshot for visual inspection
    await page.screenshot({
      path: 'marker-dom-inspection.png',
      fullPage: true
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n🎯 DOM INSPECTION COMPLETE');
}

inspectMarkerDOM().catch(console.error);
