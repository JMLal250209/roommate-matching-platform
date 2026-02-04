from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

# Mock data source - list of users
users = [
    {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "created_at": "2024-01-15T10:30:00"
    },
    {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "created_at": "2024-01-16T14:20:00"
    },
    {
        "id": 3,
        "name": "Bob Johnson",
        "email": "bob.johnson@example.com",
        "created_at": "2024-01-17T09:15:00"
    }
]

# Counter for generating new user IDs
next_user_id = 4


@app.route('/api/users', methods=['GET'])
def get_users():
    """
    GET endpoint to return a list of all users
    Returns: JSON array of user objects
    """
    return jsonify({
        "success": True,
        "data": users,
        "count": len(users)
    }), 200


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    GET endpoint to return a specific user by ID
    Returns: JSON object of the user or error message
    """
    user = next((user for user in users if user['id'] == user_id), None)
    
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


@app.route('/api/users', methods=['POST'])
def add_user():
    """
    POST endpoint to add a new user
    Expected JSON body: {"name": "string", "email": "string"}
    Returns: JSON object of the created user
    """
    global next_user_id
    
    # Get JSON data from request
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400
    
    if 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields: name and email"
        }), 400
    
    # Create new user object
    new_user = {
        "id": next_user_id,
        "name": data['name'],
        "email": data['email'],
        "created_at": datetime.now().isoformat()
    }
    
    # Add to mock data source
    users.append(new_user)
    next_user_id += 1
    
    return jsonify({
        "success": True,
        "message": "User created successfully",
        "data": new_user
    }), 201


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    DELETE endpoint to remove a user by ID (bonus endpoint)
    Returns: Success message or error
    """
    global users
    
    user = next((user for user in users if user['id'] == user_id), None)
    
    if user:
        users = [u for u in users if u['id'] != user_id]
        return jsonify({
            "success": True,
            "message": f"User with ID {user_id} deleted successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    PUT endpoint to update a user by ID (bonus endpoint)
    Expected JSON body: {"name": "string", "email": "string"}
    Returns: Updated user object or error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400
    
    user = next((user for user in users if user['id'] == user_id), None)
    
    if user:
        # Update fields if provided
        if 'name' in data:
            user['name'] = data['name']
        if 'email' in data:
            user['email'] = data['email']
        
        return jsonify({
            "success": True,
            "message": "User updated successfully",
            "data": user
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404


@app.route('/', methods=['GET'])
def home():
    """
    Home endpoint with API documentation
    """
    return jsonify({
        "message": "User Management API",
        "endpoints": {
            "GET /api/users": "Get all users",
            "GET /api/users/<id>": "Get user by ID",
            "POST /api/users": "Create new user (body: {name, email})",
            "PUT /api/users/<id>": "Update user by ID (body: {name, email})",
            "DELETE /api/users/<id>": "Delete user by ID"
        }
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)