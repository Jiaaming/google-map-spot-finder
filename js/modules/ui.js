/**
 * UI Components Module
 * Handles all UI creation, styling, and DOM manipulation
 */

class UIManager {
  constructor() {
    this.controls = null;
    this.resultsDiv = null;
  }

  /**
   * Initialize and inject styles into the page
   */
  injectStyles() {
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
  }

  /**
   * Create main control panel
   * @param {Object} handlers - Event handlers for buttons
   * @returns {HTMLElement} The controls element
   */
  createControlPanel(handlers) {
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
    this.controls = controls;

    // Attach event handlers
    this.attachEventHandlers(handlers);

    return controls;
  }

  /**
   * Attach event handlers to control panel
   */
  attachEventHandlers(handlers) {
    document.getElementById('spotfinder-use-center').addEventListener('click', handlers.onUseCenter);
    document.getElementById('spotfinder-search').addEventListener('click', handlers.onSearch);
    document.getElementById('spotfinder-clear').addEventListener('click', handlers.onClear);
    document.getElementById('spotfinder-save-key').addEventListener('click', handlers.onSaveKey);
    document.getElementById('spotfinder-radius').addEventListener('input', handlers.onRadiusChange);

    // Minimize button
    document.getElementById('spotfinder-minimize').addEventListener('click', function() {
      const controls = document.querySelector('.spotfinder-controls');
      const button = this;
      controls.classList.toggle('minimized');
      button.textContent = controls.classList.contains('minimized') ? '+' : '−';
    });
  }

  /**
   * Make an element draggable
   */
  makeDraggable(element) {
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

  /**
   * Update status message
   */
  updateStatus(message) {
    const statusEl = document.getElementById('spotfinder-status');
    if (statusEl) {
      statusEl.innerHTML = message;
    }
  }

  /**
   * Enable/disable search button
   */
  setSearchButtonEnabled(enabled) {
    const searchBtn = document.getElementById('spotfinder-search');
    if (searchBtn) {
      searchBtn.disabled = !enabled;
      if (enabled) {
        searchBtn.style.opacity = '1';
        searchBtn.style.cursor = 'pointer';
        searchBtn.style.backgroundColor = '#1976d2';
      }
    }
  }

  /**
   * Get current radius value
   */
  getRadius() {
    const radiusInput = document.getElementById('spotfinder-radius');
    return parseInt(radiusInput ? radiusInput.value : '1000') || 1000;
  }

  /**
   * Get place type filters
   */
  getFilters() {
    return {
      restaurants: document.getElementById('filter-restaurant').checked,
      hotels: document.getElementById('filter-hotel').checked,
      attractions: document.getElementById('filter-attractions').checked
    };
  }

  /**
   * Create results display panel
   */
  createResultsPanel(places, currentPage, resultsPerPage, handlers) {
    // Remove any existing results
    const existingResults = document.getElementById('spotfinder-results');
    let storedPosition = { top: '120px', left: 'auto', right: '10px' };

    if (existingResults) {
      storedPosition = {
        top: existingResults.style.top || '120px',
        left: existingResults.style.left || 'auto',
        right: existingResults.style.right || '10px'
      };
      existingResults.remove();
    }

    const totalPages = Math.ceil(places.length / resultsPerPage);
    const startIndex = currentPage * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const currentPageResults = places.slice(startIndex, endIndex);

    // Create results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'spotfinder-results';
    resultsDiv.style.cssText = `
      position: fixed;
      top: ${storedPosition.top};
      left: ${storedPosition.left};
      right: ${storedPosition.right};
      width: 420px;
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

    const header = this.createResultsHeader(places.length, currentPage, totalPages, handlers.onClose);
    const resultsContainer = this.createResultsContainer(currentPageResults, startIndex);
    const paginationDiv = this.createPagination(currentPage, totalPages, startIndex, endIndex, places.length, handlers.onPrevPage, handlers.onNextPage);

    resultsDiv.appendChild(header);
    resultsDiv.appendChild(resultsContainer);
    resultsDiv.appendChild(paginationDiv);

    document.body.appendChild(resultsDiv);
    this.resultsDiv = resultsDiv;

    return resultsDiv;
  }

  /**
   * Create results header
   */
  createResultsHeader(totalCount, currentPage, totalPages, onClose) {
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
      <span>🎯 ${totalCount} Places (Page ${currentPage + 1}/${totalPages})</span>
      <div style="display: flex; gap: 4px; align-items: center;">
        <button id="close-results" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='none'">×</button>
      </div>
    `;

    header.querySelector('#close-results').addEventListener('click', onClose);
    return header;
  }

  /**
   * Create results container with place listings
   */
  createResultsContainer(places, startIndex) {
    const resultsContainer = document.createElement('div');
    resultsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      max-height: 350px;
    `;

    places.forEach((place, index) => {
      const globalIndex = startIndex + index;
      const placeDiv = document.createElement('div');
      placeDiv.style.cssText = `
        padding: 12px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.2s;
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 12px;
        align-items: center;
      `;
      placeDiv.addEventListener('mouseenter', () => placeDiv.style.background = '#f5f5f5');
      placeDiv.addEventListener('mouseleave', () => placeDiv.style.background = 'white');

      const rating = place.rating ? place.rating.toFixed(1) : 'N/A';
      const reviewCount = place.user_ratings_total || 0;
      const stars = rating !== 'N/A' ? '⭐'.repeat(Math.round(place.rating)) : '';
      const imageBlock = place.photo_url
        ? `<img src="${place.photo_url}" alt="Preview of ${place.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;">`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; background: linear-gradient(135deg, #f7f7f7 0%, #ededed 100%); border: 1px dashed #ddd;">No image</div>`;

      placeDiv.innerHTML = `
        <div style="width: 110px; height: 78px; border-radius: 10px; overflow: hidden; background: #f8f9fa; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          ${imageBlock}
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">${globalIndex + 1}. ${place.name}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 6px;">${place.vicinity || place.formatted_address || 'No address'}</div>
          <div style="font-size: 14px;">
            <span style="color: #ff9800;">${stars} ${rating}</span>
            <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; color: #1976d2;">${reviewCount} reviews</span>
          </div>
        </div>
      `;

      placeDiv.addEventListener('click', () => {
        const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        window.open(url, '_blank');
      });

      resultsContainer.appendChild(placeDiv);
    });

    return resultsContainer;
  }

  /**
   * Create pagination controls
   */
  createPagination(currentPage, totalPages, startIndex, endIndex, totalCount, onPrevPage, onNextPage) {
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
    prevBtn.addEventListener('click', onPrevPage);

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
    nextBtn.addEventListener('click', onNextPage);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `${startIndex + 1}-${Math.min(endIndex, totalCount)} of ${totalCount}`;
    pageInfo.style.cssText = `
      font-size: 12px;
      color: #666;
      margin: 0 10px;
    `;

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);

    return paginationDiv;
  }

  /**
   * Remove results panel
   */
  removeResultsPanel() {
    if (this.resultsDiv) {
      this.resultsDiv.remove();
      this.resultsDiv = null;
    }
  }
}
