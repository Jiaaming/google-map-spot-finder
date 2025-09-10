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
      position: fixed;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.95);
      padding: 18px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      backdrop-filter: blur(12px);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      border: 1px solid rgba(0, 0, 0, 0.1);
      min-width: 280px;
      cursor: move;
      user-select: none;
      transition: box-shadow 0.2s ease;
    }
    .spotfinder-controls input,
    .spotfinder-controls input:hover,
    .spotfinder-controls input:focus {
      user-select: text !important;
      cursor: text !important;
      pointer-events: auto !important;
    }
    .spotfinder-section {
      cursor: default;
    }
    .spotfinder-controls:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    }
    .spotfinder-controls.dragging {
      box-shadow: 0 16px 48px rgba(0,0,0,0.25);
      transform: rotate(1deg);
    }
    .spotfinder-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      margin: 3px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }
    .spotfinder-btn:hover {
      background: #1565c0;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
    }
    .spotfinder-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }
    .spotfinder-btn:disabled {
      background: #e0e0e0 !important;
      color: rgba(0, 0, 0, 0.4) !important;
      cursor: not-allowed !important;
      opacity: 0.7 !important;
      transform: none !important;
      box-shadow: none !important;
    }
    .spotfinder-btn:not(:disabled) {
      background: #1976d2 !important;
      color: white !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }
    .spotfinder-input {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      transition: all 0.2s ease;
      background: white;
      color: #333;
      pointer-events: auto;
      cursor: text;
    }
    .spotfinder-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
      background: white;
    }
    .spotfinder-section {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    .spotfinder-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .spotfinder-title {
      font-weight: 700;
      font-size: 16px;
      color: #1976d2;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .spotfinder-label {
      font-weight: 600;
      font-size: 13px;
      color: #333;
      margin-bottom: 6px;
      display: block;
    }
    .spotfinder-checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .spotfinder-checkbox-label {
      font-size: 12px;
      font-weight: 500;
      color: #555;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 12px;
    }
    .spotfinder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      cursor: move;
    }
    .spotfinder-header-controls {
      display: flex;
      gap: 4px;
    }
    .spotfinder-control-btn {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s ease;
    }
    .spotfinder-minimize-btn {
      background: #ffc107;
      color: #333;
    }
    .spotfinder-minimize-btn:hover {
      background: #ffb300;
      transform: scale(1.1);
    }
    .spotfinder-controls.minimized .spotfinder-content {
      display: none;
    }
    .spotfinder-controls.minimized {
      min-width: auto;
      width: auto;
      padding: 10px 14px;
    }
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.className = 'spotfinder-controls';
  controls.innerHTML = `
    <div class="spotfinder-header">
      <div class="spotfinder-title">🎯 SpotFinder</div>
      <div class="spotfinder-header-controls">
        <button class="spotfinder-control-btn spotfinder-minimize-btn" id="spotfinder-minimize" title="Minimize/Maximize">−</button>
      </div>
    </div>
    
    <div class="spotfinder-content">
      <div class="spotfinder-section">
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
          <label class="spotfinder-label" style="margin: 0; white-space: nowrap;">API Key:</label>
          <input type="password" id="spotfinder-api-key" placeholder="Google Places API Key" class="spotfinder-input" style="flex: 1;">
          <a href="https://developers.google.com/maps/documentation/places/web-service/get-api-key" target="_blank" 
             style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; 
                    background: #1976d2; color: white; border-radius: 50%; text-decoration: none; font-size: 11px; 
                    font-weight: bold; transition: all 0.2s ease;" 
             title="How to get API key">?</a>
          <button id="spotfinder-save-key" class="spotfinder-btn" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">Save</button>
        </div>
      </div>
      
      <div class="spotfinder-section">
        <label class="spotfinder-label">Place Types:</label>
        <div class="spotfinder-checkbox-group">
          <label class="spotfinder-checkbox-label">
            <input type="checkbox" id="filter-restaurant" checked> Restaurants
          </label>
          <label class="spotfinder-checkbox-label">
            <input type="checkbox" id="filter-hotel" checked> Hotels
          </label>
          <label class="spotfinder-checkbox-label">
            <input type="checkbox" id="filter-attractions" checked> Attractions
          </label>
        </div>
      </div>
      
      <div class="spotfinder-section">
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
          <button id="spotfinder-use-center" class="spotfinder-btn">Use Map Center</button>
          <label class="spotfinder-label" style="margin: 0; white-space: nowrap;">Radius:</label>
          <input type="number" id="spotfinder-radius" min="100" max="50000" value="1000" 
                 class="spotfinder-input" style="width: 80px;">
          <span style="font-size: 12px; color: #666;">m</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="spotfinder-search" class="spotfinder-btn" disabled style="flex: 1;">Search Places</button>
          <button id="spotfinder-clear" class="spotfinder-btn">Clear</button>
        </div>
      </div>
      
      <div id="spotfinder-status" style="font-size: 12px; margin-top: 8px; color: #666; line-height: 1.4;">
        Enter API key and click Use Map Center to start.
      </div>
    </div>
  `;
  
  document.body.appendChild(controls);

  document.getElementById('spotfinder-use-center').addEventListener('click', useMapCenter);
  document.getElementById('spotfinder-search').addEventListener('click', searchPlaces);
  document.getElementById('spotfinder-clear').addEventListener('click', clearSelection);
  document.getElementById('spotfinder-save-key').addEventListener('click', saveApiKey);
  
  // Add minimize functionality
  document.getElementById('spotfinder-minimize').addEventListener('click', function() {
    const controls = document.querySelector('.spotfinder-controls');
    const button = this;
    controls.classList.toggle('minimized');
    button.textContent = controls.classList.contains('minimized') ? '+' : '−';
  });

  // Add drag functionality
  makeDraggable(controls);

  setupRadiusUpdater();
  loadSavedApiKey();
}

