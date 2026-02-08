from flask import Blueprint
from db import (get_properties_table, get_users_table,
get_interests_table, get_property_interests)
from matching_algorithm import check_property_match_complete, find_matches_for_property
from flask import jsonify, request 
matching_bp = Blueprint("matching", __name__)

@matching_bp.route('/api/match/user/<string:user_id>/property/<string:property_id>', methods=['GET'])
def get_matches_for_user_property(user_id, property_id):
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()

        # Get user
        user_response = users_table.get_item(Key={"userId": user_id})
        user = user_response.get("Item")
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get property
        property_response = properties_table.get_item(Key={"propertyId": property_id})
        property_data = property_response.get("Item")
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Get all interest records for this property
        interests = get_property_interests(interests_table, property_id)
        interested_user_ids = [i['userId'] for i in interests if i['userId'] != user_id]

        # Get full user objects for all interested users (excluding the requesting user)
        interested_users_full = []
        for uid in interested_user_ids:
            user_response = users_table.get_item(Key={"userId": uid})
            interested_user = user_response.get("Item")
            if interested_user:
                interested_users_full.append(interested_user)

        # Run matching algorithm
        # Step 1: Filter by animal compatibility
        # Step 2: Apply hard filters
        # Step 3: Calculate detailed scores
        required_roommates = property_data.get("required_roommates", 2)
        matches = find_matches_for_property(
            user,
            interested_users_full,
            required_roommates
        )

        return jsonify({
            "success": True,
            "data": {
                "matches": matches,
                "count": len(matches),
                "total_interested": len(interested_user_ids) + 1,  # +1 for the user themselves
                "user_animal": user.get("animal_archetype"),
                "required_roommates": required_roommates,
                "property_title": property_data.get("title")
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/match/check-complete/<string:property_id>', methods=['POST'])
def check_match_complete(property_id):
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()

        # Get property
        property_response = properties_table.get_item(Key={"propertyId": property_id})
        property_data = property_response.get("Item")
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Get interested users
        interests = get_property_interests(interests_table, property_id)
        interested_user_ids = [i['userId'] for i in interests]
        
        # Get full user objects
        interested_users = []
        for user_id in interested_user_ids:
            user_response = users_table.get_item(Key={"userId": user_id})
            user = user_response.get("Item")
            if user:
                interested_users.append(user)

        # Get threshold from request or use default
        data = request.get_json() or {}
        min_threshold = data.get("min_compatibility_threshold", 60.0)

        # Check for complete match
        required_roommates = property_data.get("required_roommates", 2)
        is_complete, best_group = check_property_match_complete(
            property_id,
            interested_users,
            required_roommates,
            min_threshold
        )

        if is_complete:
            # Calculate group statistics
            from matching_algorithm import calculate_compatibility_score
            
            scores = []
            for i in range(len(best_group)):
                for j in range(i + 1, len(best_group)):
                    score = calculate_compatibility_score(best_group[i], best_group[j])
                    scores.append(score)
            
            avg_score = sum(scores) / len(scores) if scores else 0

            return jsonify({
                "success": True,
                "data": {
                    "is_complete": True,
                    "matched_group": [
                        {
                            "userId": u["userId"],
                            "name": u["name"],
                            "email": u["email"],
                            "animal_archetype": u.get("animal_archetype")
                        }
                        for u in best_group
                    ],
                    "group_size": len(best_group),
                    "average_compatibility": round(avg_score, 2),
                    "property_id": property_id
                }
            }), 200
        else:
            return jsonify({
                "success": True,
                "data": {
                    "is_complete": False,
                    "current_interest_count": len(interested_users),
                    "required_roommates": required_roommates,
                    "message": "Not enough compatible users yet"
                }
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

