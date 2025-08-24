document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveKeyBtn = document.getElementById('save-key');
  const statusDiv = document.getElementById('status');
  const resultsSection = document.getElementById('results-section');
  const resultsContainer = document.getElementById('results-container');

  // Load saved API key on startup
  loadApiKey();
  
  function loadApiKey() {
    chrome.storage.sync.get(['googlePlacesApiKey'], function(result) {
      if (result.googlePlacesApiKey) {
        apiKeyInput.value = result.googlePlacesApiKey;
        statusDiv.textContent = 'API key loaded and ready to use!';
        validateApiKeyInBackground(result.googlePlacesApiKey);
      } else {
        statusDiv.textContent = 'Please enter your Google Places API key to get started.';
      }
    });
  }
  
  function validateApiKeyInBackground(apiKey) {
    // Quick validation - just check if it looks like a valid API key format
    if (apiKey && apiKey.length > 30 && apiKey.startsWith('AIza')) {
      statusDiv.textContent = 'API key loaded and appears valid. Ready to search on Google Maps!';
    } else {
      statusDiv.textContent = 'API key loaded but format seems unusual. Please verify it\'s correct.';
    }
  }

  // Save API key
  saveKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      if (apiKey.length < 30 || !apiKey.startsWith('AIza')) {
        statusDiv.textContent = 'Warning: API key format looks unusual. Please verify it\'s correct.';
      }
      
      chrome.storage.sync.set({ googlePlacesApiKey: apiKey }, function() {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error saving API key: ' + chrome.runtime.lastError.message;
        } else {
          statusDiv.textContent = 'API key saved successfully!';
          
          // Also save to local storage as backup
          try {
            localStorage.setItem('spotfinder_api_key_backup', apiKey);
          } catch (e) {
            console.log('Could not save to localStorage:', e);
          }
          
          setTimeout(() => {
            statusDiv.textContent = 'Ready to search on Google Maps! The key is now saved permanently.';
          }, 2000);
        }
      });
    } else {
      statusDiv.textContent = 'Please enter a valid API key';
    }
  });
  
  // Clear API key button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear Key';
  clearBtn.className = 'btn btn-primary';
  clearBtn.style.marginLeft = '5px';
  clearBtn.style.backgroundColor = '#f44336';
  clearBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the saved API key?')) {
      chrome.storage.sync.remove(['googlePlacesApiKey'], function() {
        localStorage.removeItem('spotfinder_api_key_backup');
        apiKeyInput.value = '';
        statusDiv.textContent = 'API key cleared. Please enter a new one.';
      });
    }
  });
  
  saveKeyBtn.parentNode.appendChild(clearBtn);

  // Listen for results from background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'displayResults') {
      displayResults(request.places);
    }
  });

  function displayResults(places) {
    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = '';

    if (!places || places.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No places found in the specified area</div>';
      return;
    }

    // Sort places by user_ratings_total (number of reviews) in descending order
    const sortedPlaces = places.sort((a, b) => {
      const ratingsA = a.user_ratings_total || 0;
      const ratingsB = b.user_ratings_total || 0;
      return ratingsB - ratingsA;
    });

    sortedPlaces.forEach((place, index) => {
      const placeDiv = document.createElement('div');
      placeDiv.className = 'place-item';
      
      const rating = place.rating ? place.rating.toFixed(1) : 'N/A';
      const reviewCount = place.user_ratings_total || 0;
      const stars = rating !== 'N/A' ? '⭐'.repeat(Math.round(place.rating)) : '';
      
      placeDiv.innerHTML = `
        <div class="place-name">${place.name}</div>
        <div class="place-details">${place.vicinity || place.formatted_address || 'No address available'}</div>
        <div class="place-rating">
          <span class="rating-stars">${stars} ${rating}</span>
          <span class="review-count">${reviewCount} reviews</span>
        </div>
      `;

      // Add click handler to open place in Google Maps
      placeDiv.addEventListener('click', function() {
        const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        chrome.tabs.create({ url: url });
      });
      
      placeDiv.style.cursor = 'pointer';
      placeDiv.title = 'Click to view in Google Maps';
      
      resultsContainer.appendChild(placeDiv);
    });

    statusDiv.textContent = `Displaying ${sortedPlaces.length} places sorted by review count`;
  }

  // Check if we're on Google Maps
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url && currentTab.url.includes('maps.google.com')) {
      statusDiv.textContent = 'Great! You\'re on Google Maps. Use the controls to search for places.';
    } else {
      statusDiv.textContent = 'Please navigate to Google Maps to use this extension.';
    }
  });
});