// Drag functionality
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  function dragMouseDown(e) {
    e = e || window.event;
    
    // Only allow dragging from header or when not clicking interactive elements
    const target = e.target;
    const interactiveElements = ['INPUT', 'BUTTON', 'A', 'LABEL', 'SELECT', 'TEXTAREA'];
    
    // Don't drag if clicking on interactive elements or their containers
    if (interactiveElements.includes(target.tagName) || 
        target.closest('input') || 
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('spotfinder-input') ||
        target.id === 'spotfinder-radius' ||
        target.id === 'spotfinder-api-key') {
      return;
    }
    
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    element.classList.add('dragging');
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    const newTop = element.offsetTop - pos2;
    const newLeft = element.offsetLeft - pos1;
    
    // Keep element within viewport bounds
    const maxTop = window.innerHeight - element.offsetHeight;
    const maxLeft = window.innerWidth - element.offsetWidth;
    
    element.style.top = Math.max(0, Math.min(newTop, maxTop)) + "px";
    element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + "px";
    element.style.right = 'auto';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    element.classList.remove('dragging');
  }
  
  element.addEventListener('mousedown', dragMouseDown);
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
let resultMarkers = []; // Store markers for current page results
let markerUpdateInterval = null; // Interval for updating DOM marker positions

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
  // Store current position and state before removing
  let storedPosition = { top: '120px', left: 'auto', right: '10px' };
  let existingDiv = document.getElementById('spotfinder-results');
  if (existingDiv) {
    storedPosition = {
      top: existingDiv.style.top || '120px',
      left: existingDiv.style.left || 'auto', 
      right: existingDiv.style.right || '10px'
    };
    existingDiv.remove();
  }

  const totalPages = Math.ceil(allResultsData.length / resultsPerPage);
  const startIndex = currentPage * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentPageResults = allResultsData.slice(startIndex, endIndex);
  
  // Clear existing result markers and add markers for current page
  clearResultMarkers();
  addMarkersForCurrentPage(currentPageResults, startIndex);

  // Create results container
  resultsDiv = document.createElement('div');
  resultsDiv.id = 'spotfinder-results';
  resultsDiv.style.cssText = `
    position: fixed;
    top: ${storedPosition.top};
    left: ${storedPosition.left};
    right: ${storedPosition.right};
    width: 350px;
    max-height: 500px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    backdrop-filter: blur(12px);
    z-index: 1001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: move;
    user-select: none;
    transition: box-shadow 0.2s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: #1976d2;
    color: white;
    padding: 12px;
    border-radius: 12px 12px 0 0;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    cursor: move;
  `;
  header.innerHTML = `
    <span>🎯 ${allResultsData.length} Places (Page ${currentPage + 1}/${totalPages})</span>
    <div style="display: flex; gap: 4px; align-items: center;">
      <button id="close-results" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='none'">×</button>
    </div>
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
    clearResultMarkers();
    resultsDiv.remove();
  });
  
  // Make results draggable
  makeDraggable(resultsDiv);
}

function clearResultMarkers() {
  console.log('SpotFinder: Clearing result markers:', resultMarkers.length);
  
  // Stop marker position updates
  if (markerUpdateInterval) {
    clearInterval(markerUpdateInterval);
    markerUpdateInterval = null;
  }
  
  // Clear Google Maps markers
  resultMarkers.forEach(marker => {
    if (marker && marker.setMap) {
      marker.setMap(null);
    } else if (marker && marker.element) {
      marker.element.remove();
    }
  });
  
  // Clear DOM-based markers
  document.querySelectorAll('[id^="spotfinder-result-marker-"]').forEach(marker => {
    marker.remove();
  });
  
  resultMarkers = [];
}

function addMarkersForCurrentPage(places, startIndex) {
  if (!places || places.length === 0) return;
  
  console.log('SpotFinder: Adding markers for', places.length, 'places');
  
  // Try to get Google Maps instance first
  const mapInstance = getGoogleMapInstance();
  
  if (mapInstance && window.google && window.google.maps) {
    addGoogleMapsMarkers(places, startIndex, mapInstance);
  } else {
    addDOMMarkers(places, startIndex);
  }
}

function addGoogleMapsMarkers(places, startIndex, mapInstance) {
  console.log('SpotFinder: Adding Google Maps markers');
  
  places.forEach((place, index) => {
    if (!place.geometry || !place.geometry.location) return;
    
    const globalIndex = startIndex + index;
    const position = {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    };
    
    // Create custom marker with pin emoji and number
    const marker = new google.maps.Marker({
      position: position,
      map: mapInstance,
      title: `${globalIndex + 1}. ${place.name}`,
      label: {
        text: (globalIndex + 1).toString(),
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold'
      },
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <!-- Number label -->
            <rect x="8" y="2" width="16" height="12" rx="6" fill="#1976d2" stroke="#0d47a1" stroke-width="1"/>
            <text x="16" y="10" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">${globalIndex + 1}</text>
            <!-- Pin emoji approximation -->
            <circle cx="16" cy="26" r="8" fill="#e53e3e"/>
            <circle cx="16" cy="26" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      },
      animation: google.maps.Animation.DROP,
      zIndex: 1000 + globalIndex
    });
    
    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${place.name}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${place.vicinity || place.formatted_address || 'No address'}</p>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #ff9800; font-size: 14px;">${place.rating ? '⭐'.repeat(Math.round(place.rating)) + ' ' + place.rating.toFixed(1) : 'No rating'}</span>
            <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #1976d2;">${place.user_ratings_total || 0} reviews</span>
          </div>
        </div>
      `
    });
    
    marker.addListener('click', () => {
      // Close any open info windows
      resultMarkers.forEach(m => {
        if (m.infoWindow && m.infoWindow.close) {
          m.infoWindow.close();
        }
      });
      infoWindow.open(mapInstance, marker);
    });
    
    marker.infoWindow = infoWindow;
    resultMarkers.push(marker);
  });
  
  console.log('SpotFinder: Added', resultMarkers.length, 'Google Maps markers');
}

