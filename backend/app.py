from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone

from db import (
    create_table_if_not_exists,
    get_users_table,
    create_user,
    list_users,
    get_interests_table,
    register_property_interest,
    get_user_interests,
    get_pending_interests_for_property,
    update_interest_status,
)

app = Flask(__name__)
CORS(app)

# Ensure tables exist at startup
create_table_if_not_exists()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# =========================
# USERS
# =========================

@app.route("/api/users", methods=["POST"])
def create_user_route():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")

    if not name or not email:
        return jsonify({"error": "name and email required"}), 400

    users_table = get_users_table()
    user_id = create_user(users_table, name, email)

    return jsonify({"message": "User created", "userId": user_id}), 201


@app.route("/api/users", methods=["GET"])
def list_users_route():
    users_table = get_users_table()
    return jsonify(list_users(users_table))


# =========================
# INTERESTS
# =========================

@app.route("/api/interests", methods=["POST"])
def create_interest():
    data = request.get_json() or {}
    user_id = data.get("userId")
    property_id = data.get("propertyId")

    if not user_id or not property_id:
        return jsonify({"error": "userId and propertyId required"}), 400

    interests_table = get_interests_table()
    interest_id = register_property_interest(interests_table, user_id, property_id)

    return jsonify({"message": "Interest registered", "interestId": interest_id}), 201


@app.route("/api/interests/user/<user_id>", methods=["GET"])
def get_user_interests_route(user_id):
    interests_table = get_interests_table()
    return jsonify(get_user_interests(interests_table, user_id))


@app.route("/api/interests/property/<property_id>/pending", methods=["GET"])
def get_pending_property_interests(property_id):
    interests_table = get_interests_table()
    return jsonify(get_pending_interests_for_property(interests_table, property_id))


@app.route("/api/interests/<interest_id>", methods=["PATCH"])
def update_interest(interest_id):
    data = request.get_json() or {}
    status = data.get("status")
    match_group_id = data.get("matchedGroupId")

    if not status:
        return jsonify({"error": "status required"}), 400

    interests_table = get_interests_table()

    matched_at = None
    if status == "matched":
        matched_at = datetime.now(timezone.utc).isoformat()

    updated = update_interest_status(
        interests_table,
        interest_id,
        status,
        match_group_id,
        matched_at,
    )

    return jsonify({"message": "Interest updated", "item": updated})


if __name__ == "__main__":
    app.run(debug=True)
