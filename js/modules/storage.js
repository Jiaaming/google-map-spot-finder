/**
 * Storage Module
 * Handles API key storage and retrieval using Chrome storage API
 */

class StorageManager {
  /**
   * Save API key to Chrome storage
   * @param {string} apiKey - The API key to save
   * @param {Function} callback - Called with success/error status
   */
  saveApiKey(apiKey, callback) {
    if (!apiKey || apiKey.trim().length === 0) {
      callback({ success: false, message: 'Please enter a valid API key' });
      return;
    }

    const trimmedKey = apiKey.trim();

    // Validate API key format (optional warning)
    let warning = null;
    if (trimmedKey.length < 30 || !trimmedKey.startsWith('AIza')) {
      warning = 'Warning: API key format looks unusual but saving anyway...';
    }

    chrome.storage.sync.set({ googlePlacesApiKey: trimmedKey }, () => {
      if (chrome.runtime.lastError) {
        callback({
          success: false,
          message: 'Error saving API key: ' + chrome.runtime.lastError.message
        });
      } else {
        // Also save to localStorage as backup
        try {
          localStorage.setItem('spotfinder_api_key_backup', trimmedKey);
        } catch (e) {
          console.log('SpotFinder: Could not save to localStorage:', e);
        }

        callback({
          success: true,
          message: warning || 'API key saved! Click Use Map Center to start.',
          warning: warning
        });
        console.log('SpotFinder: API key saved successfully');
      }
    });
  }

  /**
   * Load API key from Chrome storage
   * @param {Function} callback - Called with API key or null
   */
  loadApiKey(callback) {
    chrome.storage.sync.get(['googlePlacesApiKey'], (result) => {
      if (result.googlePlacesApiKey) {
        console.log('SpotFinder: API key loaded from Chrome storage');
        callback({
          success: true,
          apiKey: result.googlePlacesApiKey,
          message: 'API key loaded. Click Use Map Center to start.'
        });
      } else {
        // Try backup from localStorage
        try {
          const backupKey = localStorage.getItem('spotfinder_api_key_backup');
          if (backupKey) {
            console.log('SpotFinder: API key loaded from localStorage backup');

            // Save back to Chrome storage
            chrome.storage.sync.set({ googlePlacesApiKey: backupKey }, () => {
              console.log('SpotFinder: API key restored to Chrome storage');
            });

            callback({
              success: true,
              apiKey: backupKey,
              message: 'API key loaded from backup. Click Use Map Center to start.'
            });
          } else {
            callback({
              success: false,
              apiKey: null,
              message: 'Enter API key and click Use Map Center to start.'
            });
          }
        } catch (e) {
          console.log('SpotFinder: Could not access localStorage:', e);
          callback({
            success: false,
            apiKey: null,
            message: 'Enter API key and click Use Map Center to start.'
          });
        }
      }
    });
  }

  /**
   * Get API key synchronously from localStorage (backup method)
   * @returns {string|null}
   */
  getApiKeySync() {
    try {
      return localStorage.getItem('spotfinder_api_key_backup');
    } catch (e) {
      console.log('SpotFinder: Could not access localStorage:', e);
      return null;
    }
  }
}
