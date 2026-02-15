<<<<<<< HEAD
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from datetime import datetime, timezone

import jwt
import requests
import boto3
from botocore.exceptions import ClientError
from db import get_users_table, create_user, list_users, create_table_if_not_exists

=======
from flask import Flask, jsonify
from flask_cors import CORS
from db import create_tables_if_not_exist

# Import blueprints
from routes.users import users_bp
from routes.properties import properties_bp
from routes.interests import interests_bp
from routes.matching import matching_bp
from routes.info import info_bp
>>>>>>> origin/main

app = Flask(__name__)
CORS(app)

<<<<<<< HEAD
# ====== Cognito configuration ======
COGNITO_REGION = "eu-west-1"
COGNITO_USER_POOL_ID = "eu-west-1_VD22hpVPA"
COGNITO_APP_CLIENT_ID = "6blkd9ld1fb05ulmj8p8s5g9tb"  # Audience (aud) to validate
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Cache JWKS to avoid fetching on every request
def _load_jwks():
    try:
        return requests.get(COGNITO_JWKS_URL, timeout=5).json()
    except Exception as e:
        print("Failed to load JWKS:", e)
        return {"keys": []}

_jwks = _load_jwks()

def verify_jwt(token):
    """
    Verify a Cognito-issued JWT using the User Pool JWKS.
    Validates:
      - signature (RS256)
      - issuer (iss)
      - audience (aud) == App Client ID
      - expiration (exp)
    Returns decoded payload dict on success, otherwise None.
    """
    global _jwks
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            return None

        # Find the matching key; if not found, refresh JWKS once
        key = next((k for k in _jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            _jwks = _load_jwks()
            key = next((k for k in _jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key:
                return None

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={"require": ["exp", "iss", "aud"]},
        )
        return payload
    except Exception as e:
        print("JWT verification failed:", e)
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = verify_jwt(token)

        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.user = payload
        return f(*args, **kwargs)
    return decorated

# ===== DynamoDB configuration =====
# Stores user profile + preferences. Passwords are NOT stored here; Cognito manages credentials securely.
DDB_REGION = COGNITO_REGION
DDB_TABLE_NAME = "UserProfiles"

_ddb = boto3.resource("dynamodb", region_name=DDB_REGION)
_ddb_table = _ddb.Table(DDB_TABLE_NAME)

def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

def ddb_get_user(user_id: str):
    try:
        resp = _ddb_table.get_item(Key={"userId": user_id})
        return resp.get("Item")
    except ClientError as e:
        print("DynamoDB get_item failed:", e)
        return None

def ddb_upsert_user(user_id: str, email: str):
    """
    Create the user record if it doesn't exist. If it exists, keep existing preferences.
    """
    existing = ddb_get_user(user_id)
    if existing:
        # Ensure email is up to date, but keep preferences
        try:
            _ddb_table.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET email = :e, updatedAt = :u",
                ExpressionAttributeValues={":e": email, ":u": _utc_now_iso()},
            )
        except ClientError as e:
            print("DynamoDB update_item failed:", e)
        return ddb_get_user(user_id)

    item = {
        "userId": user_id,
        "email": email,
        "preferences": {},
        "createdAt": _utc_now_iso(),
        "updatedAt": _utc_now_iso(),
    }
    try:
        _ddb_table.put_item(Item=item)
        return item
    except ClientError as e:
        print("DynamoDB put_item failed:", e)
        return None

def ddb_set_preferences(user_id: str, preferences: dict):
    try:
        _ddb_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET preferences = :p, updatedAt = :u",
            ExpressionAttributeValues={":p": preferences, ":u": _utc_now_iso()},
            ReturnValues="ALL_NEW",
        )
        return ddb_get_user(user_id)
    except ClientError as e:
        print("DynamoDB update preferences failed:", e)
        return None

# Mock data source - list of users
users = [
    {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "created_at": "2024-01-15T10:30:00"
    },
    {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "created_at": "2024-01-16T14:20:00"
    },
    {
        "id": 3,
        "name": "Bob Johnson",
        "email": "bob.johnson@example.com",
        "created_at": "2024-01-17T09:15:00"
    }
]

# Counter for generating new user IDs
next_user_id = 4


@app.route('/api/users', methods=['GET'])
def get_users():
    """
    GET endpoint to return a list of all users
    Returns: JSON array of user objects
    """
    return jsonify({
        "success": True,
        "data": users,
        "count": len(users)
    }), 200


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    GET endpoint to return a specific user by ID
    Returns: JSON object of the user or error message
    """
    user = next((user for user in users if user['id'] == user_id), None)
    
    if user:
        return jsonify({
            "success": True,
            "data": user
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404


@app.route('/api/users', methods=['POST'])
def add_user():
    """
    POST endpoint to add a new user
    Expected JSON body: {"name": "string", "email": "string"}
    Returns: JSON object of the created user
    """
    global next_user_id
    
    # Get JSON data from request
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400
    
    if 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields: name and email"
        }), 400
    
    # Create new user object
    new_user = {
        "id": next_user_id,
        "name": data['name'],
        "email": data['email'],
        "created_at": datetime.now().isoformat()
    }
    
    # Add to mock data source
    users.append(new_user)
    next_user_id += 1
    
    return jsonify({
        "success": True,
        "message": "User created successfully",
        "data": new_user
    }), 201


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    DELETE endpoint to remove a user by ID (bonus endpoint)
    Returns: Success message or error
    """
    global users
    
    user = next((user for user in users if user['id'] == user_id), None)
    
    if user:
        users = [u for u in users if u['id'] != user_id]
        return jsonify({
            "success": True,
            "message": f"User with ID {user_id} deleted successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    PUT endpoint to update a user by ID (bonus endpoint)
    Expected JSON body: {"name": "string", "email": "string"}
    Returns: Updated user object or error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400
    
    user = next((user for user in users if user['id'] == user_id), None)
    
    if user:
        # Update fields if provided
        if 'name' in data:
            user['name'] = data['name']
        if 'email' in data:
            user['email'] = data['email']
        
        return jsonify({
            "success": True,
            "message": "User updated successfully",
            "data": user
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404

@app.route('/health')
=======
# Register blueprints
app.register_blueprint(users_bp)
app.register_blueprint(properties_bp)
app.register_blueprint(interests_bp)
app.register_blueprint(matching_bp)
app.register_blueprint(info_bp)

# Ensure tables exist at startup
create_tables_if_not_exist()


@app.route("/health", methods=["GET"])
>>>>>>> origin/main
def health():
    return jsonify({"status": "ok", "message": "Housemate matching API is running"}), 200


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Housemate Matching API",
        "version": "1.0",
        "endpoints": {
<<<<<<< HEAD
            "GET /api/users": "Get all users",
            "GET /api/users/<id>": "Get user by ID",
            "POST /api/users": "Create new user (body: {name, email})",
            "PUT /api/users/<id>": "Update user by ID (body: {name, email})",
            "DELETE /api/users/<id>": "Delete user by ID"
=======
            "users": "/api/users",
            "properties": "/api/properties",
            "interests": "/api/interests",
            "matching": "/api/match",
            "info": "/api/animals"
>>>>>>> origin/main
        }
    }), 200


<<<<<<< HEAD
# ===== Protected Endpoint (Cognito JWT required) =====
@app.route("/api/me", methods=["GET"])
@login_required
def get_me():
    user = request.user
    return jsonify({
        "success": True,
        "user": {
            "user_id": user.get("sub"),
            "email": user.get("email"),
            "issuer": user.get("iss")
        }
    }), 200


# ===== User Profile & Preferences Endpoints (Protected) =====
@app.route("/api/me/init", methods=["POST"])
@login_required
def init_me():
    """
    Initialize (or upsert) the user record in DynamoDB after a successful Cognito login.
    """
    user = request.user
    user_id = user.get("sub")
    email = user.get("email")

    if not user_id:
        return jsonify({"success": False, "error": "Missing sub in token"}), 400

    record = ddb_upsert_user(user_id, email or "")
    if not record:
        return jsonify({"success": False, "error": "Failed to write user to DynamoDB"}), 500

    return jsonify({"success": True, "data": record}), 200


@app.route("/api/me/preferences", methods=["GET"])
@login_required
def get_preferences():
    """
    Return the authenticated user's preferences from DynamoDB.
    """
    user = request.user
    user_id = user.get("sub")

    if not user_id:
        return jsonify({"success": False, "error": "Missing sub in token"}), 400

    record = ddb_get_user(user_id)
    if not record:
        # If no record yet, create one automatically
        record = ddb_upsert_user(user_id, user.get("email") or "")
        if not record:
            return jsonify({"success": False, "error": "Failed to create user record"}), 500

    return jsonify({"success": True, "data": record.get("preferences", {})}), 200


@app.route("/api/me/preferences", methods=["PUT"])
@login_required
def update_preferences():
    """
    Update the authenticated user's preferences in DynamoDB.
    Expected JSON body: { ... } (any JSON object)
    """
    user = request.user
    user_id = user.get("sub")

    if not user_id:
        return jsonify({"success": False, "error": "Missing sub in token"}), 400

    data = request.get_json()
    if data is None or not isinstance(data, dict):
        return jsonify({"success": False, "error": "Body must be a JSON object"}), 400

    # Ensure user exists
    existing = ddb_get_user(user_id)
    if not existing:
        created = ddb_upsert_user(user_id, user.get("email") or "")
        if not created:
            return jsonify({"success": False, "error": "Failed to create user record"}), 500

    updated = ddb_set_preferences(user_id, data)
    if not updated:
        return jsonify({"success": False, "error": "Failed to update preferences"}), 500

    return jsonify({"success": True, "data": updated.get("preferences", {})}), 200

@app.route("/auth/test", methods=["POST"])
def auth_test():
    data = request.json
    id_token = data.get("id_token")

    if not id_token:
        return {"error": "missing id_token"}, 400

    try:
        payload = verify_jwt(id_token)
        return {
            "message": "token valid",
            "user": payload["sub"],
            "email": payload.get("email")
        }
    except Exception as e:
        return {"error": str(e)}, 401

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
=======
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
>>>>>>> origin/main
