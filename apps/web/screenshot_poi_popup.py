#!/usr/bin/env python3
"""
Simple screenshot script for POI popup inspection
Uses selenium with Firefox headless mode
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def take_poi_popup_screenshot():
    # Set up Firefox options
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--width=1200")
    options.add_argument("--height=800")
    
    try:
        # Initialize the driver
        driver = webdriver.Firefox(options=options)
        
        # Navigate to localhost:3001
        print("Navigating to localhost:3001...")
        driver.get("http://localhost:3001")
        
        # Wait for the page to load
        print("Waiting for page to load...")
        time.sleep(5)
        
        # Wait for map to be present
        print("Waiting for map container...")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "map"))
        )
        
        # Additional wait for map tiles to load
        time.sleep(3)
        
        # Look for POI markers (these might be canvas elements or specific classes)
        print("Looking for POI markers...")
        
        # Try to find and click a marker
        # This is tricky with Leaflet maps, let's try multiple approaches
        
        # Approach 1: Look for marker elements
        markers = driver.find_elements(By.CSS_SELECTOR, ".leaflet-marker-icon")
        
        if markers:
            print(f"Found {len(markers)} markers, clicking the first one...")
            driver.execute_script("arguments[0].click();", markers[0])
            time.sleep(2)
        else:
            print("No markers found with .leaflet-marker-icon, trying other selectors...")
            
            # Approach 2: Try different marker selectors
            alternative_selectors = [
                ".marker",
                "[class*='marker']",
                ".leaflet-interactive",
                ".leaflet-clickable"
            ]
            
            for selector in alternative_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"Found {len(elements)} elements with {selector}, clicking first...")
                    driver.execute_script("arguments[0].click();", elements[0])
                    time.sleep(2)
                    break
            else:
                # Approach 3: Click somewhere on the map where POIs might be
                print("Trying to click in the center of the map...")
                map_element = driver.find_element(By.ID, "map")
                driver.execute_script("""
                    const map = arguments[0];
                    const rect = map.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: centerX,
                        clientY: centerY
                    });
                    map.dispatchEvent(event);
                """, map_element)
                time.sleep(2)
        
        # Take screenshot
        timestamp = int(time.time())
        screenshot_path = f"/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/screenshots/poi_popup_{timestamp}.png"
        
        print(f"Taking screenshot: {screenshot_path}")
        driver.save_screenshot(screenshot_path)
        
        # Also save HTML for debugging
        html_path = f"/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/screenshots/poi_popup_{timestamp}.html"
        with open(html_path, 'w') as f:
            f.write(driver.page_source)
        
        print("Screenshot and HTML saved successfully!")
        print(f"Screenshot: {screenshot_path}")
        print(f"HTML: {html_path}")
        
        return screenshot_path
        
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    take_poi_popup_screenshot()