function addDOMMarkers(places, startIndex) {
  console.log('SpotFinder: Adding DOM-based markers with position tracking');
  
  places.forEach((place, index) => {
    if (!place.geometry || !place.geometry.location) return;
    
    const globalIndex = startIndex + index;
    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;
    
    // Create DOM marker container
    const markerContainer = document.createElement('div');
    markerContainer.id = `spotfinder-result-marker-${globalIndex}`;
    markerContainer.style.cssText = `
      position: fixed;
      transform: translate(-50%, -100%);
      z-index: 9990;
      cursor: pointer;
      pointer-events: auto;
      transition: left 0.1s ease, top 0.1s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    markerContainer.title = `${globalIndex + 1}. ${place.name}`;
    
    // Create number label
    const numberLabel = document.createElement('div');
    numberLabel.style.cssText = `
      background: #1976d2;
      color: white;
      font-weight: bold;
      font-size: 10px;
      font-family: Arial, sans-serif;
      padding: 2px 6px;
      border-radius: 8px;
      margin-bottom: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      border: 1px solid #0d47a1;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
    `;
    numberLabel.textContent = (globalIndex + 1).toString();
    
    // Create emoji marker
    const emojiMarker = document.createElement('div');
    emojiMarker.style.cssText = `
      font-size: 20px;
      line-height: 1;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
    `;
    emojiMarker.textContent = '📍';
    
    markerContainer.appendChild(numberLabel);
    markerContainer.appendChild(emojiMarker);
    
    const marker = markerContainer;
    
    // Add click handler
    marker.addEventListener('click', () => {
      const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
      window.open(url, '_blank');
    });
    
    document.body.appendChild(marker);
    
    // Store marker with its geographic coordinates
    resultMarkers.push({
      element: marker,
      place: place,
      lat: lat,
      lng: lng,
      globalIndex: globalIndex
    });
    
    // Set initial position
    updateMarkerPosition({ element: marker, lat: lat, lng: lng });
  });
  
  console.log('SpotFinder: Added', resultMarkers.length, 'DOM markers');
  
  // Start position updates for DOM markers
  startMarkerPositionUpdates();
}

function latLngToScreenPosition(lat, lng) {
  // This is a simplified conversion - works best when the search center is visible
  if (!selectedCenter || !currentMapBounds) return null;
  
  const mapData = extractMapDataFromUrl();
  const zoom = mapData?.zoom || currentMapBounds?.zoom || 14;
  const centerLat = mapData?.lat || selectedCenter?.lat;
  const centerLng = mapData?.lng || selectedCenter?.lng;
  
  if (!centerLat || !centerLng) return null;
  
  // Calculate pixel offset from center using Mercator projection
  const latRadians = centerLat * Math.PI / 180;
  
  const earthCircumference = 40075016.686; // Earth's circumference in meters
  const tileSize = 256;
  const pixelsPerMeter = (tileSize * Math.pow(2, zoom)) / (earthCircumference * Math.cos(latRadians));
  
  // Calculate distance in meters
  const latDiff = (lat - centerLat) * 111319.9; // degrees to meters (approximate)
  const lngDiff = (lng - centerLng) * 111319.9 * Math.cos(latRadians);
  
  // Convert to pixels from center
  const pixelX = lngDiff * pixelsPerMeter;
  const pixelY = -latDiff * pixelsPerMeter; // negative because screen Y increases downward
  
  // Get screen center position
  const screenCenterX = window.innerWidth / 2;
  const screenCenterY = window.innerHeight / 2;
  
  return {
    x: screenCenterX + pixelX,
    y: screenCenterY + pixelY
  };
}

function updateMarkerPosition(marker) {
  if (!marker || !marker.element || !marker.lat || !marker.lng) return;
  
  // Try improved position calculation first, fallback to basic one
  let screenPos = getImprovedScreenPosition(marker.lat, marker.lng);
  if (!screenPos) {
    screenPos = latLngToScreenPosition(marker.lat, marker.lng);
  }
  
  if (screenPos) {
    // Only update if the position is within reasonable bounds
    if (screenPos.x >= -100 && screenPos.x <= window.innerWidth + 100 &&
        screenPos.y >= -100 && screenPos.y <= window.innerHeight + 100) {
      marker.element.style.left = `${screenPos.x}px`;
      marker.element.style.top = `${screenPos.y}px`;
      marker.element.style.display = 'flex';
    } else {
      // Hide markers that are too far off screen
      marker.element.style.display = 'none';
    }
  }
}

function startMarkerPositionUpdates() {
  // Stop any existing updates
  if (markerUpdateInterval) {
    clearInterval(markerUpdateInterval);
  }
  
  console.log('SpotFinder: Starting marker position updates');
  
  // Update marker positions every 200ms
  markerUpdateInterval = setInterval(() => {
    const currentUrl = window.location.href;
    
    // Check if URL changed (indicating map movement/zoom)
    if (currentUrl !== lastUrl) {
      const newMapData = extractMapDataFromUrl();
      if (newMapData) {
        currentMapBounds = newMapData;
        
        // Update all DOM marker positions
        resultMarkers.forEach(marker => {
          if (marker.element && marker.lat && marker.lng) {
            updateMarkerPosition(marker);
          }
        });
      }
      lastUrl = currentUrl;
    }
  }, 100);
}

function getImprovedScreenPosition(lat, lng) {
  // Enhanced position calculation that's more accurate
  const mapData = extractMapDataFromUrl();
  if (!mapData) return null;
  
  const { lat: centerLat, lng: centerLng, zoom } = mapData;
  
  // Use more precise Mercator projection
  const TILE_SIZE = 256;
  
  // Convert to radians
  const centerLatRad = centerLat * Math.PI / 180;
  const centerLngRad = centerLng * Math.PI / 180;
  const pointLatRad = lat * Math.PI / 180;
  const pointLngRad = lng * Math.PI / 180;
  
  // Calculate world coordinates
  const scale = Math.pow(2, zoom);
  const worldCenterX = TILE_SIZE * scale * (centerLngRad + Math.PI) / (2 * Math.PI);
  const worldCenterY = TILE_SIZE * scale * (Math.PI - Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2))) / (2 * Math.PI);
  
  const worldPointX = TILE_SIZE * scale * (pointLngRad + Math.PI) / (2 * Math.PI);
  const worldPointY = TILE_SIZE * scale * (Math.PI - Math.log(Math.tan(Math.PI / 4 + pointLatRad / 2))) / (2 * Math.PI);
  
  // Convert to screen coordinates
  const screenCenterX = window.innerWidth / 2;
  const screenCenterY = window.innerHeight / 2;
  
  return {
    x: screenCenterX + (worldPointX - worldCenterX),
    y: screenCenterY + (worldPointY - worldCenterY)
  };
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
  
  // Clear result markers
  clearResultMarkers();
  
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