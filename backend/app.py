from flask import Flask, jsonify, request, Blueprint, send_from_directory
import decimal
import os
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider

# Import your modules
from db import create_tables_if_not_exist
from cognito import verify_jwt, ensure_user_exists

from routes.users import users_bp
from routes.properties import properties_bp
from routes.interests import interests_bp
from routes.matching import matching_bp
from routes.info import info_bp
from routes.auth import auth_bp
from routes.chat import chat_bp

HOUSES_PHOTOS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "HousesPhotos")
)

# ---------------- Decimal-safe JSON Provider ----------------
class DecimalSafeJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

# ---------------- Debug Blueprint ----------------
debug_bp = Blueprint("debug", __name__, url_prefix="/debug")

def get_users_table():
    class Table:
        name = "HousemateAppUsers"
        def scan(self, Limit=None):
            return {"Count": 0}
    return Table()

@debug_bp.route("/dynamodb", methods=["GET"])
def dynamodb_debug():
    table = get_users_table()
    result = table.scan(Limit=1)
    return jsonify({
        "dynamodb": "connected",
        "table": table.name,
        "sampleItemCount": result.get("Count", 0),
    })

# ---------------- App Factory ----------------
def create_app(testing=False):
    app = Flask(__name__)
    app.json_provider_class = DecimalSafeJSONProvider
    app.json = DecimalSafeJSONProvider(app)
    CORS(app)
    app.config["TESTING"] = testing

    # Register blueprints
    app.register_blueprint(users_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(interests_bp)
    app.register_blueprint(matching_bp)
    app.register_blueprint(info_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(debug_bp)

    # ---------------- Public Routes ----------------
    PUBLIC_ROUTES = {
        '/health',
        '/',
        '/api/animals',
        '/api/animals/<animal>/compatible',
        '/api/auth/signup',
        '/api/auth/confirm',
        '/api/auth/login',
        '/api/auth/refresh',
        '/debug/dynamodb'
    }

    def is_public_route(path):
        if path in PUBLIC_ROUTES:
            return True
        if path.startswith('/api/animals/') and path.endswith('/compatible'):
            return True
        if path.startswith('/api/images/'):
            return True
        return False

    @app.before_request
    def authenticate():
        if is_public_route(request.path) or request.method == 'OPTIONS':
            return None

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        user_record = ensure_user_exists(payload)
        if not user_record:
            return jsonify({"error": "User sync failed"}), 500

        request.user = user_record

    # ---------------- Health & Home Routes ----------------
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
                "chat": "/api/chat/interest/<interestId>/messages",
                "info": "/api/animals",
            },
        }), 200

    @app.route("/api/images/<path:filename>", methods=["GET"])
    def serve_house_image(filename):
        # Prevent path traversal outside HousesPhotos directory.
        safe_filename = os.path.basename(filename)
        return send_from_directory(HOUSES_PHOTOS_DIR, safe_filename)

    # ---------------- Create Tables (skip if testing) ----------------
    if not testing:
        create_tables_if_not_exist()

    return app

# ---------------- Run App ----------------
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5001)
