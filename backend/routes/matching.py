import uuid
from flask import Blueprint, jsonify, request
from db import (
    get_properties_table,
    get_users_table,
    get_interests_table,
    get_property_interests,
    get_user,
    get_property,
    register_property_interest,
    get_user_interests,
    update_interest_status,
)
from matching_algorithm import (
    check_property_match_complete,
    find_matches_for_property,
    calculate_compatibility_score,
    check_group_compatibility,
)

matching_bp = Blueprint("matching", __name__)


# ---------------------------------------------------------------------------
# HELPER
# ---------------------------------------------------------------------------

def _mark_group_as_matched(interests_table, property_id, matched_user_ids):
    """
    Transition every member of a matched group from 'pending' → 'matched'.

    All members receive the same `matchedGroupId` so callers can easily
    retrieve the full group later.  Records that are no longer 'pending'
    (already matched, withdrawn, etc.) are silently skipped, which makes
    this function safe to call multiple times without creating duplicate
    writes.

    Args:
        interests_table : DynamoDB table resource for HousemateAppInterests
        property_id     : The property these interests belong to
        matched_user_ids: List of userIds that form the confirmed group

    Returns:
        dict with keys:
            updated_count (int)  – records actually written
            group_id      (str)  – shared matchedGroupId assigned to the group
    """
    group_id = str(uuid.uuid4())

    pending_interests = get_property_interests(
        interests_table, property_id, status="pending"
    )
    pending_by_user = {i["userId"]: i for i in pending_interests}

    updated_count = 0
    for user_id in matched_user_ids:
        if user_id in pending_by_user:
            interest_id = pending_by_user[user_id]["interestId"]
            update_interest_status(interests_table, interest_id, "matched", group_id)
            updated_count += 1

    return {"updated_count": updated_count, "group_id": group_id}


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@matching_bp.route('/api/properties/<string:property_id>/register-interest', methods=['POST'])
def register_interest(property_id):
    """
    Register a user's interest in a property.

    After registering, if the total pool of interested users reaches
    `required_roommates` or more, the endpoint also checks whether a
    fully-compatible group can be formed.  When one is found:
      - All members' interest records are updated to 'matched'.
      - A `groupMatch` block is included in the response.
    """
    try:
        # Use authenticated user from app-level auth
        user_id = request.user['userId']

        # Optional budget from request body
        data = request.get_json() or {}
        budget = data.get("budget")

        users_table      = get_users_table()
        properties_table = get_properties_table()
        interests_table  = get_interests_table()

        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Register interest (idempotent — returns existing id if already registered)
        interest_id = register_property_interest(
            interests_table, user_id, property_id, budget
        )

        # Fetch all non-withdrawn interests so the count is accurate
        all_interests    = get_property_interests(interests_table, property_id)
        active_interests = [i for i in all_interests if i.get("status") != "withdrawn"]
        other_user_ids   = [i["userId"] for i in active_interests if i["userId"] != user_id]

        required_roommates = property_data.get("required_roommates", 2)
        total_interested   = len(other_user_ids) + 1  # +1 for the registering user

        # Not enough people yet — return early without running the algorithm
        if total_interested < required_roommates:
            return jsonify({
                "success": True,
                "data": {
                    "interestId":        interest_id,
                    "propertyId":        property_id,
                    "propertyTitle":     property_data.get("title"),
                    "yourAnimal":        user.get("animal_archetype"),
                    "totalInterested":   total_interested,
                    "requiredRoommates": required_roommates,
                    "matches":           {"compatible": [], "incompatible": []},
                    "message": (
                        f"Interest registered! Waiting for more users. "
                        f"Need {required_roommates}, currently {total_interested} interested."
                    ),
                },
            }), 200

        # Build full user objects for everyone (including the new registrant)
        other_users_full = []
        for uid in other_user_ids:
            other_user = get_user(users_table, uid)
            if other_user:
                other_users_full.append(other_user)

        all_interested_users = [user] + other_users_full

        # ── Group-completion check ──────────────────────────────────────────
        is_complete, best_group = check_property_match_complete(
            all_interested_users,
            required_roommates,
            min_compatibility_threshold=60.0,
        )

        group_match_payload = None
        if is_complete and best_group:
            matched_user_ids = [u["userId"] for u in best_group]
            result = _mark_group_as_matched(
                interests_table, property_id, matched_user_ids
            )
            group_match_payload = {
                "formed":         True,
                "matchedUserIds": matched_user_ids,
                "groupId":        result["group_id"],
                "statusUpdated":  result["updated_count"],
                "message": (
                    f"A complete compatible group of {len(best_group)} has been "
                    f"formed for this property!"
                ),
            }

        # ── Pairwise matches for the registering user ──────────────────────
        matches      = find_matches_for_property(user, other_users_full)
        compatible   = [m for m in matches if m["compatibility_score"] >= 60]
        incompatible = [m for m in matches if m["compatibility_score"] < 60]

        response_data = {
            "interestId":        interest_id,
            "propertyId":        property_id,
            "propertyTitle":     property_data.get("title"),
            "yourAnimal":        user.get("animal_archetype"),
            "totalInterested":   total_interested,
            "requiredRoommates": required_roommates,
            "matches":           {"compatible": compatible, "incompatible": incompatible},
            "message": (
                f"You are compatible with {len(compatible)} out of "
                f"{len(other_users_full)} other interested users"
            ),
        }

        if group_match_payload:
            response_data["groupMatch"] = group_match_payload

        return jsonify({"success": True, "data": response_data}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/match/user/<string:user_id>/property/<string:property_id>', methods=['GET'])
def get_matches_for_user_property(user_id, property_id):
    """
    Get pairwise matches for a user who has already registered interest in a
    property.  The response now includes `interestStatus` so clients can tell
    whether this user's interest has already been moved to 'matched'.
    """
    # Security: Users can only view their own matches
    if request.user['userId'] != user_id:
        return jsonify({
            "success": False,
            "error": "Unauthorized: You can only view your own matches"
        }), 403

    try:
        users_table      = get_users_table()
        properties_table = get_properties_table()
        interests_table  = get_interests_table()

        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Confirm the user has registered interest (any non-withdrawn status)
        all_property_interests = get_property_interests(interests_table, property_id)
        user_interest_record   = next(
            (i for i in all_property_interests if i["userId"] == user_id), None
        )

        if not user_interest_record:
            return jsonify({
                "success": False,
                "error": "You must register interest in this property first",
            }), 400

        # Count active (non-withdrawn) interests, excluding the requesting user
        active_interests    = [
            i for i in all_property_interests
            if i["userId"] != user_id and i.get("status") != "withdrawn"
        ]
        interested_user_ids = [i["userId"] for i in active_interests]

        required_roommates = property_data.get("required_roommates", 2)
        total_interested   = len(interested_user_ids) + 1

        if total_interested < required_roommates:
            return jsonify({
                "success": True,
                "data": {
                    "propertyId":        property_id,
                    "propertyTitle":     property_data.get("title"),
                    "yourAnimal":        user.get("animal_archetype"),
                    "interestStatus":    user_interest_record.get("status"),
                    "totalInterested":   total_interested,
                    "requiredRoommates": required_roommates,
                    "matches":           {"compatible": [], "incompatible": []},
                    "compatibleCount":   0,
                    "incompatibleCount": 0,
                    "message": (
                        f"Waiting for more users. "
                        f"Need {required_roommates}, currently {total_interested} interested."
                    ),
                },
            }), 200

        interested_users_full = []
        for uid in interested_user_ids:
            other_user = get_user(users_table, uid)
            if other_user:
                interested_users_full.append(other_user)

        matches      = find_matches_for_property(user, interested_users_full)
        compatible   = [m for m in matches if m["compatibility_score"] >= 60]
        incompatible = [m for m in matches if m["compatibility_score"] < 60]

        return jsonify({
            "success": True,
            "data": {
                "propertyId":        property_id,
                "propertyTitle":     property_data.get("title"),
                "yourAnimal":        user.get("animal_archetype"),
                "interestStatus":    user_interest_record.get("status"),
                "totalInterested":   total_interested,
                "requiredRoommates": required_roommates,
                "matches":           {"compatible": compatible, "incompatible": incompatible},
                "compatibleCount":   len(compatible),
                "incompatibleCount": len(incompatible),
            },
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/match/check-complete/<string:property_id>', methods=['POST'])
def check_match_complete(property_id):
    """
    Check if a property has a complete group of compatible users.

    When a group is found, all matching interest records are updated to
    'matched' in a single pass.  Re-calling the endpoint is safe: the
    helper only touches records that are still 'pending', so already-matched
    records are never overwritten.

    Request body (optional):
        { "min_compatibility_threshold": 60.0 }
    """
    try:
        users_table      = get_users_table()
        properties_table = get_properties_table()
        interests_table  = get_interests_table()

        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        pending_interests   = get_property_interests(interests_table, property_id, status="pending")
        interested_user_ids = [i["userId"] for i in pending_interests]

        interested_users = []
        for user_id in interested_user_ids:
            user = get_user(users_table, user_id)
            if user:
                interested_users.append(user)

        data          = request.get_json() or {}
        min_threshold = data.get("min_compatibility_threshold", 60.0)

        required_roommates = property_data.get("required_roommates", 2)
        is_complete, best_group = check_property_match_complete(
            interested_users,
            required_roommates,
            min_threshold,
        )

        if is_complete and best_group:
            matched_user_ids = [u["userId"] for u in best_group]
            result = _mark_group_as_matched(
                interests_table, property_id, matched_user_ids
            )

            scores = [
                calculate_compatibility_score(best_group[i], best_group[j])
                for i in range(len(best_group))
                for j in range(i + 1, len(best_group))
            ]
            avg_score = sum(scores) / len(scores) if scores else 0

            return jsonify({
                "success": True,
                "data": {
                    "isComplete":    True,
                    "matchedGroup": [
                        {
                            "userId":          u["userId"],
                            "name":            u["name"],
                            "email":           u["email"],
                            "animalArchetype": u.get("animal_archetype"),
                            "age":             u.get("age"),
                            "course":          u.get("course"),
                        }
                        for u in best_group
                    ],
                    "groupId":              result["group_id"],
                    "groupSize":            len(best_group),
                    "averageCompatibility": round(avg_score, 2),
                    "statusUpdated":        result["updated_count"],
                    "propertyId":           property_id,
                    "propertyTitle":        property_data.get("title"),
                    "message": (
                        f"Found a complete match! {len(best_group)} compatible users. "
                        f"{result['updated_count']} interest record(s) updated to 'matched'."
                    ),
                },
            }), 200

        else:
            return jsonify({
                "success": True,
                "data": {
                    "isComplete":           False,
                    "currentInterestCount": len(interested_users),
                    "requiredRoommates":    required_roommates,
                    "message": (
                        f"Not enough compatible users yet. "
                        f"Need {required_roommates}, have {len(interested_users)} interested."
                    ),
                },
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/properties/<string:property_id>/match-groups', methods=['GET'])
def get_property_match_groups(property_id):
    """
    Get all possible compatible groups for a property.
    Only considers pending interests — matched groups are already settled.
    """
    try:
        users_table      = get_users_table()
        properties_table = get_properties_table()
        interests_table  = get_interests_table()

        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        interests = get_property_interests(interests_table, property_id, status="pending")
        interested_users = []
        for interest in interests:
            user = get_user(users_table, interest["userId"])
            if user:
                interested_users.append(user)

        required_roommates = property_data.get("required_roommates", 2)

        from itertools import combinations

        all_groups = []
        for group in combinations(interested_users, required_roommates):
            is_compatible, avg_score = check_group_compatibility(list(group), 60.0)
            if is_compatible:
                all_groups.append({
                    "members": [
                        {
                            "userId":          u["userId"],
                            "name":            u["name"],
                            "animalArchetype": u.get("animal_archetype"),
                        }
                        for u in group
                    ],
                    "averageCompatibility": round(avg_score, 2),
                    "size":                 len(group),
                })

        all_groups.sort(key=lambda x: x["averageCompatibility"], reverse=True)

        return jsonify({
            "success": True,
            "data": {
                "propertyId":        property_id,
                "propertyTitle":     property_data.get("title"),
                "totalInterested":   len(interested_users),
                "requiredRoommates": required_roommates,
                "compatibleGroups":  all_groups,
                "groupCount":        len(all_groups),
            },
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/user/<string:user_id>/interests', methods=['GET'])
def get_user_property_interests(user_id):
    """
    Return all properties a user has registered interest in, together with
    match results for each.

    Both 'pending' and 'matched' interests are included so the user can see
    their confirmed group as well as properties still in progress.
    Withdrawn interests are excluded from counts to keep totals accurate.
    """
    # Security: Users can only view their own interests
    if request.user['userId'] != user_id:
        return jsonify({
            "success": False,
            "error": "Unauthorized: You can only view your own interests"
        }), 403

    try:
        users_table      = get_users_table()
        properties_table = get_properties_table()
        interests_table  = get_interests_table()

        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        user_interests = get_user_interests(interests_table, user_id)

        interests_with_matches = []

        for interest in user_interests:
            if interest.get("status") == "withdrawn":
                continue

            property_id   = interest["propertyId"]
            property_data = get_property(properties_table, property_id)
            if not property_data:
                continue

            all_interests = get_property_interests(interests_table, property_id)

            active_others  = [
                i for i in all_interests
                if i["userId"] != user_id and i.get("status") != "withdrawn"
            ]
            other_user_ids = [i["userId"] for i in active_others]

            required_roommates = property_data.get("required_roommates", 2)
            total_interested   = len(other_user_ids) + 1

            # Calculate compatibility only when enough people are present
            compatible = []
            if total_interested >= required_roommates:
                other_users = []
                for uid in other_user_ids:
                    other_user = get_user(users_table, uid)
                    if other_user:
                        other_users.append(other_user)

                matches    = find_matches_for_property(user, other_users)
                compatible = [m for m in matches if m["compatibility_score"] >= 60]

            interests_with_matches.append({
                "interestId":        interest["interestId"],
                "propertyId":        property_id,
                "propertyTitle":     property_data.get("title"),
                "propertyAddress":   property_data.get("address"),
                "rentPerMonth":      property_data.get("rent_per_month"),
                "registeredAt":      interest.get("registeredAt"),
                "status":            interest.get("status"),
                "matchedGroupId":    interest.get("matchedGroupId"),
                "matchedAt":         interest.get("matchedAt"),
                "budget":            interest.get("budget"),
                "totalInterested":   total_interested,
                "requiredRoommates": required_roommates,
                "compatibleMatches": len(compatible),
                "topMatches":        compatible[:3] if compatible else [],
                "hasEnoughInterest": total_interested >= required_roommates,
            })

        return jsonify({
            "success": True,
            "data": {
                "userId":          user_id,
                "name":            user["name"],
                "animalArchetype": user.get("animal_archetype"),
                "totalProperties": len(interests_with_matches),
                "interests":       interests_with_matches,
            },
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500