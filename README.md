# SpotFinder Chrome Extension

A Chrome extension that helps you find and sort Google Places by review count within a specified radius on Google Maps.
![Example](https://raw.githubusercontent.com/Jiaaming/blogImage/main/pic/20251012182040.png)
## Features

- **Interactive Map Selection**: Click on Google Maps to select a center point
- **Customizable Radius**: Set search radius from 100m to 50km
- **Review-Based Sorting**: Results sorted by number of reviews (user_ratings_total)
- **Visual Feedback**: Shows selected center point and radius circle on the map
- **Detailed Results**: Displays place names, addresses, ratings, and review counts
- **Direct Navigation**: Click results to open places in Google Maps

## Installation

1. **Get a Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API"
   - Create credentials (API Key)
   - Restrict the API key to "Places API" for security

2. **Install the Extension**:
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the SpotFinder folder
   - The extension icon should appear in your toolbar

3. **Configure the Extension**:
   - Click the SpotFinder icon in Chrome toolbar
   - Enter your Google Places API key
   - Click "Save API Key"

## Usage

1. **Navigate to Google Maps** in your browser
2. **Select Center Point**:
   - Click "Select Center" in the extension controls (appears on Google Maps)
   - Click anywhere on the map to set your search center
3. **Set Search Radius**:
   - Adjust the radius value (default: 1000m)
   - The blue circle on the map shows the search area
4. **Search for Places**:
   - Click "Search Places" to find nearby locations
   - Results will open in the extension popup, sorted by review count
5. **View Results**:
   - Places are sorted by number of reviews (highest first)
   - Click any result to open it in Google Maps
   - Use "Clear" to reset and start a new search

## How It Works

1. **Content Script**: Injects interactive controls into Google Maps pages
2. **Places API Integration**: Uses Google Places Nearby Search API to find locations
3. **Smart Sorting**: Automatically sorts results by `user_ratings_total` field
4. **Visual Feedback**: Shows search radius and center point on the map
5. **Seamless Integration**: Works directly within Google Maps interface

## API Usage

The extension uses the Google Places Nearby Search API with these parameters:
- `location`: Latitude and longitude of selected center point
- `radius`: Search radius in meters (100-50000)
- `type`: All place types (restaurants, shops, attractions, etc.)

Results include:
- Place name and address
- Star rating and review count
- Place ID for direct Google Maps integration

## Privacy & Security

- API keys are stored locally in Chrome's sync storage
- No data is sent to external servers except Google's APIs
- Extension only activates on Google Maps pages
- All searches are performed client-side

## Troubleshooting

**Extension controls not appearing on Google Maps?**
- Refresh the Google Maps page
- Make sure you're on maps.google.com (not other map sites)
- Check if content script is blocked by other extensions

**API errors?**
- Verify your API key is correct
- Ensure Places API is enabled in Google Cloud Console
- Check API key restrictions and quotas

**No results found?**
- Try increasing the search radius
- Move to a different location with more businesses
- Check if the selected area has commercial establishments

## Development

To modify or enhance the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon for SpotFinder
4. Test your changes

