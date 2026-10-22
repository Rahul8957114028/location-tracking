/**
 * Real-Time Device GPS Tracker Module
 * Handles HTML5 Geolocation API (watchPosition), path breadcrumb polyline,
 * GPS accuracy circle, speedometer HUD, and Viva Demo Simulation Mode.
 */

const DeviceTracker = {
  watchId: null,
  isTracking: false,
  isSimulating: false,
  simulationInterval: null,
  autoCenter: true,

  marker: null,
  accuracyCircle: null,
  pathPolyline: null,
  pathCoordinates: [],
  activeLayerGroup: null,

  init() {
    this.activeLayerGroup = L.layerGroup().addTo(App.map);
    this.bindEvents();
  },

  bindEvents() {
    const startBtn = document.getElementById('startTrackBtn');
    const stopBtn = document.getElementById('stopTrackBtn');
    const simBtn = document.getElementById('simulateTrackBtn');
    const clearPathBtn = document.getElementById('clearPathBtn');
    const autoCenterCheck = document.getElementById('autoCenterCheck');
    const exportGeoJsonBtn = document.getElementById('exportGeoJsonBtn');

    if (startBtn) startBtn.addEventListener('click', () => this.startLiveTracking());
    if (stopBtn) stopBtn.addEventListener('click', () => this.stopTracking());
    if (simBtn) simBtn.addEventListener('click', () => this.toggleSimulation());
    if (clearPathBtn) clearPathBtn.addEventListener('click', () => this.clearPath());
    if (autoCenterCheck) {
      autoCenterCheck.addEventListener('change', (e) => {
        this.autoCenter = e.target.checked;
      });
    }
    if (exportGeoJsonBtn) exportGeoJsonBtn.addEventListener('click', () => this.exportGeoJSON());
  },

  startLiveTracking() {
    if (this.isSimulating) {
      this.stopSimulation();
    }

    if (!('geolocation' in navigator)) {
      this.showError('Geolocation is not supported by your current browser.');
      return;
    }

    this.showError(''); // Clear error
    this.isTracking = true;
    this.updateControlsUI(true);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    // Begin real-time position stream
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => this.handleGeoError(err),
      geoOptions
    );

    App.showToast('Live GPS Tracking Started', 'info');
  },

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.isSimulating) {
      this.stopSimulation();
    }

    this.isTracking = false;
    this.updateControlsUI(false);
    App.showToast('Live Tracking Stopped', 'secondary');

    const statusBadge = document.getElementById('deviceStatusBadge');
    if (statusBadge) {
      statusBadge.className = 'badge bg-secondary';
      statusBadge.innerHTML = '<span class="status-dot inactive"></span>Inactive';
    }
  },

  handlePositionUpdate(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const accuracy = pos.coords.accuracy || 10; // in meters
    const speed = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0.0'; // km/h
    const altitude = pos.coords.altitude ? `${pos.coords.altitude.toFixed(1)} m` : 'N/A';
    const heading = pos.coords.heading ? `${pos.coords.heading.toFixed(0)}°` : 'N/A';
    const timestamp = new Date(pos.timestamp).toLocaleTimeString();

    const currentLatLng = [lat, lon];
    this.pathCoordinates.push(currentLatLng);

    // Update UI Elements
    this.updateDeviceStats(lat, lon, accuracy, speed, altitude, heading, timestamp);
    this.updateMapLayers(currentLatLng, accuracy);

    if (this.autoCenter) {
      App.map.panTo(currentLatLng);
    }
  },

  updateDeviceStats(lat, lon, accuracy, speed, altitude, heading, timestamp) {
    document.getElementById('devStatLat').textContent = lat.toFixed(5);
    document.getElementById('devStatLon').textContent = lon.toFixed(5);
    document.getElementById('devStatAccuracy').textContent = `±${accuracy.toFixed(1)} m`;
    document.getElementById('devStatSpeed').textContent = `${speed} km/h`;
    document.getElementById('devStatAltitude').textContent = altitude;
    document.getElementById('devStatHeading').textContent = heading;
    document.getElementById('devStatTime').textContent = timestamp;

    const statusBadge = document.getElementById('deviceStatusBadge');
    if (statusBadge) {
      statusBadge.className = 'badge bg-success';
      statusBadge.innerHTML = '<span class="status-dot active"></span>GPS Locked';
    }

    // Update global map HUD
    App.updateHud({
      mode: this.isSimulating ? 'Simulation Mode (Viva Demo)' : 'Device Live GPS Tracking',
      coords: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      accuracy: `±${accuracy.toFixed(1)} m | Speed: ${speed} km/h`
    });
  },

  updateMapLayers(latLng, accuracy) {
    // 1. Draw or Update Accuracy Circle
    if (!this.accuracyCircle) {
      this.accuracyCircle = L.circle(latLng, {
        radius: accuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1.5
      }).addTo(this.activeLayerGroup);
    } else {
      this.accuracyCircle.setLatLng(latLng);
      this.accuracyCircle.setRadius(accuracy);
    }

    // 2. Draw or Update Real-time Pulsing Radar Marker
    if (!this.marker) {
      const pulseIcon = L.divIcon({
        className: 'pulse-marker',
        html: '<div class="pulse-dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      this.marker = L.marker(latLng, { icon: pulseIcon }).addTo(this.activeLayerGroup);
      this.marker.bindPopup(`
        <div class="p-1">
          <div class="popup-title"><i class="fas fa-location-crosshairs text-primary me-1"></i>Live Device Location</div>
          <div class="popup-item"><strong>Status:</strong> Active Real-time GPS</div>
          <div class="popup-item"><strong>Lat/Lon:</strong> ${latLng[0].toFixed(5)}, ${latLng[1].toFixed(5)}</div>
          <div class="popup-item"><strong>GPS Accuracy:</strong> ±${accuracy.toFixed(1)} meters</div>
        </div>
      `);

      App.map.flyTo(latLng, CONFIG.MAP.DEVICE_ZOOM, { duration: 1.5 });
    } else {
      this.marker.setLatLng(latLng);
    }

    // 3. Draw or Update Path Polyline
    if (!this.pathPolyline) {
      this.pathPolyline = L.polyline(this.pathCoordinates, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '2, 6'
      }).addTo(this.activeLayerGroup);
    } else {
      this.pathPolyline.setLatLngs(this.pathCoordinates);
    }
  },

  handleGeoError(err) {
    console.warn('Geolocation error:', err);
    let msg = 'Failed to obtain live location.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        msg = 'Location permission was denied. Please allow location access in your browser.';
        break;
      case err.POSITION_UNAVAILABLE:
        msg = 'GPS signal unavailable. (Tip: Try the "Simulate Movement" mode for demo).';
        break;
      case err.TIMEOUT:
        msg = 'GPS location request timed out.';
        break;
    }
    this.showError(msg);
    this.stopTracking();
  },

  // --- VIVA DEMO SIMULATION MODE ---
  // Essential for showing live tracking in classroom/viva when sitting stationary
  toggleSimulation() {
    if (this.isSimulating) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  },

  startSimulation() {
    this.stopTracking();
    this.isSimulating = true;
    this.updateControlsUI(true);

    const simBtn = document.getElementById('simulateTrackBtn');
    if (simBtn) {
      simBtn.classList.remove('btn-outline-custom');
      simBtn.classList.add('btn-warning');
      simBtn.innerHTML = '<i class="fas fa-stop me-1"></i>Stop Simulation';
    }

    App.showToast('Viva Demo: Live Simulated Tracking Active', 'warning');

    // Starting seed coordinates (e.g., Connaught Place, New Delhi or current map center)
    const center = App.map.getCenter();
    let curLat = center.lat || 28.6304;
    let curLon = center.lng || 77.2177;
    let heading = 45;
    let stepCount = 0;

    // Run simulation loop every 1.5 seconds
    this.simulationInterval = setInterval(() => {
      stepCount++;
      // Simulate realistic road movement
      const dLat = (Math.sin(stepCount * 0.2) * 0.0003) + 0.0002;
      const dLon = (Math.cos(stepCount * 0.2) * 0.0003) + 0.0002;
      curLat += dLat;
      curLon += dLon;
      heading = (heading + (Math.random() * 20 - 10) + 360) % 360;

      const simSpeed = (35 + Math.sin(stepCount) * 12).toFixed(1); // 23 - 47 km/h
      const simAccuracy = (5 + Math.random() * 4); // 5 - 9 meters

      const simulatedPos = {
        coords: {
          latitude: curLat,
          longitude: curLon,
          accuracy: simAccuracy,
          speed: parseFloat(simSpeed) / 3.6,
          altitude: 215 + Math.sin(stepCount) * 5,
          heading: heading
        },
        timestamp: Date.now()
      };

      this.handlePositionUpdate(simulatedPos);
    }, 1500);
  },

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
    this.updateControlsUI(false);

    const simBtn = document.getElementById('simulateTrackBtn');
    if (simBtn) {
      simBtn.classList.remove('btn-warning');
      simBtn.classList.add('btn-outline-custom');
      simBtn.innerHTML = '<i class="fas fa-play me-1"></i>Simulate Movement (Viva Demo)';
    }

    const statusBadge = document.getElementById('deviceStatusBadge');
    if (statusBadge) {
      statusBadge.className = 'badge bg-secondary';
      statusBadge.innerHTML = '<span class="status-dot inactive"></span>Inactive';
    }
  },

  clearPath() {
    this.pathCoordinates = [];
    if (this.pathPolyline) {
      this.activeLayerGroup.removeLayer(this.pathPolyline);
      this.pathPolyline = null;
    }
    App.showToast('Breadcrumb track path cleared', 'info');
  },

  exportGeoJSON() {
    if (this.pathCoordinates.length === 0) {
      alert('No GPS path coordinates recorded yet to export.');
      return;
    }

    // Convert coordinates to GeoJSON format: [lon, lat]
    const geoJsonCoords = this.pathCoordinates.map(pt => [pt[1], pt[0]]);
    const geoJsonData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Recorded Real-Time GPS Track",
            device: "Browser HTML5 Geolocation",
            timestamp: new Date().toISOString(),
            pointsCount: this.pathCoordinates.length
          },
          geometry: {
            type: "LineString",
            coordinates: geoJsonCoords
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-track-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('GeoJSON path exported successfully!', 'success');
  },

  updateControlsUI(isLive) {
    const startBtn = document.getElementById('startTrackBtn');
    const stopBtn = document.getElementById('stopTrackBtn');

    if (startBtn && stopBtn) {
      startBtn.disabled = isLive;
      stopBtn.disabled = !isLive;
    }
  },

  showError(msg) {
    const errorContainer = document.getElementById('deviceError');
    if (msg) {
      errorContainer.textContent = msg;
      errorContainer.classList.remove('d-none');
    } else {
      errorContainer.classList.add('d-none');
      errorContainer.textContent = '';
    }
  }
};
