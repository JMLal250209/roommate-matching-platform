from flask import Blueprint
from db import get_users_table, list_users, create_user
from flask import Flask, jsonify, request
from matching_algorithm import ANIMAL_PROFILES, COMPATIBLE_ANIMALS  
users_bp = Blueprint("users", __name__)

@users_bp.route('/api/users', methods=['GET'])
def get_users():
    try:
        table = get_users_table()
        users = list_users(table)
        return jsonify({
            "success": True,
            "data": users,
            "count": len(users)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@users_bp.route('/api/users/<string:user_id>', methods=['GET'])
def get_user(user_id):
    table = get_users_table()
    try:
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")
        if user:
            return jsonify({"success": True, "data": user}), 200
        else:
            return jsonify({"success": False, "error": "User not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@users_bp.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json()

    # Validate required fields
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields: name and email"
        }), 400

    if 'profile' not in data:
        return jsonify({
            "success": False,
            "error": "Missing profile data"
        }), 400

    profile_data = data['profile']
    
    # Validate required profile fields
    required_fields = ['wakeTime', 'bedtime', 'socialPreference', 'cleanliness']
    missing_fields = [f for f in required_fields if f not in profile_data]
    
    if missing_fields:
        return jsonify({
            "success": False,
            "error": f"Missing profile fields: {', '.join(missing_fields)}"
        }), 400

    try:
        table = get_users_table()
        user_id = create_user(
            table=table,
            email=data['email'],
            name=data['name'],
            profile_data=profile_data
        )

        # Get created user to return full data
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")

        return jsonify({
            "success": True,
            "message": "User created successfully",
            "data": user
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@users_bp.route('/api/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    """PUT endpoint to update a user by ID"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    table = get_users_table()
    try:
        # Get existing user
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Build update expression
        update_parts = []
        attr_values = {}
        
        # Handle profile update (requires archetype recalculation)
        if 'profile' in data:
            from db import update_user_profile
            user = update_user_profile(table, user_id, data['profile'])
            return jsonify({
                "success": True,
                "message": "User updated successfully",
                "data": user
            }), 200
        
        # Handle other field updates
        allowed_fields = ['name', 'email']
        
        for field in allowed_fields:
            if field in data:
                update_parts.append(f"{field} = :{field}")
                attr_values[f":{field}"] = data[field]
        
        if update_parts:
            table.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET " + ", ".join(update_parts),
                ExpressionAttributeValues=attr_values
            )

        # Return updated user
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")

        return jsonify({
            "success": True,
            "message": "User updated successfully",
            "data": user
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@users_bp.route('/api/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    table = get_users_table()
    try:
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        table.delete_item(Key={"userId": user_id})
        return jsonify({
            "success": True,
            "message": f"User with ID {user_id} deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@users_bp.route('/api/users/<string:user_id>/animal', methods=['GET'])
def get_user_animal_info(user_id):
    table = get_users_table()
    try:
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        animal = user.get("animal_archetype")
        profile = ANIMAL_PROFILES.get(animal, {})
        compatible = COMPATIBLE_ANIMALS.get(animal, [])

        return jsonify({
            "success": True,
            "data": {
                "animal": animal,
                "profile": profile,
                "compatible_animals": compatible
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500