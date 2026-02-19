import requests
import jwt
from functools import wraps
from flask import request, jsonify
from jwt.algorithms import RSAAlgorithm
from datetime import datetime

from db import get_users_table

# ==============================
# COGNITO CONFIG
# ==============================

COGNITO_REGION = "eu-west-1"
COGNITO_USER_POOL_ID = "eu-west-1_VD22hpVPA"
COGNITO_APP_CLIENT_ID = "6blkd9ld1fb05ulmj8p8s5g9tb"

COGNITO_ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
)
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Cache JWKS
_jwks = None


def load_jwks():
    """Load JWKS from Cognito with error handling"""
    global _jwks
    if not _jwks:
        try:
            response = requests.get(COGNITO_JWKS_URL, timeout=5)
            response.raise_for_status()
            _jwks = response.json()
        except requests.RequestException as e:
            print(f"Failed to load JWKS: {e}")
            raise
    return _jwks


# ==============================
# JWT VERIFICATION
# ==============================

def verify_jwt(token):
    """Verify JWT token from Cognito"""
    try:
        jwks = load_jwks()

        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header["kid"]

        key = next(k for k in jwks["keys"] if k["kid"] == kid)
        public_key = RSAAlgorithm.from_jwk(key)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=COGNITO_ISSUER,
        )

        return payload

    except Exception as e:
        print(f"JWT verification failed: {type(e).__name__}")
        return None


# ==============================
# AUTO USER SYNC WITH DYNAMODB
# ==============================

def ensure_user_exists(cognito_payload):
    """
    Uses Cognito sub as userId.
    Creates user in HousemateAppUsers if not exists.
    """
    users_table = get_users_table()

    user_id = cognito_payload.get("sub")
    email = cognito_payload.get("email")
    name = cognito_payload.get("name", "")

    if not user_id:
        return None

    existing = users_table.get_item(Key={"userId": user_id}).get("Item")

    if existing:
        return existing

    # Create minimal user record (use Cognito sub as userId)
    new_user = {
        "userId": user_id,
        "email": email,
        "name": name,
        "profile": {},
        "animal_archetype": None,
        "createdAt": datetime.utcnow().isoformat(),
    }

    users_table.put_item(Item=new_user)
    return new_user


# ==============================
# DECORATOR
# ==============================

def login_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = verify_jwt(token)

        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Sync user with DynamoDB
        user_record = ensure_user_exists(payload)

        if not user_record:
            return jsonify({"error": "User sync failed"}), 500

        request.user = user_record
        return f(*args, **kwargs)

    return decorated