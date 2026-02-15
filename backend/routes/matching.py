from flask import Blueprint, jsonify, request
from db import (
    get_properties_table, 
    get_users_table,
    get_interests_table, 
    get_property_interests,
    get_user,
    get_property,
    register_property_interest,
    get_user_interests
)
from matching_algorithm import (
    check_property_match_complete, 
    find_matches_for_property,
    calculate_compatibility_score,
    check_group_compatibility
)

matching_bp = Blueprint("matching", __name__)


@matching_bp.route('/api/properties/<string:property_id>/register-interest', methods=['POST'])
def register_interest(property_id):
    """Register interest in a property and get initial matches"""
    try:
        # Use authenticated user from app-level auth
        user_id = request.user['userId']
        
        # Optional budget from request body
        data = request.get_json() or {}
        budget = data.get("budget")
        
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()
        
        # Get user
        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Get property
        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404
        
        # Register interest (with optional budget)
        interest_id = register_property_interest(
            interests_table, 
            user_id, 
            property_id, 
            budget
        )
        
        # Get all users interested in this property
        interests = get_property_interests(interests_table, property_id)
        interested_user_ids = [i['userId'] for i in interests if i['userId'] != user_id]
        
        required_roommates = property_data.get("required_roommates", 2)
        total_interested = len(interested_user_ids) + 1  # +1 for the current user
        
        # Only check matches if enough people are interested
        if total_interested < required_roommates:
            return jsonify({
                "success": True,
                "data": {
                    "interestId": interest_id,
                    "propertyId": property_id,
                    "propertyTitle": property_data.get("title"),
                    "yourAnimal": user.get("animal_archetype"),
                    "totalInterested": total_interested,
                    "requiredRoommates": required_roommates,
                    "matches": {
                        "compatible": [],
                        "incompatible": []
                    },
                    "message": f"Interest registered! Waiting for more users. Need {required_roommates}, currently {total_interested} interested."
                }
            }), 200
        
        # Get full user objects
        interested_users_full = []
        for uid in interested_user_ids:
            interested_user = get_user(users_table, uid)
            if interested_user:
                interested_users_full.append(interested_user)
        
        # Find matches for this user
        matches = find_matches_for_property(
            user,
            interested_users_full
        )
        
        # Separate into compatible and incompatible
        compatible = [m for m in matches if m["compatibility_score"] >= 60]
        incompatible = [m for m in matches if m["compatibility_score"] < 60]
        
        return jsonify({
            "success": True,
            "data": {
                "interestId": interest_id,
                "propertyId": property_id,
                "propertyTitle": property_data.get("title"),
                "yourAnimal": user.get("animal_archetype"),
                "totalInterested": total_interested,
                "requiredRoommates": required_roommates,
                "matches": {
                    "compatible": compatible,
                    "incompatible": incompatible
                },
                "message": f"You are compatible with {len(compatible)} out of {len(interested_user_ids)} other interested users"
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/match/user/<string:user_id>/property/<string:property_id>', methods=['GET'])
def get_matches_for_user_property(user_id, property_id):
    """Get matches for a user who has already registered interest in a property"""
    # Security: Users can only view their own matches
    if request.user['userId'] != user_id:
        return jsonify({
            "success": False,
            "error": "Unauthorized: You can only view your own matches"
        }), 403
    
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()

        # Get user
        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get property
        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Check if user has registered interest
        user_interests = [i for i in get_property_interests(interests_table, property_id) 
                         if i['userId'] == user_id]
        
        if not user_interests:
            return jsonify({
                "success": False, 
                "error": "You must register interest in this property first"
            }), 400

        # Get all interest records for this property
        interests = get_property_interests(interests_table, property_id)
        interested_user_ids = [i['userId'] for i in interests if i['userId'] != user_id]

        required_roommates = property_data.get("required_roommates", 2)
        total_interested = len(interested_user_ids) + 1  # +1 for current user

        # Only check matches if enough people are interested
        if total_interested < required_roommates:
            return jsonify({
                "success": True,
                "data": {
                    "propertyId": property_id,
                    "propertyTitle": property_data.get("title"),
                    "yourAnimal": user.get("animal_archetype"),
                    "totalInterested": total_interested,
                    "requiredRoommates": required_roommates,
                    "matches": {
                        "compatible": [],
                        "incompatible": []
                    },
                    "compatibleCount": 0,
                    "incompatibleCount": 0,
                    "message": f"Waiting for more users. Need {required_roommates}, currently {total_interested} interested."
                }
            }), 200

        # Get full user objects for all interested users (excluding the requesting user)
        interested_users_full = []
        for uid in interested_user_ids:
            interested_user = get_user(users_table, uid)
            if interested_user:
                interested_users_full.append(interested_user)

        # Run matching algorithm
        matches = find_matches_for_property(
            user,
            interested_users_full
        )
        
        # Separate compatible vs incompatible
        compatible = [m for m in matches if m["compatibility_score"] >= 60]
        incompatible = [m for m in matches if m["compatibility_score"] < 60]

        return jsonify({
            "success": True,
            "data": {
                "propertyId": property_id,
                "propertyTitle": property_data.get("title"),
                "yourAnimal": user.get("animal_archetype"),
                "totalInterested": total_interested,
                "requiredRoommates": required_roommates,
                "matches": {
                    "compatible": compatible,
                    "incompatible": incompatible
                },
                "compatibleCount": len(compatible),
                "incompatibleCount": len(incompatible)
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/match/check-complete/<string:property_id>', methods=['POST'])
def check_match_complete(property_id):
    """
    Check if a property has a complete group of compatible users
    Used by landlords or system to identify when a property has matched
    """
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()

        # Get property
        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404

        # Get interested users
        interests = get_property_interests(interests_table, property_id, status="pending")
        interested_user_ids = [i['userId'] for i in interests]
        
        # Get full user objects
        interested_users = []
        for user_id in interested_user_ids:
            user = get_user(users_table, user_id)
            if user:
                interested_users.append(user)

        # Get threshold from request or use default
        data = request.get_json() or {}
        min_threshold = data.get("min_compatibility_threshold", 60.0)

        # Check for complete match
        required_roommates = property_data.get("required_roommates", 2)
        is_complete, best_group = check_property_match_complete(
            interested_users,
            required_roommates,
            min_threshold
        )

        if is_complete:
            # Calculate group statistics
            scores = []
            for i in range(len(best_group)):
                for j in range(i + 1, len(best_group)):
                    score = calculate_compatibility_score(best_group[i], best_group[j])
                    scores.append(score)
            
            avg_score = sum(scores) / len(scores) if scores else 0

            return jsonify({
                "success": True,
                "data": {
                    "isComplete": True,
                    "matchedGroup": [
                        {
                            "userId": u["userId"],
                            "name": u["name"],
                            "email": u["email"],
                            "animalArchetype": u.get("animal_archetype"),
                            "age": u.get("age"),
                            "course": u.get("course")
                        }
                        for u in best_group
                    ],
                    "groupSize": len(best_group),
                    "averageCompatibility": round(avg_score, 2),
                    "propertyId": property_id,
                    "propertyTitle": property_data.get("title"),
                    "message": f"Found a complete match! {len(best_group)} compatible users"
                }
            }), 200
        else:
            return jsonify({
                "success": True,
                "data": {
                    "isComplete": False,
                    "currentInterestCount": len(interested_users),
                    "requiredRoommates": required_roommates,
                    "message": f"Not enough compatible users yet. Need {required_roommates}, have {len(interested_users)} interested"
                }
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/properties/<string:property_id>/match-groups', methods=['GET'])
def get_property_match_groups(property_id):
    """Get all possible compatible groups for a property"""
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()
        
        # Get property
        property_data = get_property(properties_table, property_id)
        if not property_data:
            return jsonify({"success": False, "error": "Property not found"}), 404
        
        # Get interested users
        interests = get_property_interests(interests_table, property_id, status="pending")
        interested_users = []
        for interest in interests:
            user = get_user(users_table, interest['userId'])
            if user:
                interested_users.append(user)
        
        required_roommates = property_data.get("required_roommates", 2)
        
        # Find all possible groups
        from itertools import combinations
        
        all_groups = []
        
        for group in combinations(interested_users, required_roommates):
            is_compatible, avg_score = check_group_compatibility(list(group), 60.0)
            
            if is_compatible:
                all_groups.append({
                    "members": [
                        {
                            "userId": u["userId"],
                            "name": u["name"],
                            "animalArchetype": u.get("animal_archetype")
                        }
                        for u in group
                    ],
                    "averageCompatibility": round(avg_score, 2),
                    "size": len(group)
                })
        
        # Sort by compatibility score
        all_groups.sort(key=lambda x: x["averageCompatibility"], reverse=True)
        
        return jsonify({
            "success": True,
            "data": {
                "propertyId": property_id,
                "propertyTitle": property_data.get("title"),
                "totalInterested": len(interested_users),
                "requiredRoommates": required_roommates,
                "compatibleGroups": all_groups,
                "groupCount": len(all_groups)
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@matching_bp.route('/api/user/<string:user_id>/interests', methods=['GET'])
def get_user_property_interests(user_id):
    """Get all properties a user has registered interest in with match results"""
    # Security: Users can only view their own interests
    if request.user['userId'] != user_id:
        return jsonify({
            "success": False,
            "error": "Unauthorized: You can only view your own interests"
        }), 403
    
    try:
        users_table = get_users_table()
        properties_table = get_properties_table()
        interests_table = get_interests_table()
        
        # Get user
        user = get_user(users_table, user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Get user's interests
        user_interests = get_user_interests(interests_table, user_id)
        
        # For each property, get match info
        interests_with_matches = []
        
        for interest in user_interests:
            property_id = interest['propertyId']
            property_data = get_property(properties_table, property_id)
            
            if not property_data:
                continue
            
            # Get all interested users for this property
            all_interests = get_property_interests(interests_table, property_id)
            other_user_ids = [i['userId'] for i in all_interests if i['userId'] != user_id]
            
            required_roommates = property_data.get("required_roommates", 2)
            total_interested = len(other_user_ids) + 1
            
            # Only calculate matches if enough people
            compatible = []
            if total_interested >= required_roommates:
                # Get full user objects
                other_users = []
                for uid in other_user_ids:
                    other_user = get_user(users_table, uid)
                    if other_user:
                        other_users.append(other_user)
                
                # Get matches
                matches = find_matches_for_property(
                    user, 
                    other_users
                )
                
                compatible = [m for m in matches if m["compatibility_score"] >= 60]
            
            interests_with_matches.append({
                "interestId": interest['interestId'],
                "propertyId": property_id,
                "propertyTitle": property_data.get("title"),
                "propertyAddress": property_data.get("address"),
                "rentPerMonth": property_data.get("rent_per_month"),
                "registeredAt": interest.get("registeredAt"),
                "status": interest.get("status"),
                "budget": interest.get("budget"),
                "totalInterested": total_interested,
                "requiredRoommates": required_roommates,
                "compatibleMatches": len(compatible),
                "topMatches": compatible[:3] if compatible else [],
                "hasEnoughInterest": total_interested >= required_roommates
            })
        
        return jsonify({
            "success": True,
            "data": {
                "userId": user_id,
                "name": user["name"],
                "animalArchetype": user.get("animal_archetype"),
                "totalProperties": len(interests_with_matches),
                "interests": interests_with_matches
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500