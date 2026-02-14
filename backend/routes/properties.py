from flask import Blueprint
from db import get_properties_table, create_property
from flask import jsonify, request
properties_bp = Blueprint("properties", __name__)

@properties_bp.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        table = get_properties_table()
        response = table.scan()
        properties = response.get("Items", [])
        return jsonify({
            "success": True,
            "data": properties,
            "count": len(properties)
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