from flask import Blueprint, jsonify, request
from db import get_properties_table, create_property

properties_bp = Blueprint("properties", __name__)


@properties_bp.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        table = get_properties_table()
        response = table.scan()
        properties = response.get("Items", [])

        user = getattr(request, "user", None)

        if not user:
            return jsonify({"success": False, "error": "User not authenticated"}), 401
        
        profile = user.get("profile", {})

        max_budget = profile.get("max_budget")
        preferred_city = profile.get("city")
        pets_required = profile.get("petsOk")

        filtered = []

        for prop in properties:
            if prop.get("status") != "available":
                continue

            if max_budget and prop.get("rent_per_month", 0) > max_budget:
                continue

            if preferred_city and prop.get("city") != preferred_city:
                continue

            if pets_required and not prop.get("pets_allowed"):
                continue

            filtered.append(prop)

        return jsonify({
            "success": True,
            "data": filtered,
            "count": len(filtered)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@properties_bp.route('/api/properties/<string:property_id>', methods=['GET'])
def get_property(property_id):
    table = get_properties_table()
    try:
        response = table.get_item(Key={"propertyId": property_id})
        property_data = response.get("Item")
        if property_data:
            return jsonify({"success": True, "data": property_data}), 200
        else:
            return jsonify({"success": False, "error": "Property not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@properties_bp.route('/api/properties', methods=['POST'])
def add_property():
    data = request.get_json()
    
    required_fields = ['title', 'address', 'city', 'rent_per_month', 'required_roommates']
    missing = [f for f in required_fields if f not in data]
    
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        table = get_properties_table()
        property_id = create_property(table, data)
        
        response = table.get_item(Key={"propertyId": property_id})
        property_data = response.get("Item")

        return jsonify({
            "success": True,
            "message": "Property created successfully",
            "data": property_data
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500