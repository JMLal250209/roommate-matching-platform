import decimal
from flask import Flask, jsonify
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
from db import create_tables_if_not_exist

# Import blueprints
from routes.users import users_bp
from routes.properties import properties_bp
from routes.interests import interests_bp
from routes.matching import matching_bp
from routes.info import info_bp


# ---------------------------------------------------------------------------
# Decimal-safe JSON provider
# ---------------------------------------------------------------------------
# DynamoDB returns all numbers as decimal.Decimal. Even though db.py now
# deserializes them at the source, this app-wide encoder acts as a safety net
# so any route that forgets to deserialize won't crash with a 500 error.

class DecimalSafeJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
app.json_provider_class = DecimalSafeJSONProvider  # ✅ Flask 2.2+
app.json = DecimalSafeJSONProvider(app)

CORS(app)

# Register blueprints
app.register_blueprint(users_bp)
app.register_blueprint(properties_bp)
app.register_blueprint(interests_bp)
app.register_blueprint(matching_bp)
app.register_blueprint(info_bp)

# Ensure tables exist at startup
create_tables_if_not_exist()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Housemate matching API is running"}), 200


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Housemate Matching API",
        "version": "1.0",
        "endpoints": {
            "users": "/api/users",
            "properties": "/api/properties",
            "interests": "/api/interests",
            "matching": "/api/match",
            "info": "/api/animals",
        },
    }), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)