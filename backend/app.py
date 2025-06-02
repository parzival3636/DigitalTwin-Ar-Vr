from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import requests
import socket

app = Flask(__name__)
CORS(app)

# PostgreSQL Connection URL with SSL mode
DATABASE_URL = "postgresql://postgres.tnoxaeipvbmjnmmjplnr:Pranil%40123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
WEATHER_API_KEY = "a59b5ab237a106ed50bd77e72964bca8"

# Fix DNS resolving issue
socket.getaddrinfo('localhost', 8080)

# Connect to PostgreSQL
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
except psycopg2.Error as e:
    print("❌ Database Connection Error:", e)

@app.route('/api/weather', methods=['POST'])
def weather_condition():
    try:
        data = request.json
        location = data.get('location')

        if not location:
            return jsonify({"error": "Location not provided"}), 400

        # Fetch Weather Data from OpenWeather API
        response = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch weather data"}), response.status_code

        weather_data = response.json()

        # Ensure the data contains the required fields
        if "weather" not in weather_data or "main" not in weather_data:
            return jsonify({"error": "Invalid weather data received"}), 500

        # Store in Supabase Database
        try:
            cur.execute("""
                INSERT INTO simulation_data (location, weather_condition, temperature)
                VALUES (%s, %s, %s);
            """, (location, weather_data["weather"][0]["main"], weather_data["main"]["temp"]))
            conn.commit()
        except psycopg2.Error as db_error:
            return jsonify({"error": "Database error", "details": str(db_error)}), 500

        return jsonify(weather_data)

    except psycopg2.Error as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
