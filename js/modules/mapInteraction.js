/**
 * Map Interaction Module
 * Handles map detection, coordinate extraction, and Google Maps API interaction
 */

class MapInteractionManager {
  constructor() {
    this.currentMapBounds = null;
  }

  /**
   * Wait for map to be available on the page
   * @param {Function} callback - Called when map is detected
   */
  waitForMap(callback) {
    const mapContainer = document.querySelector('#map') ||
                        document.querySelector('[data-map]') ||
                        document.querySelector('.widget-scene-canvas') ||
                        document.querySelector('.scene-canvas') ||
                        document.querySelector('canvas[data-tile-size]');

    if (mapContainer || document.querySelector('.searchboxinput')) {
      console.log('SpotFinder: Map detected, setting up controls');
      callback();
    } else {
      setTimeout(() => this.waitForMap(callback), 2000);
    }
  }

  /**
   * Extract map data (center coordinates and zoom) from URL
   * @returns {Object|null} Map data with lat, lng, zoom or null if not found
   */
  extractMapDataFromUrl() {
    const url = window.location.href;
    console.log('SpotFinder: Extracting from URL:', url);

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

  /**
   * Get Google Maps instance from the page
   * @returns {google.maps.Map|null}
   */
  getGoogleMapInstance() {
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
        const map = new google.maps.Map(document.createElement('div'), {
          zoom: this.currentMapBounds?.zoom || 14,
          center: this.currentMapBounds || {lat: 37.7749, lng: -122.4194}
        });

        // Try to sync with the visible map by monitoring URL changes
        const observer = new MutationObserver(() => {
          const mapData = this.extractMapDataFromUrl();
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

  /**
   * Update current map bounds
   */
  updateMapBounds(mapData) {
    this.currentMapBounds = mapData;
  }

  /**
   * Get current map bounds
   */
  getMapBounds() {
    return this.currentMapBounds;
  }
}
