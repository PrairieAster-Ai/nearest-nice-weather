#!/usr/bin/env node

import { chromium } from 'playwright';

async function debugDragInterference() {
  console.log('🔍 DEBUGGING DRAG INTERFERENCE');
  console.log('==============================');

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

    console.log('🔍 Checking drag interference on user marker...');

    const dragDiagnostic = await page.evaluate(() => {
      // Find the user marker element (has leaflet-marker-draggable class)
      const userMarkerEl = document.querySelector('.leaflet-marker-draggable');

      if (!userMarkerEl) {
        return { error: 'No element with leaflet-marker-draggable class found' };
      }

      console.log('🎯 Found draggable marker element');

      const diagnostic = {
        element: {
          tagName: userMarkerEl.tagName,
          className: userMarkerEl.className,
          id: userMarkerEl.id
        },
        computedStyle: {},
        eventListeners: {},
        parent: {
          tagName: userMarkerEl.parentElement?.tagName,
          className: userMarkerEl.parentElement?.className
        }
      };

      // Check computed CSS that might interfere with dragging
      const style = window.getComputedStyle(userMarkerEl);
      diagnostic.computedStyle = {
        pointerEvents: style.pointerEvents,
        userSelect: style.userSelect,
        touchAction: style.touchAction,
        cursor: style.cursor,
        position: style.position,
        zIndex: style.zIndex,
        transform: style.transform
      };

      // Check if Leaflet has attached drag event listeners
      // We can't directly inspect event listeners, but we can test if they respond
      console.log('🎯 Testing drag event response...');

      let dragEventsResponded = false;

      // Add a temporary event listener to see if drag events are firing
      const testListener = (e) => {
        console.log('🎯 Drag event detected:', e.type);
        dragEventsResponded = true;
      };

      userMarkerEl.addEventListener('mousedown', testListener);
      userMarkerEl.addEventListener('dragstart', testListener);

      // Simulate mousedown
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        button: 0,
        buttons: 1
      });

      console.log('🎯 Dispatching test mousedown event...');
      userMarkerEl.dispatchEvent(mouseDownEvent);

      // Clean up listeners
      userMarkerEl.removeEventListener('mousedown', testListener);
      userMarkerEl.removeEventListener('dragstart', testListener);

      diagnostic.dragEventsResponded = dragEventsResponded;

      // Check if Leaflet marker has the drag handler
      // Access the Leaflet layer object through the map
      if (window.leafletMapInstance) {
        const map = window.leafletMapInstance;

        map.eachLayer((layer) => {
          if (layer.options && layer.options.isUserMarker) {
            diagnostic.leafletLayer = {
              draggable: layer.options.draggable,
              hasDragHandler: !!layer.dragging,
              dragEnabled: layer.dragging ? layer.dragging.enabled() : false
            };

            console.log('🎯 User marker Leaflet layer found:', {
              draggable: layer.options.draggable,
              hasDragHandler: !!layer.dragging,
              dragEnabled: layer.dragging ? layer.dragging.enabled() : false
            });
          }
        });
      }

      return diagnostic;
    });

    console.log('\n📊 DRAG DIAGNOSTIC RESULTS:');
    console.log('===========================');

    if (dragDiagnostic.error) {
      console.log('❌ Error:', dragDiagnostic.error);
      return;
    }

    console.log('\n🎯 Element Info:');
    console.log(`  Tag: ${dragDiagnostic.element.tagName}`);
    console.log(`  Class: ${dragDiagnostic.element.className}`);
    console.log(`  ID: ${dragDiagnostic.element.id || 'none'}`);

    console.log('\n🎨 CSS Properties:');
    Object.entries(dragDiagnostic.computedStyle).forEach(([prop, value]) => {
      const problematic =
        (prop === 'pointerEvents' && value === 'none') ||
        (prop === 'userSelect' && value === 'none') ||
        (prop === 'touchAction' && value === 'none');

      const indicator = problematic ? '❌' : '✅';
      console.log(`  ${indicator} ${prop}: ${value}`);
    });

    console.log('\n🎯 Event Response:');
    console.log(`  Events responded: ${dragDiagnostic.dragEventsResponded ? '✅ Yes' : '❌ No'}`);

    if (dragDiagnostic.leafletLayer) {
      console.log('\n🗺️ Leaflet Layer:');
      console.log(`  ✅ Draggable: ${dragDiagnostic.leafletLayer.draggable}`);
      console.log(`  ${dragDiagnostic.leafletLayer.hasDragHandler ? '✅' : '❌'} Has drag handler: ${dragDiagnostic.leafletLayer.hasDragHandler}`);
      console.log(`  ${dragDiagnostic.leafletLayer.dragEnabled ? '✅' : '❌'} Drag enabled: ${dragDiagnostic.leafletLayer.dragEnabled}`);

      if (!dragDiagnostic.leafletLayer.hasDragHandler) {
        console.log('❌ PROBLEM: Leaflet marker has no drag handler!');
      } else if (!dragDiagnostic.leafletLayer.dragEnabled) {
        console.log('❌ PROBLEM: Leaflet drag handler is disabled!');
      }
    }

    // Take screenshot
    await page.screenshot({
      path: 'drag-interference-debug.png',
      fullPage: true
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n🎯 DRAG INTERFERENCE DEBUG COMPLETE');
}

debugDragInterference().catch(console.error);
