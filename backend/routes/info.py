from flask import Blueprint
from flask import Flask, jsonify
from matching_algorithm import ANIMAL_PROFILES, COMPATIBLE_ANIMALS  
info_bp = Blueprint("info", __name__)

@info_bp.route('/api/animals', methods=['GET'])
def get_animal_archetypes():
    return jsonify({
        "success": True,
        "data": ANIMAL_PROFILES
    }), 200


@info_bp.route('/api/animals/<string:animal>/compatible', methods=['GET'])
def get_compatible_animals(animal):
    if animal not in COMPATIBLE_ANIMALS:
        return jsonify({
            "success": False,
            "error": f"Unknown animal archetype: {animal}"
        }), 404

    compatible = COMPATIBLE_ANIMALS[animal]
    compatible_profiles = {
        a: ANIMAL_PROFILES[a] for a in compatible if a in ANIMAL_PROFILES
    }

    return jsonify({
        "success": True,
        "data": {
            "animal": animal,
            "compatible_animals": compatible,
            "profiles": compatible_profiles
        }
    }), 200