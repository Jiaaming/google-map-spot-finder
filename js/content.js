/**
 * SpotFinder Content Script
 * Main entry point - orchestrates all modules
 *
 * Note: This file depends on the following modules being loaded first:
 * - utils.js
 * - ui.js
 * - mapInteraction.js
 * - markers.js
 * - storage.js
 * - search.js
 */

/**
 * Main SpotFinder Application
 */
class SpotFinderApp {
  constructor() {
    // Initialize all managers
    this.uiManager = new UIManager();
    this.mapInteractionManager = new MapInteractionManager();
    this.markerManager = new MarkerManager(this.mapInteractionManager);
    this.storageManager = new StorageManager();
    this.searchManager = new SearchManager(this.uiManager, this.markerManager);

    // Application state
    this.selectedCenter = null;
  }

  /**
   * Initialize the application
   */
  init() {
    console.log('SpotFinder: Initializing on', window.location.href);
    this.mapInteractionManager.waitForMap(() => this.setupUI());
  }

  /**
   * Setup UI and event handlers
   */
  setupUI() {
    console.log('SpotFinder: Map detected, setting up controls');

    // Inject styles
    this.uiManager.injectStyles();

    // Create control panel with event handlers
    const handlers = {
      onUseCenter: () => this.handleUseCenter(),
      onSearch: () => this.handleSearch(),
      onClear: () => this.handleClear(),
      onSaveKey: () => this.handleSaveKey(),
      onRadiusChange: () => this.handleRadiusChange()
    };

    const controls = this.uiManager.createControlPanel(handlers);
    this.uiManager.makeDraggable(controls);

    // Load saved API key
    this.loadApiKey();
  }

  /**
   * Handle "Use Map Center" button click
   */
  handleUseCenter() {
    console.log('SpotFinder: Using map center from URL');

    // Extract coordinates and zoom from current Google Maps URL
    const mapData = this.mapInteractionManager.extractMapDataFromUrl();

    if (!mapData) {
      this.uiManager.updateStatus('Could not detect map location. Try navigating on the map first.');
      return;
    }

    this.selectedCenter = {
      lat: mapData.lat,
      lng: mapData.lng
    };

    // Store zoom level for radius calculation
    this.mapInteractionManager.updateMapBounds(mapData);

    console.log('SpotFinder: Map center extracted:', this.selectedCenter, 'zoom:', mapData.zoom);

    // Show visual indicators
    const radius = this.uiManager.getRadius();
    this.markerManager.showCenterAndRadius(this.selectedCenter, radius);

    // Enable search button
    this.uiManager.setSearchButtonEnabled(true);

    this.uiManager.updateStatus(
      `Using center: ${this.selectedCenter.lat.toFixed(6)}, ${this.selectedCenter.lng.toFixed(6)} - Ready to search!`
    );
  }

  /**
   * Handle "Search Places" button click
   */
  handleSearch() {
    const radius = this.uiManager.getRadius();
    const filters = this.uiManager.getFilters();
    this.searchManager.searchPlaces(this.selectedCenter, radius, filters);
  }

  /**
   * Handle "Clear" button click
   */
  handleClear() {
    this.selectedCenter = null;
    this.markerManager.clearVisualIndicators();
    this.searchManager.clearResults();
    this.uiManager.setSearchButtonEnabled(false);
    this.uiManager.updateStatus('Click Use Map Center to start a new search.');
  }

  /**
   * Handle "Save" API key button click
   */
  handleSaveKey() {
    const apiKeyInput = document.getElementById('spotfinder-api-key');
    const apiKey = apiKeyInput.value.trim();

    this.storageManager.saveApiKey(apiKey, (result) => {
      this.uiManager.updateStatus(result.message);
    });
  }

  /**
   * Handle radius input change
   */
  handleRadiusChange() {
    if (this.selectedCenter) {
      const radius = this.uiManager.getRadius();

      // Update status
      this.uiManager.updateStatus(
        `Center: ${this.selectedCenter.lat.toFixed(6)}, ${this.selectedCenter.lng.toFixed(6)}<br>Radius: ${radius}m - Ready to search!`
      );

      // Update radius circle size
      this.markerManager.updateRadiusCircleSize(radius);
    }
  }

  /**
   * Load saved API key
   */
  loadApiKey() {
    this.storageManager.loadApiKey((result) => {
      const apiKeyInput = document.getElementById('spotfinder-api-key');

      if (result.success && result.apiKey) {
        apiKeyInput.value = result.apiKey;
      }

      this.uiManager.updateStatus(result.message);
    });
  }
}

// Initialize when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new SpotFinderApp();
    app.init();
  });
} else {
  const app = new SpotFinderApp();
  app.init();
}
