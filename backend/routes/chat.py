from flask import Blueprint, jsonify, request

from db import (
    create_group_message,
    get_interests_table,
    get_messages_table,
    get_user,
    get_user_interests,
    get_users_table,
    list_group_messages,
)

chat_bp = Blueprint("chat", __name__)


def _get_interest_chat_context(interests_table, user_id, interest_id):
    """
    Resolve whether this interest can access chat and which chat room ID to use.

    - matched interest  -> matched group room (matchedGroupId)
    - pending interest  -> property pending room (pending:<propertyId>)
    """
    user_interests = get_user_interests(interests_table, user_id)
    interest = next((item for item in user_interests if item.get("interestId") == interest_id), None)

    if not interest:
        return None, ("Match not found for this user.", 404)

    status = interest.get("status")
    if status == "withdrawn":
        return None, ("Chat is not available for withdrawn interests.", 400)

    if status == "matched":
        group_id = interest.get("matchedGroupId")
        if not group_id:
            return None, ("Matched group chat is not available yet.", 400)
        return {"interest": interest, "groupId": group_id, "chatType": "matched"}, None

    property_id = interest.get("propertyId")
    if not property_id:
        return None, ("Missing property context for this interest.", 400)

    return {
        "interest": interest,
        "groupId": f"pending:{property_id}",
        "chatType": "pending",
    }, None


@chat_bp.route("/api/chat/interest/<string:interest_id>/messages", methods=["GET"])
def get_chat_messages(interest_id):
    user_id = request.user["userId"]

    try:
        limit = int(request.args.get("limit", 100))
    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'limit' query parameter."}), 400

    try:
        interests_table = get_interests_table()
        messages_table = get_messages_table()

        chat_context, error = _get_interest_chat_context(interests_table, user_id, interest_id)
        if error:
            message, status = error
            return jsonify({"success": False, "error": message}), status

        group_id = chat_context["groupId"]
        messages = list_group_messages(messages_table, group_id, limit=limit)

        return jsonify(
            {
                "success": True,
                "data": {
                    "interestId": interest_id,
                    "groupId": group_id,
                    "chatType": chat_context["chatType"],
                    "messages": messages,
                    "count": len(messages),
                },
            }
        ), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/api/chat/interest/<string:interest_id>/messages", methods=["POST"])
def post_chat_message(interest_id):
    user_id = request.user["userId"]
    data = request.get_json(silent=True) or {}
    message_text = data.get("message", "")

    if not isinstance(message_text, str):
        return jsonify({"success": False, "error": "Field 'message' must be a string."}), 400

    message_text = message_text.strip()
    if not message_text:
        return jsonify({"success": False, "error": "Message cannot be empty."}), 400

    if len(message_text) > 2000:
        return jsonify({"success": False, "error": "Message must be 2000 characters or fewer."}), 400

    try:
        interests_table = get_interests_table()
        users_table = get_users_table()
        messages_table = get_messages_table()

        chat_context, error = _get_interest_chat_context(interests_table, user_id, interest_id)
        if error:
            message, status = error
            return jsonify({"success": False, "error": message}), status

        sender_name = request.user.get("name")
        if not sender_name:
            user = get_user(users_table, user_id)
            sender_name = user.get("name") if user else "Unknown user"

        created = create_group_message(
            messages_table,
            group_id=chat_context["groupId"],
            sender_id=user_id,
            sender_name=sender_name,
            message_text=message_text,
        )

        return jsonify({"success": True, "data": created}), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
