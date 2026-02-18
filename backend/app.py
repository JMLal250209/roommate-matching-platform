from flask import Flask, jsonify, request
import decimal
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
from db import create_tables_if_not_exist
from cognito import verify_jwt, ensure_user_exists

# Import blueprints
from routes.users import users_bp
from routes.properties import properties_bp
from routes.interests import interests_bp
from routes.matching import matching_bp
from routes.info import info_bp
from routes.auth import auth_bp



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

# Define public routes that don't require authentication
PUBLIC_ROUTES = {
    '/health',
    '/',
    '/api/animals',
    '/api/animals/<animal>/compatible',
    '/api/auth/signup',
    '/api/auth/confirm',
    '/api/auth/login',
    '/api/auth/refresh'
}

def is_public_route(path):
    """Check if a route is public"""
    if path in PUBLIC_ROUTES:
        return True
    # Check for dynamic routes
    if path.startswith('/api/animals/') and path.endswith('/compatible'):
        return True
    return False


@app.before_request
def authenticate():
    """
    Global authentication middleware
    Protects all routes except those in PUBLIC_ROUTES
    """
    # Skip authentication for public routes
    if is_public_route(request.path):
        return None
    
    # Skip authentication for OPTIONS requests (CORS preflight)
    if request.method == 'OPTIONS':
        return None
    
    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    # Extract and verify token
    token = auth_header.split(" ")[1]
    payload = verify_jwt(token)
    
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    # Sync user with DynamoDB (auto-creates if needed)
    user_record = ensure_user_exists(payload)
    
    if not user_record:
        return jsonify({"error": "User sync failed"}), 500
    
    # Store user in request context
    request.user = user_record


# Register blueprints
app.register_blueprint(users_bp)
app.register_blueprint(properties_bp)
app.register_blueprint(interests_bp)
app.register_blueprint(matching_bp)
app.register_blueprint(info_bp)
app.register_blueprint(auth_bp)

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
            "auth": "/api/auth/me",
            "users": "/api/users",
            "properties": "/api/properties",
            "interests": "/api/interests",
            "matching": "/api/match",
            "info": "/api/animals",
        },
    }), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)