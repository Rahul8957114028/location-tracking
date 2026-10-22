/**
 * Pincode / Postal Code Location Tracker Module
 * Handles postal code lookup, district/state data retrieval & geocoding
 */

const PincodeTracker = {
  activeMarker: null,
  activeLayerGroup: null,

  init() {
    this.activeLayerGroup = L.layerGroup().addTo(App.map);
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('pincodeForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Quick sample pincode chips click
    document.querySelectorAll('.pincode-sample-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pin = e.target.getAttribute('data-pin');
        const input = document.getElementById('pincodeInput');
        if (input && pin) {
          input.value = pin;
          this.handleSearch();
        }
      });
    });
  },

  async handleSearch() {
    const input = document.getElementById('pincodeInput');
    const pincode = input.value.trim();
    const country = document.getElementById('pincodeCountry').value || 'IN';
    const resultContainer = document.getElementById('pincodeResults');
    const errorContainer = document.getElementById('pincodeError');

    // Reset UI
    resultContainer.classList.add('d-none');
    errorContainer.classList.add('d-none');
    errorContainer.textContent = '';

    if (!pincode) {
      this.showError('Please enter a valid postal code / PIN code.');
      return;
    }

    // Validate 6 digits for India
    if (country === 'IN' && !/^\d{6}$/.test(pincode)) {
      this.showError('Invalid PIN code format. Indian PIN codes must be exactly 6 digits.');
      return;
    }

    const searchBtn = document.getElementById('pincodeSearchBtn');
    const originalText = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Searching...';

    try {
      let postalData = null;
      let coordinates = null;

      if (country === 'IN') {
        // 1. Fetch Indian Postal Data
        const res = await fetch(`${CONFIG.ENDPOINTS.INDIA_POST_API}${pincode}`);
        if (!res.ok) throw new Error('Postal API service unavailable.');
        const json = await res.json();

        if (json && json[0] && json[0].Status === 'Success' && json[0].PostOffice && json[0].PostOffice.length > 0) {
          postalData = json[0].PostOffice;
        } else {
          throw new Error(`No postal records found for PIN code: ${pincode}`);
        }

        // 2. Geocode to obtain Lat / Lng coordinates using Nominatim
        coordinates = await this.geocodePincode(pincode, postalData[0].District, postalData[0].State);
      } else {
        // International Postal Code Lookup via Zippopotam
        const res = await fetch(`${CONFIG.ENDPOINTS.ZIPPITY_API}${country.toLowerCase()}/${pincode}`);
        if (!res.ok) throw new Error(`Postal code not found for country: ${country}`);
        const data = await res.json();
        
        if (data && data.places && data.places.length > 0) {
          const place = data.places[0];
          postalData = [{
            Name: place['place name'],
            District: place['state'],
            State: data['country'],
            BranchType: 'City / Region',
            DeliveryStatus: 'Standard'
          }];
          coordinates = {
            lat: parseFloat(place.latitude),
            lon: parseFloat(place.longitude),
            displayName: `${place['place name']}, ${place['state']}, ${data['country']}`
          };
        } else {
          throw new Error('International postal details not found.');
        }
      }

      if (!coordinates) {
        throw new Error('Coordinates could not be mapped for this postal area.');
      }

      // Display results on UI and Map
      this.displayResults(pincode, postalData, coordinates);
      this.plotOnMap(coordinates, pincode, postalData[0]);

      // Save to recent search history
      CONFIG.saveHistory({
        type: 'PINCODE',
        query: pincode,
        label: `${postalData[0].District || postalData[0].Name}, ${postalData[0].State}`,
        lat: coordinates.lat,
        lon: coordinates.lon
      });
      App.renderHistory();

    } catch (err) {
      console.error('Pincode search error:', err);
      this.showError(err.message || 'Failed to fetch location for this PIN code.');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = originalText;
    }
  },

  async geocodePincode(pincode, district, state) {
    // Strategy 1: Nominatim query with pincode + country
    try {
      const email = encodeURIComponent(CONFIG.getNominatimEmail());
      const query = encodeURIComponent(`${pincode}, ${district}, ${state}, India`);
      const url = `${CONFIG.ENDPOINTS.NOMINATIM_SEARCH}?q=${query}&format=json&limit=1&email=${email}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name
          };
        }
      }
    } catch (e) {
      console.warn('Nominatim detailed query failed, trying postalcode fallback:', e);
    }

    // Strategy 2: Direct postalcode parameter
    try {
      const url = `${CONFIG.ENDPOINTS.NOMINATIM_SEARCH}?postalcode=${pincode}&country=in&format=json&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name
          };
        }
      }
    } catch (e) {
      console.warn('Nominatim postalcode query fallback failed:', e);
    }

    // Strategy 3: District & State geocode fallback
    try {
      const query = encodeURIComponent(`${district}, ${state}, India`);
      const url = `${CONFIG.ENDPOINTS.NOMINATIM_SEARCH}?q=${query}&format=json&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: `${district}, ${state} (District Level Fallback)`
          };
        }
      }
    } catch (e) {
      console.error('All geocoding fallbacks failed:', e);
    }

    return null;
  },

  displayResults(pincode, postOffices, coords) {
    const primary = postOffices[0];
    const container = document.getElementById('pincodeResults');

    // Populate stat cards
    document.getElementById('pinStatCode').textContent = pincode;
    document.getElementById('pinStatDistrict').textContent = primary.District || 'N/A';
    document.getElementById('pinStatState').textContent = primary.State || 'N/A';
    document.getElementById('pinStatCoords').textContent = `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
    document.getElementById('pinStatCount').textContent = postOffices.length;

    // Populate post office table
    const tbody = document.getElementById('pincodeTableBody');
    tbody.innerHTML = '';

    postOffices.forEach((po, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-semibold">${po.Name}</td>
        <td><span class="badge bg-secondary">${po.BranchType || 'Sub Post'}</span></td>
        <td>
          <span class="badge ${po.DeliveryStatus === 'Delivery' ? 'bg-success' : 'bg-warning'}">
            ${po.DeliveryStatus || 'Available'}
          </span>
        </td>
        <td class="text-muted small">${po.Circle || primary.State}</td>
      `;
      tbody.appendChild(tr);
    });

    container.classList.remove('d-none');

    // Update global top HUD
    App.updateHud({
      mode: 'Pincode Locator',
      coords: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
      accuracy: 'High (Geocoded Postcode)'
    });
  },

  plotOnMap(coords, pincode, primary) {
    this.activeLayerGroup.clearLayers();

    // Custom Icon for Pincode Marker
    const icon = L.divIcon({
      className: 'custom-pincode-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <i class="fas fa-mail-bulk" style="transform: rotate(45deg); color: #fff; font-size: 15px;"></i>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });

    this.activeMarker = L.marker([coords.lat, coords.lon], { icon: icon }).addTo(this.activeLayerGroup);

    const popupHtml = `
      <div class="p-1">
        <div class="popup-title"><i class="fas fa-map-marker-alt text-danger me-1"></i>PIN: ${pincode}</div>
        <div class="popup-item"><strong>Area:</strong> ${primary.Name}</div>
        <div class="popup-item"><strong>District:</strong> ${primary.District}</div>
        <div class="popup-item"><strong>State:</strong> ${primary.State}</div>
        <div class="popup-item text-muted small mt-1">Lat: ${coords.lat.toFixed(5)}, Lon: ${coords.lon.toFixed(5)}</div>
      </div>
    `;

    this.activeMarker.bindPopup(popupHtml).openPopup();

    // Smooth camera fly
    App.map.flyTo([coords.lat, coords.lon], CONFIG.MAP.PINCODE_ZOOM, {
      duration: 1.5
    });
  },

  showError(msg) {
    const errorContainer = document.getElementById('pincodeError');
    errorContainer.textContent = msg;
    errorContainer.classList.remove('d-none');
  }
};
