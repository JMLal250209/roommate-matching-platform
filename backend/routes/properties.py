from flask import Blueprint, jsonify, request
from urllib.parse import quote
from db import get_properties_table, create_property

properties_bp = Blueprint("properties", __name__)

def _resolve_property_images(property_data):
    images = property_data.get("image_urls")
    if not isinstance(images, list):
        images = []

    # Backward compatibility with older records that store a single "image" field.
    if not images and isinstance(property_data.get("image"), str):
        images = [property_data["image"]]

    resolved = []
    for image in images:
        if not isinstance(image, str) or not image.strip():
            continue
        if image.startswith("http://") or image.startswith("https://"):
            resolved.append(image)
            continue

        filename = image.split("/")[-1]
        resolved.append(f"{request.host_url.rstrip('/')}/api/images/{quote(filename)}")

    property_data["image_urls"] = resolved
    return property_data


@properties_bp.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        table = get_properties_table()
        response = table.scan()
        raw_properties = response.get("Items", [])
        properties = [_resolve_property_images(p) for p in raw_properties]
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
            return jsonify({"success": True, "data": _resolve_property_images(property_data)}), 200
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
            "data": _resolve_property_images(property_data)
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
