from flask import Blueprint, jsonify, request
from db import (
    get_interests_table,
    get_users_table,
    get_properties_table,
    register_property_interest,
    get_property_interests,
    get_user_interests,
    get_user,
    get_property,
)
from matching_algorithm import (
    assign_animal_archetype,
    find_matches_for_property,
    check_property_match_complete,
)
import uuid
from db import update_interest_status

interests_bp = Blueprint("interests", __name__)


def _ensure_archetype(users_table, user: dict) -> dict:
    """
    If the user has no animal_archetype stored (e.g. signed up before the
    profile form was completed), derive one now from whatever profile fields
    exist and persist it so future calls don't have to re-derive it.
    """
    if user.get("animal_archetype"):
        return user  # already set — nothing to do

    archetype = assign_animal_archetype(user)

    # Persist so it's correct for all future queries
    users_table.update_item(
        Key={"userId": user["userId"]},
        UpdateExpression="SET animal_archetype = :a",
        ExpressionAttributeValues={":a": archetype},
    )
    user["animal_archetype"] = archetype
    return user


def _mark_group_as_matched(interests_table, property_id, matched_user_ids):
    group_id = str(uuid.uuid4())
    pending  = get_property_interests(interests_table, property_id, status="pending")
    pending_by_user = {i["userId"]: i for i in pending}
    updated = 0
    for uid in matched_user_ids:
        if uid in pending_by_user:
            update_interest_status(interests_table, pending_by_user[uid]["interestId"], "matched", group_id)
            updated += 1
    return {"updated_count": updated, "group_id": group_id}


@interests_bp.route('/api/interests/register', methods=['POST'])
def register_interest():
    """
    Register interest in a property, then immediately run matching so the
    response includes compatible users and any completed group.
    """
    data = request.get_json()
    if not data or 'propertyId' not in data:
        return jsonify({"success": False, "error": "Missing required field: propertyId"}), 400

    user_id     = request.user['userId']
    property_id = data['propertyId']
    budget      = data.get('budget')

    try:
        users_table      = get_users_table()
        interests_table  = get_interests_table()
        properties_table = get_properties_table()

        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Ensure this user has an archetype before we compare them to anyone
        user = _ensure_archetype(users_table, user)

        # Register interest (idempotent)
        interest_id = register_property_interest(interests_table, user_id, property_id, budget)

        # All active interests excluding the registering user
        all_interests  = get_property_interests(interests_table, property_id)
        active_others  = [i for i in all_interests if i["userId"] != user_id and i.get("status") != "withdrawn"]
        other_user_ids = [i["userId"] for i in active_others]

        required_roommates = property_data.get("required_roommates", 2)
        total_interested   = len(other_user_ids) + 1

        # Not enough people yet
        if total_interested < required_roommates:
            return jsonify({
                "success": True,
                "data": {
                    "interestId":        interest_id,
                    "propertyId":        property_id,
                    "yourAnimal":        user.get("animal_archetype"),
                    "totalInterested":   total_interested,
                    "requiredRoommates": required_roommates,
                    "matches":           {"compatible": [], "incompatible": []},
                    "compatibleCount":   0,
                    "message": f"Interest registered! Need {required_roommates}, currently {total_interested} interested.",
                },
            }), 201

        # Hydrate + ensure archetypes for all other interested users
        other_users = []
        for uid in other_user_ids:
            other_user = get_user(users_table, uid)
            if other_user:
                other_user = _ensure_archetype(users_table, other_user)
                other_users.append(other_user)

        # Pairwise matches
        matches      = find_matches_for_property(user, other_users)
        compatible   = [m for m in matches if m["compatibility_score"] >= 60]
        incompatible = [m for m in matches if m["compatibility_score"] < 60]

        # Group-completion check
        all_users    = [user] + other_users
        is_complete, best_group = check_property_match_complete(all_users, required_roommates)
        group_match_payload = None
        if is_complete and best_group:
            result = _mark_group_as_matched(interests_table, property_id, [u["userId"] for u in best_group])
            group_match_payload = {
                "formed":         True,
                "matchedUserIds": [u["userId"] for u in best_group],
                "groupId":        result["group_id"],
                "message":        f"A complete compatible group of {len(best_group)} has been formed!",
            }

        response_data = {
            "interestId":        interest_id,
            "propertyId":        property_id,
            "yourAnimal":        user.get("animal_archetype"),
            "totalInterested":   total_interested,
            "requiredRoommates": required_roommates,
            "matches":           {"compatible": compatible, "incompatible": incompatible},
            "compatibleCount":   len(compatible),
            "incompatibleCount": len(incompatible),
            "message":           f"You are compatible with {len(compatible)} of {len(other_users)} other interested users.",
        }
        if group_match_payload:
            response_data["groupMatch"] = group_match_payload

        return jsonify({"success": True, "data": response_data}), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@interests_bp.route('/api/interests/property/<string:property_id>', methods=['GET'])
def get_interests_for_property(property_id):
    """Get all users interested in a property"""
    try:
        interests_table = get_interests_table()
        interests = get_property_interests(interests_table, property_id)
        return jsonify({"success": True, "data": interests, "count": len(interests)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@interests_bp.route('/api/interests/user/<string:user_id>', methods=['GET'])
def get_interests_for_user(user_id):
    """Get all properties a user is interested in"""
    if request.user['userId'] != user_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
    try:
        interests_table = get_interests_table()
        interests = get_user_interests(interests_table, user_id)
        return jsonify({"success": True, "data": interests, "count": len(interests)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500