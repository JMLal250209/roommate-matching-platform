from flask import Blueprint, jsonify, request
import boto3
from botocore.exceptions import ClientError

auth_bp = Blueprint("auth", __name__)

# Cognito client
cognito_client = boto3.client('cognito-idp', region_name='eu-west-1')
COGNITO_APP_CLIENT_ID = "6blkd9ld1fb05ulmj8p8s5g9tb"


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    """
    Sign up a new user in Cognito and auto-confirm them
    No JWT required - this is a public endpoint
    """
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', '')
    
    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400
    
    try:
        # Sign up user
        response = cognito_client.sign_up(
            ClientId=COGNITO_APP_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name}
            ]
        )
        
        # AUTO-CONFIRM the user (this is the fix!)
        cognito_client.admin_confirm_sign_up(
            UserPoolId='eu-west-1_VD22hpVPA',
            Username=email
        )
        
        return jsonify({
            "success": True,
            "message": "User signed up and confirmed successfully. You can now login!",
            "data": {
                "userId": response['UserSub'],
                "email": email,
                "confirmed": True
            }
        }), 201
        
    except cognito_client.exceptions.UsernameExistsException:
        return jsonify({
            "success": False,
            "error": "User with this email already exists"
        }), 409
        
    except cognito_client.exceptions.InvalidPasswordException as e:
        return jsonify({
            "success": False,
            "error": "Password does not meet requirements",
            "details": str(e)
        }), 400
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@auth_bp.route("/api/auth/confirm", methods=["POST"])
def confirm_signup():
    """
    Confirm user email with verification code
    No JWT required - this is a public endpoint
    """
    data = request.get_json()
    
    email = data.get('email')
    code = data.get('code')
    
    if not email or not code:
        return jsonify({
            "success": False,
            "error": "Email and verification code are required"
        }), 400
    
    try:
        cognito_client.confirm_sign_up(
            ClientId=COGNITO_APP_CLIENT_ID,
            Username=email,
            ConfirmationCode=code
        )
        
        return jsonify({
            "success": True,
            "message": "Email confirmed successfully. You can now login."
        }), 200
        
    except cognito_client.exceptions.CodeMismatchException:
        return jsonify({
            "success": False,
            "error": "Invalid verification code"
        }), 400
        
    except cognito_client.exceptions.ExpiredCodeException:
        return jsonify({
            "success": False,
            "error": "Verification code has expired"
        }), 400
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """
    Login user and return JWT tokens
    No JWT required - this is a public endpoint
    """
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400
    
    try:
        response = cognito_client.initiate_auth(
            ClientId=COGNITO_APP_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        tokens = response['AuthenticationResult']
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "idToken": tokens['IdToken'],
                "accessToken": tokens['AccessToken'],
                "refreshToken": tokens['RefreshToken'],
                "expiresIn": tokens['ExpiresIn']
            }
        }), 200
        
    except cognito_client.exceptions.NotAuthorizedException:
        return jsonify({
            "success": False,
            "error": "Incorrect email or password"
        }), 401
        
    except cognito_client.exceptions.UserNotConfirmedException:
        return jsonify({
            "success": False,
            "error": "Email not confirmed. Please check your email for verification code."
        }), 403
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@auth_bp.route("/api/auth/refresh", methods=["POST"])
def refresh():
    """
    Refresh expired JWT token using refresh token
    No JWT required - this is a public endpoint
    """
    data = request.get_json()
    
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({
            "success": False,
            "error": "Refresh token is required"
        }), 400
    
    try:
        response = cognito_client.initiate_auth(
            ClientId=COGNITO_APP_CLIENT_ID,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token
            }
        )
        
        tokens = response['AuthenticationResult']
        
        return jsonify({
            "success": True,
            "message": "Token refreshed successfully",
            "data": {
                "idToken": tokens['IdToken'],
                "accessToken": tokens['AccessToken'],
                "expiresIn": tokens['ExpiresIn']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Invalid or expired refresh token"
        }), 401


@auth_bp.route("/api/auth/me", methods=["GET"])
def get_current_user():
    """
    Get the current authenticated user's information.
    JWT required - protected by app-level authentication.
    """
    return jsonify({
        "success": True,
        "data": request.user
    }), 200