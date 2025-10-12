/**
 * Marker Management Module
 * Handles creation, updating, and cleanup of map markers (center, radius, results)
 */

class MarkerManager {
  constructor(mapInteractionManager) {
    this.mapInteractionManager = mapInteractionManager;
    this.centerMarker = null;
    this.radiusCircle = null;
    this.resultMarkers = [];
    this.markerUpdateInterval = null;
    this.zoomMonitoringActive = false;
    this.lastUrl = '';
  }

  /**
   * Show center point and radius circle
   * @param {Object} center - Center coordinates {lat, lng}
   * @param {number} radius - Radius in meters
   */
  showCenterAndRadius(center, radius) {
    console.log('SpotFinder: showCenterAndRadius called');
    this.clearVisualIndicators();

    if (!center) {
      console.log('SpotFinder: No selected center, returning');
      return;
    }

    console.log('SpotFinder: Creating visual indicators for center:', center);
    console.log('SpotFinder: Using radius:', radius);

    // Always use smart DOM indicators with zoom awareness
    this.createSmartDOMIndicators(center, radius);

    // Set up URL monitoring for zoom changes
    this.setupZoomMonitoring(center, radius);
  }

  /**
   * Create DOM-based center and radius indicators with zoom awareness
   */
  createSmartDOMIndicators(center, radius) {
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
    const mapData = this.mapInteractionManager.extractMapDataFromUrl();
    const zoom = mapData?.zoom || this.mapInteractionManager.getMapBounds()?.zoom || 14;
    const lat = mapData?.lat || center?.lat || 49.2807;

    const radiusSize = calculateRadiusSizeFromZoom(radius, zoom, lat);
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

    console.log(`SpotFinder: Created circle with ${radiusSize}px diameter for ${radius}m radius at zoom ${zoom}`);
  }

  /**
   * Setup monitoring for URL changes (zoom/pan)
   */
  setupZoomMonitoring(center, radius) {
    if (this.zoomMonitoringActive) return;
    this.zoomMonitoringActive = true;

    console.log('SpotFinder: Setting up zoom monitoring');

    this.lastUrl = window.location.href;

    // Monitor URL changes (Google Maps updates URL when zooming/panning)
    const checkForUrlChanges = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        console.log('SpotFinder: URL changed, updating radius circle');
        this.lastUrl = currentUrl;

        // Extract new map data
        const newMapData = this.mapInteractionManager.extractMapDataFromUrl();
        if (newMapData) {
          this.mapInteractionManager.updateMapBounds(newMapData);

          // Update the radius circle size
          this.updateRadiusCircleSize(radius);
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

  /**
   * Update radius circle size based on current zoom
   */
  updateRadiusCircleSize(radius) {
    const radiusCircle = document.getElementById('spotfinder-radius-circle');
    if (!radiusCircle) return;

    const mapData = this.mapInteractionManager.extractMapDataFromUrl();
    const zoom = mapData?.zoom || 14;
    const lat = mapData?.lat || 0;

    const newSize = calculateRadiusSizeFromZoom(radius, zoom, lat);
    radiusCircle.style.width = `${newSize}px`;
    radiusCircle.style.height = `${newSize}px`;

    console.log(`SpotFinder: Updated circle size to ${newSize}px for ${radius}m radius`);
  }

  /**
   * Add markers for search results
   * @param {Array} places - Array of place objects
   * @param {number} startIndex - Starting index for numbering
   */
  addMarkersForResults(places, startIndex) {
    if (!places || places.length === 0) return;

    console.log('SpotFinder: Adding markers for', places.length, 'places');

    // Try to get Google Maps instance first
    const mapInstance = this.mapInteractionManager.getGoogleMapInstance();

    if (mapInstance && window.google && window.google.maps) {
      this.addGoogleMapsMarkers(places, startIndex, mapInstance);
    } else {
      this.addDOMMarkers(places, startIndex);
    }
  }

  /**
   * Add markers using Google Maps API
   */
  addGoogleMapsMarkers(places, startIndex, mapInstance) {
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
        this.resultMarkers.forEach(m => {
          if (m.infoWindow && m.infoWindow.close) {
            m.infoWindow.close();
          }
        });
        infoWindow.open(mapInstance, marker);
      });

      marker.infoWindow = infoWindow;
      this.resultMarkers.push(marker);
    });

    console.log('SpotFinder: Added', this.resultMarkers.length, 'Google Maps markers');
  }

  /**
   * Add DOM-based markers with position tracking
   */
  addDOMMarkers(places, startIndex) {
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

      // Add click handler
      markerContainer.addEventListener('click', () => {
        const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        window.open(url, '_blank');
      });

      document.body.appendChild(markerContainer);

      // Store marker with its geographic coordinates
      this.resultMarkers.push({
        element: markerContainer,
        place: place,
        lat: lat,
        lng: lng,
        globalIndex: globalIndex
      });

      // Set initial position
      this.updateMarkerPosition({ element: markerContainer, lat: lat, lng: lng });
    });

    console.log('SpotFinder: Added', this.resultMarkers.length, 'DOM markers');

    // Start position updates for DOM markers
    this.startMarkerPositionUpdates();
  }

  /**
   * Update position of a single DOM marker
   */
  updateMarkerPosition(marker) {
    if (!marker || !marker.element || !marker.lat || !marker.lng) return;

    // Try improved position calculation first, fallback to basic one
    const mapData = this.mapInteractionManager.extractMapDataFromUrl();
    let screenPos = getImprovedScreenPosition(marker.lat, marker.lng, mapData);
    if (!screenPos) {
      screenPos = latLngToScreenPosition(marker.lat, marker.lng, mapData);
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

  /**
   * Start periodic updates of DOM marker positions
   */
  startMarkerPositionUpdates() {
    // Stop any existing updates
    if (this.markerUpdateInterval) {
      clearInterval(this.markerUpdateInterval);
    }

    console.log('SpotFinder: Starting marker position updates');

    // Update marker positions every 200ms
    this.markerUpdateInterval = setInterval(() => {
      const currentUrl = window.location.href;

      // Check if URL changed (indicating map movement/zoom)
      if (currentUrl !== this.lastUrl) {
        const newMapData = this.mapInteractionManager.extractMapDataFromUrl();
        if (newMapData) {
          this.mapInteractionManager.updateMapBounds(newMapData);

          // Update all DOM marker positions
          this.resultMarkers.forEach(marker => {
            if (marker.element && marker.lat && marker.lng) {
              this.updateMarkerPosition(marker);
            }
          });
        }
        this.lastUrl = currentUrl;
      }
    }, 100);
  }

  /**
   * Clear result markers
   */
  clearResultMarkers() {
    console.log('SpotFinder: Clearing result markers:', this.resultMarkers.length);

    // Stop marker position updates
    if (this.markerUpdateInterval) {
      clearInterval(this.markerUpdateInterval);
      this.markerUpdateInterval = null;
    }

    // Clear Google Maps markers
    this.resultMarkers.forEach(marker => {
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

    this.resultMarkers = [];
  }

  /**
   * Clear all visual indicators (center, radius, results)
   */
  clearVisualIndicators() {
    // Clear Google Maps objects
    if (this.centerMarker) {
      this.centerMarker.setMap(null);
      this.centerMarker = null;
    }

    if (this.radiusCircle) {
      this.radiusCircle.setMap(null);
      this.radiusCircle = null;
    }

    // Clear result markers
    this.clearResultMarkers();

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

    this.zoomMonitoringActive = false;
    console.log('SpotFinder: Cleaned up all visual indicators and monitoring');
  }
}
