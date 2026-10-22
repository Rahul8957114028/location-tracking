"""
GeoTrack Pro - Python Flask Backend Server
Alternative backend implementation for College Mini-Project Viva demonstration.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
import os
import datetime

app = Flask(__name__, static_folder="../")
CORS(app)

# In-Memory device store
active_sessions = {}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "OK",
        "server": "GeoTrack Pro Python Flask Backend",
        "timestamp": datetime.datetime.now().isoformat(),
        "activeSessions": len(active_sessions)
    })

@app.route('/api/pincode/<pincode>', methods=['GET'])
def get_pincode(pincode):
    try:
        # Query Indian Postal API
        postal_res = requests.get(f"https://api.postalpincode.in/pincode/{pincode}", timeout=10)
        postal_data = postal_res.json()

        if not postal_data or postal_data[0].get('Status') != 'Success':
            return jsonify({"error": "No records found for PIN code"}), 404

        post_offices = postal_data[0]['PostOffice']
        district = post_offices[0]['District']
        state = post_offices[0]['State']

        # Geocode using OpenStreetMap Nominatim
        geo_url = f"https://nominatim.openstreetmap.org/search?q={pincode},{district},{state},India&format=json&limit=1"
        geo_res = requests.get(geo_url, headers={"User-Agent": "GeoTrack-Python/1.0"}, timeout=10)
        geo_data = geo_res.json()

        coords = {"lat": 20.5937, "lon": 78.9629}
        if geo_data:
            coords = {
                "lat": float(geo_data[0]['lat']),
                "lon": float(geo_data[0]['lon']),
                "displayName": geo_data[0]['display_name']
            }

        return jsonify({
            "pincode": pincode,
            "district": district,
            "state": state,
            "coordinates": coords,
            "postOfficesCount": len(post_offices),
            "postOffices": post_offices
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/phone/<number>', methods=['GET'])
def get_phone(number):
    api_key = os.getenv("NUMVERIFY_API_KEY")
    if api_key:
        try:
            url = f"http://apilayer.net/api/validate?access_key={api_key}&number={number}&format=1"
            res = requests.get(url, timeout=10)
            return jsonify(res.json())
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # Fallback response
    return jsonify({
        "valid": True,
        "number": number,
        "country_name": "India",
        "carrier": "Reliance Jio / Bharti Airtel",
        "line_type": "mobile",
        "note": "Processed by Python Flask backend"
    })

@app.route('/api/device/ping', methods=['POST'])
def device_ping():
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    if not session_id:
        return jsonify({"error": "Missing sessionId"}), 400

    active_sessions[session_id] = {
        "lat": data.get('lat'),
        "lon": data.get('lon'),
        "accuracy": data.get('accuracy'),
        "speed": data.get('speed'),
        "updatedAt": datetime.datetime.now().isoformat()
    }
    return jsonify({"success": True, "message": "Telemetry updated"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🔥 Flask GeoTrack Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
