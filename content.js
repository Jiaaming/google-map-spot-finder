let map;
let selectedCenter = null;
let radiusCircle = null;
let centerMarker = null;

function initSpotFinder() {
  console.log('SpotFinder: Initializing on', window.location.href);
  
  // Always try to setup controls, don't wait for Google Maps API
  waitForMap();
}

function waitForMap() {
  const mapContainer = document.querySelector('#map') || 
                      document.querySelector('[data-map]') ||
                      document.querySelector('.widget-scene-canvas') ||
                      document.querySelector('.scene-canvas') ||
                      document.querySelector('canvas[data-tile-size]');
  
  if (mapContainer || document.querySelector('.searchboxinput')) {
    console.log('SpotFinder: Map detected, setting up controls');
    setupMapInteraction();
  } else {
    setTimeout(waitForMap, 2000);
  }
}

function setupMapInteraction() {
  const style = document.createElement('style');
  style.textContent = `
    .spotfinder-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 1000;
      font-family: Arial, sans-serif;
    }
    .spotfinder-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 2px;
    }
    .spotfinder-btn:hover {
      background: #1565c0;
    }
    .spotfinder-btn:disabled {
      background: #ccc !important;
      color: rgba(255, 255, 255, 0.5) !important;
      cursor: not-allowed !important;
      opacity: 0.6 !important;
    }
    .spotfinder-btn:not(:disabled) {
      background: #1976d2 !important;
      color: white !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.className = 'spotfinder-controls';
  controls.innerHTML = `
    <div style="margin-bottom: 5px;">
      <strong>🎯 SpotFinder</strong>
    </div>
    <div style="margin-bottom: 8px;">
      <input type="password" id="spotfinder-api-key" placeholder="Google Places API Key" style="width: 200px; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 3px;">
      <button id="spotfinder-save-key" class="spotfinder-btn" style="padding: 4px 8px; font-size: 12px;">Save</button>
    </div>
    <div style="margin-bottom: 8px;">
      <strong>Place Types:</strong><br>
      <label style="margin-right: 10px; font-size: 12px;">
        <input type="checkbox" id="filter-restaurant" checked> Restaurants
      </label>
      <label style="margin-right: 10px; font-size: 12px;">
        <input type="checkbox" id="filter-hotel" checked> Hotels
      </label>
      <label style="font-size: 12px;">
        <input type="checkbox" id="filter-attractions" checked> Attractions
      </label>
    </div>
    <div>
      <button id="spotfinder-use-center" class="spotfinder-btn">Use Map Center</button>
      <input type="number" id="spotfinder-radius" placeholder="Radius (m)" min="100" max="50000" value="1000" style="width: 80px; margin: 0 5px;">
      <button id="spotfinder-search" class="spotfinder-btn" disabled>Search Places</button>
      <button id="spotfinder-clear" class="spotfinder-btn">Clear</button>
    </div>
    <div id="spotfinder-status" style="font-size: 12px; margin-top: 5px; color: #666;">Enter API key and click Use Map Center to start.</div>
  `;
  
  document.body.appendChild(controls);

  document.getElementById('spotfinder-use-center').addEventListener('click', useMapCenter);
  document.getElementById('spotfinder-search').addEventListener('click', searchPlaces);
  document.getElementById('spotfinder-clear').addEventListener('click', clearSelection);
  document.getElementById('spotfinder-save-key').addEventListener('click', saveApiKey);

  setupRadiusUpdater();
  loadSavedApiKey();
}


let currentMapBounds = null;

function useMapCenter() {
  console.log('SpotFinder: Using map center from URL');
  
  const statusEl = document.getElementById('spotfinder-status');
  
  // Extract coordinates and zoom from current Google Maps URL
  const mapData = extractMapDataFromUrl();
  
  if (!mapData) {
    statusEl.textContent = 'Could not detect map location. Try navigating on the map first.';
    return;
  }
  
  selectedCenter = {
    lat: mapData.lat,
    lng: mapData.lng
  };
  
  // Store zoom level for radius calculation
  currentMapBounds = {
    zoom: mapData.zoom,
    lat: mapData.lat,
    lng: mapData.lng
  };
  
  console.log('SpotFinder: Map center extracted:', selectedCenter, 'zoom:', mapData.zoom);
  
  showCenterAndRadius();
  
  // Enable search button
  const searchBtn = document.getElementById('spotfinder-search');
  if (searchBtn) {
    searchBtn.disabled = false;
    searchBtn.style.opacity = '1';
    searchBtn.style.cursor = 'pointer';
    searchBtn.style.backgroundColor = '#1976d2';
    console.log('SpotFinder: Search button enabled');
  }
  
  statusEl.textContent = `Using center: ${selectedCenter.lat.toFixed(6)}, ${selectedCenter.lng.toFixed(6)} - Ready to search!`;
}

function extractMapDataFromUrl() {
  const url = window.location.href;
  console.log('SpotFinder: Extracting from URL:', url);
  
  // Try different URL patterns
  // Pattern 1: /@lat,lng,zoom
  let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*)z/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: parseFloat(match[3])
    };
  }
  
  // Pattern 2: /maps/@lat,lng,zoom
  match = url.match(/\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: parseFloat(match[3])
    };
  }
  
  // Pattern 3: Check URL hash
  const hash = window.location.hash;
  match = hash.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: parseFloat(match[3])
    };
  }
  
  // Pattern 4: Search params
  const urlParams = new URLSearchParams(window.location.search);
  const center = urlParams.get('center');
  if (center) {
    const coords = center.split(',');
    if (coords.length >= 2) {
      return {
        lat: parseFloat(coords[0]),
        lng: parseFloat(coords[1]),
        zoom: 14 // default zoom
      };
    }
  }
  
  console.log('SpotFinder: Could not extract coordinates from URL');
  return null;
}

function showCenterAndRadius() {
  console.log('SpotFinder: showCenterAndRadius called');
  clearVisualIndicators();
  
  if (!selectedCenter) {
    console.log('SpotFinder: No selected center, returning');
    return;
  }

  console.log('SpotFinder: Creating visual indicators for center:', selectedCenter);
  
  const radiusInput = document.getElementById('spotfinder-radius');
  const radius = parseInt(radiusInput ? radiusInput.value : '1000') || 1000;
  console.log('SpotFinder: Using radius:', radius);
  
  // Always use smart DOM indicators with zoom awareness
  createSmartDOMIndicators(radius);
  
  // Set up URL monitoring for zoom changes
  setupZoomMonitoring();
  
  // Show radius info in the status
  const statusEl = document.getElementById('spotfinder-status');
  if (statusEl) {
    statusEl.innerHTML = `Center: ${selectedCenter.lat.toFixed(6)}, ${selectedCenter.lng.toFixed(6)}<br>Radius: ${radius}m - Ready to search!`;
    console.log('SpotFinder: Status updated');
  }
}

function createGoogleMapsIndicators(radius) {
  console.log('SpotFinder: Using Google Maps API for indicators');
  
  try {
    // Try to get the map instance from the page
    const mapInstance = getGoogleMapInstance();
    
    if (mapInstance) {
      // Create center marker
      centerMarker = new google.maps.Marker({
        position: selectedCenter,
        map: mapInstance,
        title: 'Search Center',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF0000',
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 8
        }
      });

      // Create accurate radius circle
      radiusCircle = new google.maps.Circle({
        center: selectedCenter,
        radius: radius,
        map: mapInstance,
        fillColor: '#1976d2',
        fillOpacity: 0.1,
        strokeColor: '#1976d2',
        strokeOpacity: 0.8,
        strokeWeight: 2
      });
      
      // Add zoom change listener to update map bounds info
      google.maps.event.addListener(mapInstance, 'zoom_changed', function() {
        const newZoom = mapInstance.getZoom();
        const center = mapInstance.getCenter();
        if (center && currentMapBounds) {
          currentMapBounds.zoom = newZoom;
          currentMapBounds.lat = center.lat();
          currentMapBounds.lng = center.lng();
          console.log('SpotFinder: Zoom changed to:', newZoom);
          
          // Force circle to redraw/refresh to ensure it scales properly
          if (radiusCircle) {
            const currentRadius = radiusCircle.getRadius();
            radiusCircle.setRadius(currentRadius);
            console.log('SpotFinder: Refreshed circle radius for new zoom level');
          }
        }
      });
      
      // Also add bounds change listener for better responsiveness
      google.maps.event.addListener(mapInstance, 'bounds_changed', function() {
        if (radiusCircle && currentMapBounds) {
          // Ensure circle stays visible and properly scaled
          const bounds = mapInstance.getBounds();
          if (bounds && selectedCenter) {
            const centerLatLng = new google.maps.LatLng(selectedCenter.lat, selectedCenter.lng);
            if (!bounds.contains(centerLatLng)) {
              // Center moved out of view, optionally recenter or adjust
              console.log('SpotFinder: Center point moved out of view');
            }
          }
        }
      });
      
      console.log('SpotFinder: Google Maps circle created with radius:', radius);
    } else {
      console.log('SpotFinder: Could not get map instance, falling back to DOM');
      createDOMIndicators(radius);
    }
  } catch (error) {
    console.log('SpotFinder: Error creating Google Maps indicators:', error);
    createDOMIndicators(radius);
  }
}

function createSmartDOMIndicators(radius) {
  console.log('SpotFinder: Creating smart DOM indicators with zoom awareness');
  
  // Create center point indicator
  const centerIndicator = document.createElement('div');
  centerIndicator.id = 'spotfinder-center-indicator';
  centerIndicator.style.cssText = `
    position: fixed;
    width: 16px;
    height: 16px;
    background: #FF0000;
    border: 2px solid white;
    border-radius: 50%;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
  `;
  document.body.appendChild(centerIndicator);
  
  // Create smart radius circle with proper scaling
  const radiusSize = calculateRadiusSizeFromZoom(radius);
  const radiusCircle = document.createElement('div');
  radiusCircle.id = 'spotfinder-radius-circle';
  radiusCircle.style.cssText = `
    position: fixed;
    width: ${radiusSize}px;
    height: ${radiusSize}px;
    border: 2px solid #1976d2;
    border-radius: 50%;
    background: rgba(25, 118, 210, 0.1);
    z-index: 9998;
    pointer-events: none;
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
  `;
  document.body.appendChild(radiusCircle);
  
  console.log(`SpotFinder: Created circle with ${radiusSize}px diameter for ${radius}m radius at zoom ${currentMapBounds?.zoom || 'unknown'}`);
}

function calculateRadiusSizeFromZoom(radiusMeters) {
  // Get current zoom level from URL or stored bounds
  const mapData = extractMapDataFromUrl();
  const zoom = mapData?.zoom || currentMapBounds?.zoom || 14;
  const lat = mapData?.lat || selectedCenter?.lat || 49.2807;

  console.log(`SpotFinder: Calculating radius for ${radiusMeters}m at zoom ${zoom}, lat ${lat}`);
  
  // Google Maps uses Mercator projection
  // Formula: pixels_per_meter = (256 * 2^zoom) / (40075016.686 * cos(lat * π/180))
  // Where 256 is tile size, 40075016.686 is Earth's circumference in meters
  
  const latRadians = lat * Math.PI / 180;
  const earthCircumference = 40075016.686; // Earth's circumference in meters
  const tileSize = 256; // Google Maps tile size in pixels
  
  const pixelsPerMeter = (tileSize * Math.pow(2, zoom)) / (earthCircumference * Math.cos(latRadians));
  const radiusPixels = radiusMeters * pixelsPerMeter;
  
  // Double the radius since we want diameter, and clamp to reasonable values
  const diameter = radiusPixels * 2;
  const clampedDiameter = Math.max(20, Math.min(800, diameter));
  
  console.log(`SpotFinder: Zoom ${zoom}, pixelsPerMeter: ${pixelsPerMeter.toFixed(6)}, radius: ${radiusPixels.toFixed(1)}px, diameter: ${clampedDiameter.toFixed(1)}px`);
  
  return clampedDiameter;
}

let zoomMonitoringActive = false;
let lastUrl = '';

function setupZoomMonitoring() {
  if (zoomMonitoringActive) return;
  zoomMonitoringActive = true;
  
  console.log('SpotFinder: Setting up zoom monitoring');
  
  lastUrl = window.location.href;
  
  // Monitor URL changes (Google Maps updates URL when zooming/panning)
  const checkForUrlChanges = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('SpotFinder: URL changed, updating radius circle');
      lastUrl = currentUrl;
      
      // Extract new map data
      const newMapData = extractMapDataFromUrl();
      if (newMapData) {
        currentMapBounds = newMapData;
        
        // Update the radius circle size
        updateRadiusCircleSize();
      }
    }
  };
  
  // Check for URL changes every 500ms
  const urlMonitorInterval = setInterval(checkForUrlChanges, 500);
  
  // Store interval ID for cleanup
  window.spotFinderUrlMonitor = urlMonitorInterval;
  
  // Also use MutationObserver to catch any DOM changes that might indicate map updates
  const observer = new MutationObserver(() => {
    // Debounce rapid changes
    clearTimeout(window.spotFinderUpdateTimeout);
    window.spotFinderUpdateTimeout = setTimeout(() => {
      checkForUrlChanges();
    }, 100);
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: false 
  });
  
  // Store observer for cleanup
  window.spotFinderMutationObserver = observer;
}

function updateRadiusCircleSize() {
  const radiusCircle = document.getElementById('spotfinder-radius-circle');
  if (!radiusCircle || !selectedCenter) return;
  
  const radiusInput = document.getElementById('spotfinder-radius');
  const radius = parseInt(radiusInput?.value || '1000') || 1000;
  
  const newSize = calculateRadiusSizeFromZoom(radius);
  radiusCircle.style.width = `${newSize}px`;
  radiusCircle.style.height = `${newSize}px`;
  
  console.log(`SpotFinder: Updated circle size to ${newSize}px for ${radius}m radius`);
}

function getGoogleMapInstance() {
  // Try different methods to get the map instance
  try {
    // Method 1: Look for existing map in global scope
    if (window.map) {
      console.log('SpotFinder: Found map in global scope');
      return window.map;
    }
    
    // Method 2: Try to access Google Maps through internal APIs
    if (window.google && window.google.maps) {
      // Look for map elements with Google Maps internal references
      const mapElements = document.querySelectorAll('div[style*="position"]');
      for (const element of mapElements) {
        if (element.__gm) {
          console.log('SpotFinder: Found map through __gm property');
          return element.__gm.map;
        }
      }
      
      // Try canvas elements (Google Maps often uses canvas)
      const canvasElements = document.querySelectorAll('canvas');
      for (const canvas of canvasElements) {
        const parent = canvas.parentElement;
        if (parent && parent.__gm) {
          console.log('SpotFinder: Found map through canvas parent');
          return parent.__gm.map;
        }
      }
    }
    
    // Method 3: Try to create a shared map instance
    const mapContainer = document.querySelector('#map') || 
                        document.querySelector('[data-map]') ||
                        document.querySelector('.widget-scene-canvas') ||
                        document.querySelector('div[role="main"]');
    
    if (mapContainer && window.google && window.google.maps) {
      console.log('SpotFinder: Creating shared map instance');
      // Create a map that shares the existing map's view
      const map = new google.maps.Map(document.createElement('div'), {
        zoom: currentMapBounds?.zoom || 14,
        center: selectedCenter || {lat: 37.7749, lng: -122.4194}
      });
      
      // Try to sync with the visible map by monitoring URL changes
      const observer = new MutationObserver(() => {
        const mapData = extractMapDataFromUrl();
        if (mapData && map) {
          map.setCenter({lat: mapData.lat, lng: mapData.lng});
          map.setZoom(mapData.zoom);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      return map;
    }
    
    console.log('SpotFinder: Could not obtain map instance');
    return null;
  } catch (error) {
    console.log('SpotFinder: Error getting map instance:', error);
    return null;
  }
}

function searchPlaces() {
  if (!selectedCenter) {
    alert('Please select a center point first');
    return;
  }

  const radius = parseInt(document.getElementById('spotfinder-radius').value) || 1000;
  const statusEl = document.getElementById('spotfinder-status');
  
  // Get place type filters
  const includeRestaurants = document.getElementById('filter-restaurant').checked;
  const includeHotels = document.getElementById('filter-hotel').checked;
  const includeAttractions = document.getElementById('filter-attractions').checked;
  
  if (!includeRestaurants && !includeHotels && !includeAttractions) {
    statusEl.textContent = 'Please select at least one place type to search.';
    return;
  }
  
  statusEl.textContent = 'Searching for places...';

  chrome.runtime.sendMessage({
    action: 'searchPlaces',
    center: selectedCenter,
    radius: radius,
    filters: {
      restaurants: includeRestaurants,
      hotels: includeHotels,
      attractions: includeAttractions
    }
  }, (response) => {
    if (response && response.success) {
      statusEl.textContent = `Found ${response.places.length} places. Check results below!`;
      showResultsOnPage(response.places);
    } else {
      const error = response ? response.error : 'No response from background script';
      statusEl.textContent = `Error: ${error}`;
      console.error('SpotFinder search error:', error);
    }
  });
}

let allResultsData = [];
let currentPage = 0;
const resultsPerPage = 10;

function showResultsOnPage(places) {
  // Remove any existing results
  const existingResults = document.getElementById('spotfinder-results');
  if (existingResults) {
    existingResults.remove();
  }

  if (!places || places.length === 0) {
    const statusEl = document.getElementById('spotfinder-status');
    statusEl.textContent = 'No places found in the specified area';
    return;
  }

  // Sort places by user_ratings_total (number of reviews) in descending order
  allResultsData = places.sort((a, b) => {
    const ratingsA = a.user_ratings_total || 0;
    const ratingsB = b.user_ratings_total || 0;
    return ratingsB - ratingsA;
  });
  
  currentPage = 0;
  displayResultsPage();
}

function displayResultsPage() {
  // Remove existing results content but keep container
  let resultsDiv = document.getElementById('spotfinder-results');
  if (resultsDiv) {
    resultsDiv.remove();
  }

  const totalPages = Math.ceil(allResultsData.length / resultsPerPage);
  const startIndex = currentPage * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentPageResults = allResultsData.slice(startIndex, endIndex);

  // Create results container
  resultsDiv = document.createElement('div');
  resultsDiv.id = 'spotfinder-results';
  resultsDiv.style.cssText = `
    position: fixed;
    top: 120px;
    right: 10px;
    width: 350px;
    max-height: 500px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1001;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: #1976d2;
    color: white;
    padding: 12px;
    border-radius: 8px 8px 0 0;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `;
  header.innerHTML = `
    <span>🎯 ${allResultsData.length} Places (Page ${currentPage + 1}/${totalPages})</span>
    <button id="close-results" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
  `;

  const resultsContainer = document.createElement('div');
  resultsContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    max-height: 350px;
  `;

  // Add places for current page
  currentPageResults.forEach((place, index) => {
    const globalIndex = startIndex + index;
    const placeDiv = document.createElement('div');
    placeDiv.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    `;
    placeDiv.addEventListener('mouseenter', () => placeDiv.style.background = '#f5f5f5');
    placeDiv.addEventListener('mouseleave', () => placeDiv.style.background = 'white');

    const rating = place.rating ? place.rating.toFixed(1) : 'N/A';
    const reviewCount = place.user_ratings_total || 0;
    const stars = rating !== 'N/A' ? '⭐'.repeat(Math.round(place.rating)) : '';

    placeDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${globalIndex + 1}. ${place.name}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${place.vicinity || place.formatted_address || 'No address'}</div>
      <div style="font-size: 14px;">
        <span style="color: #ff9800;">${stars} ${rating}</span>
        <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; color: #1976d2;">${reviewCount} reviews</span>
      </div>
    `;

    placeDiv.addEventListener('click', () => {
      const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
      window.open(url, '_blank');
    });

    resultsContainer.appendChild(placeDiv);
  });

  // Add pagination controls
  const paginationDiv = document.createElement('div');
  paginationDiv.style.cssText = `
    background: #f5f5f5;
    padding: 10px;
    border-radius: 0 0 8px 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-top: 1px solid #ddd;
    flex-shrink: 0;
  `;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.style.cssText = `
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: ${currentPage > 0 ? '#1976d2' : '#ccc'};
    color: ${currentPage > 0 ? 'white' : '#666'};
    border-radius: 4px;
    cursor: ${currentPage > 0 ? 'pointer' : 'not-allowed'};
    font-size: 12px;
  `;
  prevBtn.disabled = currentPage === 0;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      displayResultsPage();
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.style.cssText = `
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: ${currentPage < totalPages - 1 ? '#1976d2' : '#ccc'};
    color: ${currentPage < totalPages - 1 ? 'white' : '#666'};
    border-radius: 4px;
    cursor: ${currentPage < totalPages - 1 ? 'pointer' : 'not-allowed'};
    font-size: 12px;
  `;
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      displayResultsPage();
    }
  });

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `${startIndex + 1}-${Math.min(endIndex, allResultsData.length)} of ${allResultsData.length}`;
  pageInfo.style.cssText = `
    font-size: 12px;
    color: #666;
    margin: 0 10px;
  `;

  paginationDiv.appendChild(prevBtn);
  paginationDiv.appendChild(pageInfo);
  paginationDiv.appendChild(nextBtn);

  resultsDiv.appendChild(header);
  resultsDiv.appendChild(resultsContainer);
  resultsDiv.appendChild(paginationDiv);

  document.body.appendChild(resultsDiv);

  // Close button handler
  document.getElementById('close-results').addEventListener('click', () => {
    resultsDiv.remove();
  });
}

