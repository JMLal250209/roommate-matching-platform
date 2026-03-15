from flask import Blueprint, jsonify, request
from urllib.parse import quote
from datetime import datetime, timedelta
from db import get_properties_table, create_property
from typing import Optional

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


# ---------------------------------------------------------------------------
# DUBLIN AREA MAPPING
# Frontend sends: "city" | "suburbs" | "either"
# Houses store:   "Dublin 1", "Dublin 2", ..., "Dublin 14" etc.
#
# City centre = D1, D2, D4, D6, D8
# Suburbs     = D7, D9, D12, D14 (and anything else)
# ---------------------------------------------------------------------------
CITY_CENTRE_AREAS = {"Dublin 1", "Dublin 2", "Dublin 4", "Dublin 6", "Dublin 8"}

# Regex matches "Dublin " followed by digits, word-boundary anchored so
# "Dublin 1" does NOT match inside "Dublin 14".
import re
_DUBLIN_AREA_RE = re.compile(r"Dublin\s+(\d+)\b")


def _extract_dublin_area(title: str) -> Optional[str]:
    """
    Pull the first 'Dublin N' token out of a property title.
    Returns e.g. 'Dublin 14' or None if not found.
    """
    m = _DUBLIN_AREA_RE.search(title or "")
    return f"Dublin {m.group(1)}" if m else None


def _area_matches(house_title: str, preferred_area: str) -> bool:
    """
    Returns True if the house is in an area the user is open to.
    Uses a word-boundary regex so 'Dublin 1' never matches 'Dublin 14'.
    """
    if preferred_area == "either":
        return True

    area = _extract_dublin_area(house_title)
    if area is None:
        return True  # can't determine → don't filter out

    is_city_centre = area in CITY_CENTRE_AREAS

    if preferred_area == "city":
        return is_city_centre
    if preferred_area == "suburbs":
        return not is_city_centre

    return True


def _move_in_matches(available_from: str, move_in_pref: str) -> bool:
    """
    Returns True if the property becomes available within the window implied
    by the user's move-in preference.

      asap        → available within 7 days
      this_month  → available within 30 days
      next_month  → available within 31–60 days (or already available)
      flexible    → always True
    """
    if move_in_pref == "flexible" or not available_from:
        return True

    try:
        avail = datetime.fromisoformat(available_from).date()
    except (ValueError, TypeError):
        return True  # can't parse → don't filter out

    today = datetime.utcnow().date()

    if move_in_pref == "asap":
        return avail <= today + timedelta(days=7)
    if move_in_pref == "this_month":
        return avail <= today + timedelta(days=30)
    if move_in_pref == "next_month":
        # Available now or within the next 60 days
        return avail <= today + timedelta(days=60)

    return True


def _room_type_matches(house: dict, room_type_pref: str) -> bool:
    """
    Match the user's room type preference against house characteristics.

      single  → required_roommates == 1 (the user would be the only tenant)
      shared  → required_roommates >= 2
      studio  → bedrooms == 1 AND required_roommates == 1
      any     → always True
    """
    if room_type_pref == "any":
        return True

    bedrooms   = int(house.get("bedrooms", 1) or 1)
    roommates  = int(house.get("required_roommates", 1) or 1)

    if room_type_pref == "studio":
        return bedrooms == 1 and roommates == 1
    if room_type_pref == "single":
        return roommates == 1
    if room_type_pref == "shared":
        return roommates >= 2

    return True


def _amenities_score(house_amenities: list, wanted_amenities: list) -> int:
    """
    Returns how many of the user's wanted amenities the house has.
    Used for soft-sorting rather than hard filtering.
    """
    if not wanted_amenities:
        return 0
    house_set  = {a.lower() for a in (house_amenities or [])}
    wanted_set = {a.lower() for a in wanted_amenities}
    return len(house_set & wanted_set)


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

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
        table    = get_properties_table()
        response = table.scan()
        properties = response.get("Items", [])

        user = getattr(request, "user", None)
        if not user:
            return jsonify({"success": False, "error": "User not authenticated"}), 401

        profile = user.get("profile", {})

        # ── Read profile fields (DynamoDB already deserialised by _deserialize) ──
        budget_min   = float(profile.get("budgetMin",  0)   or 0)
        budget_max   = float(profile.get("budgetMax",  0)   or 0)
        area_pref    = profile.get("area",     "either") or "either"
        move_in_pref = profile.get("moveIn",   "flexible") or "flexible"
        room_type    = profile.get("roomType", "any")    or "any"
        smoker       = bool(profile.get("smoker",   False))
        has_pets     = bool(profile.get("hasPets",  False))
        pets_ok      = bool(profile.get("petsOk",   True))
        wanted_amenities = profile.get("amenities", []) or []

        filtered = []
        for prop in properties:
            # ── 1. Must be available ──────────────────────────────────────────
            if prop.get("status") != "available":
                continue

            rent = float(prop.get("rent_per_month", 0) or 0)

            # ── 2. Budget — use full range when set, otherwise just a max cap ─
            if budget_max > 0:
                if rent > budget_max:
                    continue
                if budget_min > 0 and rent < budget_min:
                    continue

            # ── 3. Area preference ────────────────────────────────────────────
            if not _area_matches(prop.get("title", ""), area_pref):
                continue

            # ── 4. Move-in date ───────────────────────────────────────────────
            if not _move_in_matches(prop.get("available_from", ""), move_in_pref):
                continue

            # ── 5. Room type ──────────────────────────────────────────────────
            if not _room_type_matches(prop, room_type):
                continue

            # ── 6. Smoking — hard filter only when user smokes and house bans it
            if smoker and not prop.get("smoking_allowed", False):
                continue

            # ── 7. Pets — filter when user has pets and house doesn't allow them
            if has_pets and not prop.get("pets_allowed", False):
                continue

            # ── 8. Soft score: how many wanted amenities does this house have? ─
            amenity_hits = _amenities_score(prop.get("amenities", []), wanted_amenities)

            filtered.append({
                **prop,
                "_amenityScore": amenity_hits,
            })

        # Sort: houses matching more wanted amenities float to the top,
        # then by rent ascending as a tiebreaker.
        filtered.sort(key=lambda p: (-p["_amenityScore"], float(p.get("rent_per_month", 0))))

        # Strip the internal sort key before sending to the client
        for p in filtered:
            p.pop("_amenityScore", None)
            _resolve_property_images(p)

        return jsonify({
            "success": True,
            "data":    filtered,
            "count":   len(filtered),
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
        table       = get_properties_table()
        property_id = create_property(table, data)

        response      = table.get_item(Key={"propertyId": property_id})
        property_data = response.get("Item")

        return jsonify({
            "success": True,
            "message": "Property created successfully",
            "data":    _resolve_property_images(property_data),
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
