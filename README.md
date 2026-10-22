# 🛰️ GeoTrack Pro - Real-Time Location & Telecom Intelligence System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-7952b3.svg)](https://getbootstrap.com/)
[![Leaflet.js](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-Flask-blue.svg)](https://flask.palletsprojects.com/)

A modern, full-stack geospatial tracking and telecom intelligence web application built for college engineering mini-projects, viva examinations, and portfolio showcases.

---

## 🌟 Key Features

1. 📍 **Pincode / Postal Code Locator**:
   - Indian & International postal code search (6-digit PIN codes & global codes).
   - Retrieves District, State, Post Office branches, Delivery Status, and Circle.
   - Forward Geocoding using OpenStreetMap Nominatim to pinpoint exact coordinates on the map with smooth fly-to animations.

2. 📱 **Phone Number Intelligence & Telecom Circle Locator**:
   - Analyzes phone numbers with country code normalization.
   - Detects Carrier (Reliance Jio, Bharti Airtel, Vodafone Idea, BSNL, etc.).
   - Identifies Telecom Circle / State jurisdiction and Line Type (Mobile, Landline, VOIP).
   - Displays telecom coverage radius on map with educational notes explaining **HLR/VLR vs GPS tracking**.
   - Optional API Key integration with **Numverify API**.

3. 🛰️ **Real-Time Device GPS Tracking**:
   - Continuous device location tracking using W3C `navigator.geolocation.watchPosition()`.
   - Live telemetry: Latitude, Longitude, Accuracy (± meters), Speed (km/h), Altitude, Heading, and Timestamp.
   - Dynamic pulsing radar marker and expanding/contracting GPS accuracy circle.
   - Live breadcrumb polyline drawing the exact route traveled.
   - **Viva Simulation Mode**: Essential for classroom/viva presentations when sitting stationary at a desk. Simulates realistic vehicle/pedestrian route movement with live telemetry!
   - Export recorded GPS track path as standard **GeoJSON**.

4. 🗺️ **Multi-Layer Interactive Map (Leaflet.js)**:
   - 3 Tile Layers: **CartoDB Dark Matter**, **OpenStreetMap Standard**, and **Esri World Satellite**.
   - Custom markers, popups, auto-center toggle, and layer management.

5. 🎓 **Built-in Viva & College Mini-Project Defense Guide**:
   - Integrated tab and modal with architecture diagrams and 35+ examiner viva questions.

---

## 🏗️ Architecture & Technology Stack

```
+-------------------------------------------------------------------------+
|                           CLIENT (Browser UI)                           |
|  - HTML5 (Geolocation API, Semantic Tags)                               |
|  - CSS3 (Custom Glassmorphism, Dark Mode, Pulse Animations)             |
|  - Bootstrap 5.3 (Responsive Grid, Modals, Tabs, Forms)                |
|  - Leaflet.js 1.9.4 (Interactive Mapping & Geospatial Rendering)        |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------------+             +-----------------------------+
|    Direct Public APIs       |             |   Optional Backend Server   |
|  - India Post API           |             |  - Node.js Express          |
|  - OpenStreetMap Nominatim  |             |  - Python Flask             |
|  - Zippopotam (Global)      |             |  - API Key Masking & CORS   |
|  - Client Telecom Database  |             |  - Multi-Device Sync Store  |
+-----------------------------+             +-----------------------------+
```

---

## 📁 Project Directory Structure

```
Realtime-Location-Tracker/
├── index.html                   # Main Dashboard UI
├── .gitignore                   # Git Ignore configuration
├── .env.example                 # Environment variables template
├── README.md                    # Project documentation
├── VIVA_QUESTIONS_AND_ANSWERS.md# 35+ University Viva Q&A Guide
├── css/
│   └── style.css                # Custom glassmorphism, animations & styles
├── js/
│   ├── app.js                   # Application controller & map initialization
│   ├── config.js                # Endpoints, settings, and LocalStorage manager
│   ├── pincode-tracker.js       # Pincode lookup, postal records & geocoding
│   ├── phone-tracker.js         # Phone number intelligence & telecom circle
│   └── device-tracker.js        # HTML5 real-time GPS tracking & Viva simulation
└── backend/
    ├── server.js                # Node.js Express proxy server
    ├── app.py                   # Python Flask alternative server
    ├── package.json             # Node dependencies
    └── requirements.txt         # Python dependencies
```

---

## 🚀 Quick Start Guide

### Option 1: Standalone Frontend (Zero Installation Required)
You can run this project **immediately** without installing any tools or servers!
1. Simply double-click **`index.html`** in your file explorer to open it in Chrome, Edge, or Firefox.
2. Or use the VS Code extension **Live Server** (Right click `index.html` -> "Open with Live Server").

### Option 2: Deploy to GitHub Pages (Free Hosting)
1. Push this repository to GitHub.
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment**, select branch `main` and folder `/ (root)`.
4. Click **Save**. Your project will be live at `https://<your-username>.github.io/<repo-name>/`!

### Option 3: Run with Node.js Express Backend
If you want to demonstrate the backend server in viva:
```bash
cd backend
npm install
npm start
```
The server will start at `http://localhost:3000`.

### Option 4: Run with Python Flask Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
The Flask server will start at `http://127.0.0.1:5000`.

---

## 🔑 API Keys & Configuration (Optional)

The application includes built-in public endpoints and fallback algorithms, so it runs **100% functional out-of-the-box**. 

If you want to link your own API keys:
1. Open the web app.
2. Click **API Settings** in the top navigation bar.
3. Enter your optional keys:
   - **Numverify API Key**: Get a free key at [numverify.com](https://numverify.com).
   - **OpenCage API Key**: Get a free key at [opencagedata.com](https://opencagedata.com).
4. Click **Save Configuration**. Keys are securely stored in your browser's `localStorage`.

---

## 🎓 College Viva Preparation Guide

For in-depth viva questions, diagrams, and examiner answers, open [`VIVA_QUESTIONS_AND_ANSWERS.md`](./VIVA_QUESTIONS_AND_ANSWERS.md) or click the **Viva Preparation Guide** button inside the running application.

### The Most Common Examiner Question:
> **Examiner:** *"Can your application track the live GPS location of someone else's mobile phone just by entering their phone number?"*
> 
> **Correct Answer:** *"No, sir/ma'am. Legally and technically, no civilian web application can obtain real-time GPS coordinates of an external device just by typing a mobile number. Under telecommunications privacy regulations (TRAI in India, FCC in the US, and Section 5(2) of the Indian Telegraph Act), live cellular tracking is restricted to law enforcement with lawful intercept warrants. Our system extracts Telecom Circle (HLR/VLR) jurisdiction and carrier routing information. Real-time GPS tracking requires on-device GPS hardware consent via the HTML5 Geolocation API, as demonstrated in our Live Device tab."*

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