function clearVisualIndicators() {
  // Clear Google Maps objects
  if (centerMarker) {
    centerMarker.setMap(null);
    centerMarker = null;
  }
  
  if (radiusCircle) {
    radiusCircle.setMap(null);
    radiusCircle = null;
  }
  
  // Clear DOM indicators
  const centerIndicator = document.getElementById('spotfinder-center-indicator');
  if (centerIndicator) {
    centerIndicator.remove();
  }
  
  const domRadiusCircle = document.getElementById('spotfinder-radius-circle');
  if (domRadiusCircle) {
    domRadiusCircle.remove();
  }
  
  // Clean up monitoring
  if (window.spotFinderUrlMonitor) {
    clearInterval(window.spotFinderUrlMonitor);
    window.spotFinderUrlMonitor = null;
  }
  
  if (window.spotFinderMutationObserver) {
    window.spotFinderMutationObserver.disconnect();
    window.spotFinderMutationObserver = null;
  }
  
  if (window.spotFinderUpdateTimeout) {
    clearTimeout(window.spotFinderUpdateTimeout);
    window.spotFinderUpdateTimeout = null;
  }
  
  zoomMonitoringActive = false;
  console.log('SpotFinder: Cleaned up all visual indicators and monitoring');
}

function clearSelection() {
  selectedCenter = null;
  
  clearVisualIndicators();
  
  const searchBtn = document.getElementById('spotfinder-search');
  const statusEl = document.getElementById('spotfinder-status');
  
  if (searchBtn) searchBtn.disabled = true;
  if (statusEl) statusEl.textContent = 'Click Select Center to start a new search.';
}

