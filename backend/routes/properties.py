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

        # --- FIX: read budgetMax correctly from DynamoDB typed JSON ---
        budget_max_raw = profile.get("budgetMax")
        if isinstance(budget_max_raw, dict):
            # DynamoDB raw format: {"N": "900"}
            max_budget = float(budget_max_raw.get("N", 0))
        elif budget_max_raw is not None:
            # Already deserialized (boto3 resource, not client)
            max_budget = float(budget_max_raw)
        else:
            max_budget = None

        preferred_city = profile.get("city")
        pets_required = profile.get("petsOk")
        if isinstance(pets_required, dict):
            pets_required = pets_required.get("BOOL", False)

        filtered = []
        for prop in properties:
            if prop.get("status") != "available":
                continue

            # --- FIX: compare budget correctly ---
            rent = prop.get("rent_per_month", 0)
            if max_budget is not None and float(rent) > max_budget:
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
