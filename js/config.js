/**
 * Configuration & API Management
 * Project: Real-Time Location Tracker (Pincode, Phone & Device GPS)
 */

const CONFIG = {
  // LocalStorage keys
  STORAGE_KEYS: {
    NUMVERIFY_KEY: 'rlt_numverify_api_key',
    OPENCAGE_KEY: 'rlt_opencage_api_key',
    NOMINATIM_EMAIL: 'rlt_nominatim_email',
    SEARCH_HISTORY: 'rlt_search_history'
  },

  // API Endpoints
  ENDPOINTS: {
    // 1. Pincode Endpoints
    INDIA_POST_API: 'https://api.postalpincode.in/pincode/',
    ZIPPITY_API: 'https://api.zippopotam.us/',
    NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
    
    // 2. Phone Intelligence Endpoints
    NUMVERIFY_API: 'https://apilayer.net/api/validate',
    
    // 3. Geocoding / Reverse Geocoding
    NOMINATIM_REVERSE: 'https://nominatim.openstreetmap.org/reverse'
  },

  // Default Map Configuration
  MAP: {
    DEFAULT_CENTER: [20.5937, 78.9629], // Geographic center of India
    DEFAULT_ZOOM: 5,
    PINCODE_ZOOM: 13,
    PHONE_ZOOM: 8,
    DEVICE_ZOOM: 16,
    MAX_ZOOM: 19
  },

  // Get stored API key
  getNumverifyKey() {
    return localStorage.getItem(this.STORAGE_KEYS.NUMVERIFY_KEY) || '';
  },

  setNumverifyKey(key) {
    if (key) {
      localStorage.setItem(this.STORAGE_KEYS.NUMVERIFY_KEY, key.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.NUMVERIFY_KEY);
    }
  },

  getOpencageKey() {
    return localStorage.getItem(this.STORAGE_KEYS.OPENCAGE_KEY) || '';
  },

  setOpencageKey(key) {
    if (key) {
      localStorage.setItem(this.STORAGE_KEYS.OPENCAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.OPENCAGE_KEY);
    }
  },

  getNominatimEmail() {
    return localStorage.getItem(this.STORAGE_KEYS.NOMINATIM_EMAIL) || 'student.project@college.edu';
  },

  setNominatimEmail(email) {
    if (email) {
      localStorage.setItem(this.STORAGE_KEYS.NOMINATIM_EMAIL, email.trim());
    }
  },

  // Search History Helper
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEARCH_HISTORY)) || [];
    } catch (e) {
      return [];
    }
  },

  saveHistory(item) {
    try {
      let history = this.getHistory();
      // Remove duplicate if exists
      history = history.filter(h => !(h.type === item.type && h.query === item.query));
      // Prepend latest item
      history.unshift({
        ...item,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      // Keep only top 10
      if (history.length > 10) history = history.slice(0, 10);
      localStorage.setItem(this.STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save search history', e);
    }
  },

  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEYS.SEARCH_HISTORY);
  }
};
