// Background service worker for SpotFinder extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchPlaces') {
    handlePlacesSearch(request.center, request.radius, request.filters, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'showResults') {
    showResultsInPopup(request.places);
  }
});

async function handlePlacesSearch(center, radius, filters, sendResponse) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['googlePlacesApiKey']);
    const apiKey = result.googlePlacesApiKey;
    
    if (!apiKey) {
      sendResponse({
        success: false,
        error: 'Google Places API key not found. Please set it in the extension popup.'
      });
      return;
    }

    // Define place types for each category
    const placeTypeCategories = {
      restaurants: ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bakery', 'bar'],
      hotels: ['lodging'],
      attractions: ['tourist_attraction', 'amusement_park', 'aquarium', 'art_gallery', 'museum', 'park', 'zoo']
    };
    
    let allPlaces = [];
    const searchPromises = [];
    
    // Make separate API calls for each selected category
    if (filters.restaurants) {
      for (const type of placeTypeCategories.restaurants) {
        searchPromises.push(searchPlacesByType(center, radius, type, apiKey));
      }
    }
    if (filters.hotels) {
      for (const type of placeTypeCategories.hotels) {
        searchPromises.push(searchPlacesByType(center, radius, type, apiKey));
      }
    }
    if (filters.attractions) {
      for (const type of placeTypeCategories.attractions) {
        searchPromises.push(searchPlacesByType(center, radius, type, apiKey));
      }
    }
    
    // If no specific filters, search without type restriction
    if (!filters.restaurants && !filters.hotels && !filters.attractions) {
      searchPromises.push(searchPlacesByType(center, radius, null, apiKey));
    }
    
    // Execute all searches in parallel
    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const placeMap = new Map();
    for (const result of results) {
      if (result && result.length > 0) {
        for (const place of result) {
          placeMap.set(place.place_id, place); // Use place_id to deduplicate
        }
      }
    }
    
    let places = Array.from(placeMap.values());
    console.log(`Found ${places.length} unique places from ${results.length} searches`);

    // Sort places by user_ratings_total (number of reviews) in descending order
    places.sort((a, b) => {
      const ratingsA = a.user_ratings_total || 0;
      const ratingsB = b.user_ratings_total || 0;
      return ratingsB - ratingsA;
    });

    sendResponse({
      success: true,
      places: places,
      total: places.length
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: `Network error: ${error.message}`
    });
  }
}

async function searchPlacesByType(center, radius, type, apiKey) {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&key=${apiKey}`;
    
    if (type) {
      url += `&type=${type}`;
    }
    
    console.log(`Searching for type: ${type || 'all'}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.results || [];
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error(`API error for type ${type}:`, data.status, data.error_message);
      return [];
    }
  } catch (error) {
    console.error(`Network error for type ${type}:`, error);
    return [];
  }
}

function showResultsInPopup(places) {
  // Send message to popup to display results
  chrome.runtime.sendMessage({
    action: 'displayResults',
    places: places
  });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SpotFinder extension installed');
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('maps.google.com')) {
    // Content script should already be injected via manifest, but we can add additional logic here if needed
    console.log('Google Maps tab loaded');
  }
});