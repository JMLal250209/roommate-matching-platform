from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone
from db import get_users_table, create_user, list_users, create_table_if_not_exists
import boto3

app = Flask(__name__)
CORS(app)
if __name__ == "__main__":
 create_table_if_not_exists()
app.run()

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/', methods=['GET'])
def home():
    """
    Home endpoint with API documentation
    """
    return jsonify({
        "message": "User Management API",
        "endpoints": {
            "GET /api/users": "Get all users",
            "GET /api/users/<user_id>": "Get user by ID",
            "POST /api/users": "Create new user (body: {name, email})",
            "PUT /api/users/<user_id>": "Update user by ID (body: {name, email})",
            "DELETE /api/users/<user_id>": "Delete user by ID"
        }
    }), 200


@app.route('/api/users', methods=['GET'])
def get_users():
    """
    GET endpoint to return a list of all users from DynamoDB
    """
    try:
        table = get_users_table()
        users = list_users(table)

        return jsonify({
            "success": True,
            "data": users,
            "count": len(users)
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/users/<string:user_id>', methods=['GET'])
def get_user(user_id):
    """
    GET endpoint to return a specific user by ID from DynamoDB
    """
    table = get_users_table()
    try:
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")

        if user:
            return jsonify({
                "success": True,
                "data": user
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/users', methods=['POST'])
def add_user():
    """
    POST endpoint to create a new user in DynamoDB
    """
    data = request.get_json()

    if not data or 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields: name and email"
        }), 400

    try:
        table = get_users_table()
        user_id = create_user(
            table=table,
            email=data['email'],
            name=data['name']
        )

        return jsonify({
            "success": True,
            "message": "User created successfully",
            "data": {
                "userId": user_id,
                "name": data['name'],
                "email": data['email']
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    PUT endpoint to update a user by ID in DynamoDB
    """
    data = request.get_json()
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400

    table = get_users_table()
    try:
        # Get existing user
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")

        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        # Update fields
        updated_fields = {}
        if 'name' in data:
            updated_fields['name'] = data['name']
        if 'email' in data:
            updated_fields['email'] = data['email']

        if updated_fields:
            table.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET " + ", ".join(f"{k}=:{k}" for k in updated_fields),
                ExpressionAttributeValues={f":{k}": v for k, v in updated_fields.items()}
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
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    DELETE endpoint to remove a user by ID from DynamoDB
    """
    table = get_users_table()
    try:
        # Check if user exists
        response = table.get_item(Key={"userId": user_id})
        user = response.get("Item")
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        # Delete user
        table.delete_item(Key={"userId": user_id})

        return jsonify({
            "success": True,
            "message": f"User with ID {user_id} deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)

@app.route("/debug/dynamodb")
def debug_dynamodb():
    try:
        table = get_users_table()
        response = table.scan(Limit=1)

        return jsonify({
            "dynamodb": "connected",
            "table": table.name,
            "sampleItemCount": response.get("Count", 0)
        }), 200

    except Exception as e:
        return jsonify({
            "dynamodb": "error",
            "table": None,
            "sampleItemCount": 0,
            "error": str(e)
        }), 200

