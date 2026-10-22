/**
 * Core Application Controller
 * Handles Leaflet Map initialization, tile layers, UI state, tabs, and history
 */

const App = {
  map: null,
  baseLayers: {},
  currentLayer: null,

  init() {
    this.initMap();
    this.bindGlobalEvents();
    this.renderHistory();
    this.loadSettings();

    // Initialize individual feature modules
    PincodeTracker.init();
    PhoneTracker.init();
    DeviceTracker.init();

    console.log('Real-Time Location Tracker initialized successfully.');
  },

  initMap() {
    // Initialize Leaflet Map
    this.map = L.map('mapContainer', {
      center: CONFIG.MAP.DEFAULT_CENTER,
      zoom: CONFIG.MAP.DEFAULT_ZOOM,
      zoomControl: false // custom position
    });

    // 1. OpenStreetMap Standard
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // 2. CartoDB Dark Matter (Sleek Dark Theme)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    });

    // 3. Esri World Imagery (Satellite)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    });

    // Default to CartoDB Dark for modern aesthetic
    darkLayer.addTo(this.map);

    this.baseLayers = {
      'Dark Night': darkLayer,
      'OpenStreetMap': osmLayer,
      'Satellite View': satelliteLayer
    };

    // Add Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Layer Switcher
    L.control.layers(this.baseLayers, null, { position: 'topright' }).addTo(this.map);

    // Fix map render sizing if initialized inside tabs/containers
    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  },

  bindGlobalEvents() {
    // Recenter Map
    const recenterBtn = document.getElementById('mapRecenterBtn');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        this.map.flyTo(CONFIG.MAP.DEFAULT_CENTER, CONFIG.MAP.DEFAULT_ZOOM, { duration: 1.2 });
      });
    }

    // Clear Map Layers
    const clearMapBtn = document.getElementById('mapClearBtn');
    if (clearMapBtn) {
      clearMapBtn.addEventListener('click', () => {
        if (PincodeTracker.activeLayerGroup) PincodeTracker.activeLayerGroup.clearLayers();
        if (PhoneTracker.activeLayerGroup) PhoneTracker.activeLayerGroup.clearLayers();
        if (DeviceTracker.activeLayerGroup) DeviceTracker.activeLayerGroup.clearLayers();
        this.showToast('All markers cleared from map', 'info');
      });
    }

    // Settings Modal Save
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        const numverifyKey = document.getElementById('numverifyKeyInput').value;
        const opencageKey = document.getElementById('opencageKeyInput').value;
        const nominatimEmail = document.getElementById('nominatimEmailInput').value;

        CONFIG.setNumverifyKey(numverifyKey);
        CONFIG.setOpencageKey(opencageKey);
        CONFIG.setNominatimEmail(nominatimEmail);

        const modalEl = document.getElementById('settingsModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        this.showToast('API Configuration saved successfully!', 'success');
      });
    }

    // Clear History Button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        CONFIG.clearHistory();
        this.renderHistory();
        this.showToast('Search history cleared', 'info');
      });
    }

    // Refresh map layout on window resize
    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });

    // Invalidate map size when tabs switch
    document.querySelectorAll('button[data-bs-toggle="pill"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', () => {
        if (this.map) this.map.invalidateSize();
      });
    });
  },

  loadSettings() {
    const numverifyInput = document.getElementById('numverifyKeyInput');
    const opencageInput = document.getElementById('opencageKeyInput');
    const nominatimInput = document.getElementById('nominatimEmailInput');

    if (numverifyInput) numverifyInput.value = CONFIG.getNumverifyKey();
    if (opencageInput) opencageInput.value = CONFIG.getOpencageKey();
    if (nominatimInput) nominatimInput.value = CONFIG.getNominatimEmail();
  },

  renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    const history = CONFIG.getHistory();
    if (history.length === 0) {
      container.innerHTML = '<span class="text-muted small">No recent lookups</span>';
      return;
    }

    container.innerHTML = '';
    history.forEach(item => {
      const badge = document.createElement('div');
      badge.className = 'history-badge';
      const icon = item.type === 'PINCODE' ? 'fa-mail-bulk' : 'fa-phone';
      badge.innerHTML = `
        <i class="fas ${icon} text-info"></i>
        <span>${item.query}</span>
        <span class="text-muted small">(${item.label.split(',')[0]})</span>
      `;

      badge.addEventListener('click', () => {
        if (item.lat && item.lon) {
          this.map.flyTo([item.lat, item.lon], 12, { duration: 1.2 });
          this.showToast(`Centered on ${item.label}`, 'info');
        }
      });

      container.appendChild(badge);
    });
  },

  updateHud({ mode, coords, accuracy }) {
    if (mode) document.getElementById('hudMode').textContent = mode;
    if (coords) document.getElementById('hudCoords').textContent = coords;
    if (accuracy) document.getElementById('hudAccuracy').textContent = accuracy;
  },

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = `toast-${Date.now()}`;
    const bgClass = type === 'success' ? 'bg-success text-white' : 
                    type === 'warning' ? 'bg-warning text-dark' : 
                    type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white';

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <i class="fas fa-info-circle me-2"></i>${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3500 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
};

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
