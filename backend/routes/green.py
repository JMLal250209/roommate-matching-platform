from flask import Blueprint, jsonify, request
from db import get_green_stats_table, get_latest_green_stats

green_bp = Blueprint("green", __name__, url_prefix="/api")


@green_bp.route("/green-stats", methods=["GET"])
def get_green_stats():
    """
    Return the latest green computing stats from DynamoDB.
    These are written by the scheduled Lambda function that pulls
    CloudWatch metrics (invocations, duration, GB-seconds) and
    calculates estimated kWh and CO₂ equivalent.

    Query params:
        limit (int): number of daily records to return (default 7)
    """
    try:
        limit = int(request.args.get("limit", 7))
        limit = max(1, min(limit, 30))  # clamp between 1 and 30
    except (ValueError, TypeError):
        limit = 7

    table = get_green_stats_table()
    records = get_latest_green_stats(table, limit=limit)

    return jsonify({
        "data": records,
        "count": len(records),
    }), 200