// Update radius display when radius input changes
function setupRadiusUpdater() {
  const radiusInput = document.getElementById('spotfinder-radius');
  if (radiusInput) {
    radiusInput.addEventListener('input', function() {
      if (selectedCenter) {
        const radius = parseInt(this.value) || 1000;
        
        // Update status
        const statusEl = document.getElementById('spotfinder-status');
        if (statusEl) {
          statusEl.innerHTML = `Center: ${selectedCenter.lat.toFixed(6)}, ${selectedCenter.lng.toFixed(6)}<br>Radius: ${radius}m - Ready to search!`;
        }
        
        // Update Google Maps circle if it exists
        if (radiusCircle && radiusCircle.setRadius) {
          radiusCircle.setRadius(radius);
          console.log('SpotFinder: Updated Google Maps circle radius to:', radius);
        }
        
        // Update smart DOM circle with proper zoom-based scaling
        const domRadiusCircle = document.getElementById('spotfinder-radius-circle');
        if (domRadiusCircle) {
          const newSize = calculateRadiusSizeFromZoom(radius);
          domRadiusCircle.style.width = `${newSize}px`;
          domRadiusCircle.style.height = `${newSize}px`;
          console.log(`SpotFinder: Updated radius input - new circle size: ${newSize}px for ${radius}m`);
        }
      }
    });
  }
}

