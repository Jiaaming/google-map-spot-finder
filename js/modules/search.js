/**
 * Search Module
 * Handles places search and results management
 */

class SearchManager {
  constructor(uiManager, markerManager) {
    this.uiManager = uiManager;
    this.markerManager = markerManager;
    this.allResultsData = [];
    this.currentPage = 0;
    this.resultsPerPage = 10;
  }

  /**
   * Perform places search
   * @param {Object} center - Center coordinates {lat, lng}
   * @param {number} radius - Search radius in meters
   * @param {Object} filters - Place type filters
   */
  searchPlaces(center, radius, filters) {
    if (!center) {
      alert('Please select a center point first');
      return;
    }

    // Validate filters
    if (!filters.restaurants && !filters.hotels && !filters.attractions) {
      this.uiManager.updateStatus('Please select at least one place type to search.');
      return;
    }

    this.uiManager.updateStatus('Searching for places...');

    chrome.runtime.sendMessage({
      action: 'searchPlaces',
      center: center,
      radius: radius,
      filters: filters
    }, (response) => {
      if (response && response.success) {
        this.uiManager.updateStatus(`Found ${response.places.length} places. Check results below!`);
        console.log('Search results:', response.places);
        this.showResults(response.places);
      } else {
        const error = response ? response.error : 'No response from background script';
        this.uiManager.updateStatus(`Error: ${error}`);
        console.error('SpotFinder search error:', error);
      }
    });
  }

  /**
   * Show search results in UI
   * @param {Array} places - Array of place objects
   */
  showResults(places) {
    // Remove any existing results
    this.uiManager.removeResultsPanel();

    if (!places || places.length === 0) {
      this.uiManager.updateStatus('No places found in the specified area');
      return;
    }

    // Sort places by review count
    this.allResultsData = sortPlacesByReviews(places);
    this.currentPage = 0;
    this.displayResultsPage();
  }

  /**
   * Display current page of results
   */
  displayResultsPage() {
    const handlers = {
      onClose: () => this.handleCloseResults(),
      onPrevPage: () => this.handlePrevPage(),
      onNextPage: () => this.handleNextPage()
    };

    // Get current page data
    const startIndex = this.currentPage * this.resultsPerPage;
    const endIndex = startIndex + this.resultsPerPage;
    const currentPageResults = this.allResultsData.slice(startIndex, endIndex);

    // Clear existing result markers and add markers for current page
    this.markerManager.clearResultMarkers();
    this.markerManager.addMarkersForResults(currentPageResults, startIndex);

    // Create results panel
    const resultsDiv = this.uiManager.createResultsPanel(
      this.allResultsData,
      this.currentPage,
      this.resultsPerPage,
      handlers
    );

    // Make results draggable
    this.uiManager.makeDraggable(resultsDiv);
  }

  /**
   * Handle close results button
   */
  handleCloseResults() {
    this.markerManager.clearResultMarkers();
    this.uiManager.removeResultsPanel();
  }

  /**
   * Handle previous page button
   */
  handlePrevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.displayResultsPage();
    }
  }

  /**
   * Handle next page button
   */
  handleNextPage() {
    const totalPages = Math.ceil(this.allResultsData.length / this.resultsPerPage);
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.displayResultsPage();
    }
  }

  /**
   * Clear all search results
   */
  clearResults() {
    this.allResultsData = [];
    this.currentPage = 0;
    this.markerManager.clearResultMarkers();
    this.uiManager.removeResultsPanel();
  }
}
