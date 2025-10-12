/**
 * Utilities Module
 * Coordinate calculations, conversions, and helper functions
 */

/**
 * Calculate radius size in pixels based on map zoom level
 * Uses Mercator projection math
 * @param {number} radiusMeters - Radius in meters
 * @param {number} zoom - Map zoom level
 * @param {number} lat - Latitude
 * @returns {number} Radius in pixels (diameter)
 */
function calculateRadiusSizeFromZoom(radiusMeters, zoom, lat) {
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

/**
 * Convert lat/lng to screen position (simplified)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} centerData - Center data with lat, lng, zoom
 * @returns {Object|null} Screen position {x, y} or null
 */
function latLngToScreenPosition(lat, lng, centerData) {
  if (!centerData) return null;

  const { lat: centerLat, lng: centerLng, zoom } = centerData;

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

/**
 * Get improved screen position using Mercator projection
 * More accurate than the simplified version
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} mapData - Map data with lat, lng, zoom
 * @returns {Object|null} Screen position {x, y} or null
 */
function getImprovedScreenPosition(lat, lng, mapData) {
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

/**
 * Sort places by review count (descending)
 * @param {Array} places - Array of place objects
 * @returns {Array} Sorted places
 */
function sortPlacesByReviews(places) {
  return places.sort((a, b) => {
    const ratingsA = a.user_ratings_total || 0;
    const ratingsB = b.user_ratings_total || 0;
    return ratingsB - ratingsA;
  });
}