function saveApiKey() {
  const apiKeyInput = document.getElementById('spotfinder-api-key');
  const statusEl = document.getElementById('spotfinder-status');
  const apiKey = apiKeyInput.value.trim();
  
  if (apiKey) {
    if (apiKey.length < 30 || !apiKey.startsWith('AIza')) {
      statusEl.textContent = 'Warning: API key format looks unusual but saving anyway...';
    } else {
      statusEl.textContent = 'Saving API key...';
    }
    
    chrome.storage.sync.set({ googlePlacesApiKey: apiKey }, function() {
      if (chrome.runtime.lastError) {
        statusEl.textContent = 'Error saving API key: ' + chrome.runtime.lastError.message;
      } else {
        // Also save to localStorage as backup
        try {
          localStorage.setItem('spotfinder_api_key_backup', apiKey);
        } catch (e) {
          console.log('SpotFinder: Could not save to localStorage:', e);
        }
        
        statusEl.textContent = 'API key saved! Click Use Map Center to start.';
        console.log('SpotFinder: API key saved successfully');
      }
    });
  } else {
    statusEl.textContent = 'Please enter a valid API key';
  }
}

function loadSavedApiKey() {
  chrome.storage.sync.get(['googlePlacesApiKey'], function(result) {
    const apiKeyInput = document.getElementById('spotfinder-api-key');
    const statusEl = document.getElementById('spotfinder-status');
    
    if (result.googlePlacesApiKey) {
      apiKeyInput.value = result.googlePlacesApiKey;
      statusEl.textContent = 'API key loaded. Click Use Map Center to start.';
      console.log('SpotFinder: API key loaded from Chrome storage');
    } else {
      // Try backup from localStorage
      try {
        const backupKey = localStorage.getItem('spotfinder_api_key_backup');
        if (backupKey) {
          apiKeyInput.value = backupKey;
          statusEl.textContent = 'API key loaded from backup. Click Use Map Center to start.';
          console.log('SpotFinder: API key loaded from localStorage backup');
          
          // Save back to Chrome storage
          chrome.storage.sync.set({ googlePlacesApiKey: backupKey }, function() {
            console.log('SpotFinder: API key restored to Chrome storage');
          });
        } else {
          statusEl.textContent = 'Enter API key and click Use Map Center to start.';
        }
      } catch (e) {
        console.log('SpotFinder: Could not access localStorage:', e);
        statusEl.textContent = 'Enter API key and click Use Map Center to start.';
      }
    }
  });
}

// Initialize when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpotFinder);
} else {
  initSpotFinder();
}