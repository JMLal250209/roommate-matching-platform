from flask import Blueprint, jsonify, request
from db import get_interests_table, register_property_interest, get_property_interests, get_user_interests

interests_bp = Blueprint("interests", __name__)


@interests_bp.route('/api/interests/register', methods=['POST'])
def register_interest():
    """Register interest in a property"""
    data = request.get_json()
    
    if not data or 'propertyId' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field: propertyId"
        }), 400

    # Use the authenticated user's ID from app-level auth
    user_id = request.user['userId']

    try:
        interests_table = get_interests_table()
        interest_id = register_property_interest(
            interests_table,
            user_id,
            data['propertyId']
        )

        return jsonify({
            "success": True,
            "message": "Interest registered successfully",
            "data": {"interestId": interest_id}
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@interests_bp.route('/api/interests/property/<string:property_id>', methods=['GET'])
def get_interests_for_property(property_id):
    """Get all users interested in a property"""
    try:
        interests_table = get_interests_table()
        interests = get_property_interests(interests_table, property_id)
        
        return jsonify({
            "success": True,
            "data": interests,
            "count": len(interests)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@interests_bp.route('/api/interests/user/<string:user_id>', methods=['GET'])
def get_interests_for_user(user_id):
    """Get all properties a user is interested in"""
    # Security: Users can only view their own interests
    if request.user['userId'] != user_id:
        return jsonify({
            "success": False,
            "error": "Unauthorized: You can only view your own interests"
        }), 403
    
    try:
        interests_table = get_interests_table()
        interests = get_user_interests(interests_table, user_id)
        
        return jsonify({
            "success": True,
            "data": interests,
            "count": len(interests)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500