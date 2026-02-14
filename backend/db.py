import boto3
import uuid
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key, Attr
from matching_algorithm import assign_animal_archetype

USERS_TABLE_NAME = "HousemateAppUsers"
INTERESTS_TABLE_NAME = "HousemateAppInterests"
PROPERTIES_TABLE_NAME = "Houses"

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")


# =========================
# USERS TABLE
# =========================

def _create_users_table():
    """Create the users table with userId as primary key"""
    dynamodb_client.create_table(
        TableName=USERS_TABLE_NAME,
        KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "userId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )


def get_users_table():
    """Get reference to users table"""
    return dynamodb.Table(USERS_TABLE_NAME)


def create_user(table, email, name, profile_data):
    """
    Create a new user with automatic animal archetype assignment
    
    Args:
        table: DynamoDB users table
        email: User email
        name: User name
        profile_data: Dict containing user profile information
    
    Returns:
        user_id: The generated user ID
    """
    user_id = str(uuid.uuid4())
    
    # Assign animal archetype based on personality
    animal_archetype = assign_animal_archetype(profile_data)
    
    # Build user item with nested profile
    user_item = {
        "userId": user_id,
        "name": name,
        "email": email,
        "animal_archetype": animal_archetype,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "profile": profile_data  # Store entire profile as nested object
    }
    
    table.put_item(Item=user_item)
    return user_id


def update_user_profile(table, user_id, profile_updates):
    """
    Update user profile and recalculate animal archetype if personality changes
    
    Args:
        table: DynamoDB users table
        user_id: User ID to update
        profile_updates: Dict of fields to update
    
    Returns:
        Updated user item
    """
    # Get current user
    response = table.get_item(Key={"userId": user_id})
    current_user = response.get("Item")
    
    if not current_user:
        raise ValueError(f"User {user_id} not found")
    
    # Check if personality-related fields are being updated
    personality_fields = {"wakeTime", "bedtime", "socialPreference", "cleanliness"}
    personality_changed = bool(personality_fields & set(profile_updates.keys()))
    
    # If personality changed, recalculate animal archetype
    if personality_changed:
        # Build profile for archetype calculation
        profile_for_archetype = {
            "wakeTime": profile_updates.get("wakeTime", current_user.get("wakeTime")),
            "bedtime": profile_updates.get("bedtime", current_user.get("bedtime")),
            "socialPreference": profile_updates.get("socialPreference", current_user.get("socialPreference")),
            "cleanliness": profile_updates.get("cleanliness", current_user.get("cleanliness")),
        }
        
        # Recalculate animal archetype
        new_animal = assign_animal_archetype(profile_for_archetype)
        profile_updates["animal_archetype"] = new_animal
    
    # Build update expression
    update_expression_parts = []
    expression_attribute_values = {}
    
    for key, value in profile_updates.items():
        update_expression_parts.append(f"{key} = :{key}")
        expression_attribute_values[f":{key}"] = value
    
    update_expression = "SET " + ", ".join(update_expression_parts)
    
    # Update in database
    response = table.update_item(
        Key={"userId": user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ReturnValues="ALL_NEW"
    )
    
    return response.get("Attributes")


def get_user(table, user_id):
    """Get a single user by ID"""
    response = table.get_item(Key={"userId": user_id})
    return response.get("Item")


def list_users(table):
    """List all users"""
    response = table.scan()
    return response.get("Items", [])


# =========================
# PROPERTIES TABLE
# =========================

def _create_properties_table():
    """Create the properties table"""
    dynamodb_client.create_table(
        TableName=PROPERTIES_TABLE_NAME,
        KeySchema=[{"AttributeName": "propertyId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "propertyId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )


def get_properties_table():
    """Get reference to properties table"""
    return dynamodb.Table(PROPERTIES_TABLE_NAME)


def create_property(table, property_data):
    """
    Create a new property listing
    
    Args:
        property_data: Dict containing:
            - title: Property title
            - description: Property description
            - address: Full address
            - city: City name
            - rent_per_month: Total monthly rent (number)
            - required_roommates: Number of roommates needed (including tenant)
            - bedrooms: Number of bedrooms
            - bathrooms: Number of bathrooms
            - amenities: List of amenities
            - available_from: Date string
            - pets_allowed: True/False
            - smoking_allowed: True/False
            - image_urls: List of image URLs
    
    Returns:
        property_id: Generated property ID
    """
    property_id = str(uuid.uuid4())
    
    property_item = {
        "propertyId": property_id,
        "title": property_data.get("title"),
        "description": property_data.get("description", ""),
        "address": property_data.get("address"),
        "city": property_data.get("city"),
        "rent_per_month": property_data.get("rent_per_month"),
        "required_roommates": property_data.get("required_roommates", 2),
        "bedrooms": property_data.get("bedrooms", 0),
        "bathrooms": property_data.get("bathrooms", 0),
        "amenities": property_data.get("amenities", []),
        "available_from": property_data.get("available_from", ""),
        "pets_allowed": property_data.get("pets_allowed", False),
        "smoking_allowed": property_data.get("smoking_allowed", False),
        "status": property_data.get("status", "available"),
        "image_urls": property_data.get("image_urls", []),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    
    table.put_item(Item=property_item)
    return property_id


def get_property(table, property_id):
    """Get a single property by ID"""
    response = table.get_item(Key={"propertyId": property_id})
    return response.get("Item")


def list_properties(table, status=None):
    """
    List properties, optionally filtered by status
    
    Args:
        status: Optional status filter ("available", "matched", "occupied")
    """
    if status:
        response = table.scan(
            FilterExpression=Attr("status").eq(status)
        )
    else:
        response = table.scan()
    
    return response.get("Items", [])


# =========================
# INTERESTS TABLE
# =========================

def _create_interests_table():
    """
    Create the interests table with GSIs for querying by property or user
    """
    dynamodb_client.create_table(
        TableName=INTERESTS_TABLE_NAME,
        KeySchema=[{"AttributeName": "interestId", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "interestId", "AttributeType": "S"},
            {"AttributeName": "propertyId", "AttributeType": "S"},
            {"AttributeName": "userId", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "PropertyIndex",
                "KeySchema": [{"AttributeName": "propertyId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "UserIndex",
                "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        BillingMode="PAY_PER_REQUEST",
    )


def get_interests_table():
    """Get reference to interests table"""
    return dynamodb.Table(INTERESTS_TABLE_NAME)


def register_property_interest(interests_table, user_id, property_id, budget=None):
    """
    Register a user's interest in a property
    
    Args:
        interests_table: DynamoDB interests table
        user_id: User ID
        property_id: Property ID
        budget: Optional budget for THIS specific property (e.g., "€800/month")
                This is per-property, not stored in user profile
    
    Returns:
        interest_id: Generated interest ID
    """
    # Check if user already registered interest
    existing = get_user_interests(interests_table, user_id)
    for interest in existing:
        if interest.get("propertyId") == property_id:
            # Already registered
            return interest.get("interestId")
    
    interest_id = str(uuid.uuid4())
    
    interest_item = {
        "interestId": interest_id,
        "userId": user_id,
        "propertyId": property_id,
        "registeredAt": datetime.now(timezone.utc).isoformat(),
        "status": "pending",  # pending, matched, withdrawn
    }
    
    # Add budget if provided (optional, per-property)
    if budget:
        interest_item["budget"] = budget
    
    interests_table.put_item(Item=interest_item)
    return interest_id


def get_property_interests(interests_table, property_id, status=None):
    """
    Get all interests for a specific property
    
    Args:
        interests_table: DynamoDB interests table
        property_id: Property ID
        status: Optional status filter ("pending", "matched", "withdrawn")
    
    Returns:
        List of interest records
    """
    if status:
        resp = interests_table.query(
            IndexName="PropertyIndex",
            KeyConditionExpression=Key("propertyId").eq(property_id),
            FilterExpression=Attr("status").eq(status),
        )
    else:
        resp = interests_table.query(
            IndexName="PropertyIndex",
            KeyConditionExpression=Key("propertyId").eq(property_id),
        )
    
    return resp.get("Items", [])


def get_user_interests(interests_table, user_id):
    """
    Get all properties a user has registered interest in
    
    Returns:
        List of interest records
    """
    resp = interests_table.query(
        IndexName="UserIndex",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    return resp.get("Items", [])


def update_interest_status(interests_table, interest_id, status, match_group_id=None):
    """
    Update the status of an interest record
    
    Args:
        interest_id: Interest record ID
        status: New status ("pending", "matched", "withdrawn")
        match_group_id: Optional group ID if matched
    """
    update_expression = "SET #s = :status"
    expr_vals = {":status": status}
    expr_names = {"#s": "status"}

    if status == "matched":
        update_expression += ", matchedGroupId = :gid, matchedAt = :mat"
        expr_vals[":gid"] = match_group_id or str(uuid.uuid4())
        expr_vals[":mat"] = datetime.now(timezone.utc).isoformat()

    resp = interests_table.update_item(
        Key={"interestId": interest_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expr_vals,
        ExpressionAttributeNames=expr_names,
        ReturnValues="ALL_NEW",
    )
    return resp.get("Attributes")


def withdraw_interest(interests_table, interest_id):
    """Withdraw (cancel) an interest registration"""
    return update_interest_status(interests_table, interest_id, "withdrawn")


# =========================
# CREATE TABLES IF NOT EXISTS
# =========================

def create_tables_if_not_exist():
    """Create all required tables if they don't exist"""
    existing_tables = dynamodb_client.list_tables().get("TableNames", [])

    if USERS_TABLE_NAME not in existing_tables:
        print(f"Creating table: {USERS_TABLE_NAME}")
        _create_users_table()

    if INTERESTS_TABLE_NAME not in existing_tables:
        print(f"Creating table: {INTERESTS_TABLE_NAME}")
        _create_interests_table()
    
    if PROPERTIES_TABLE_NAME not in existing_tables:
        print(f"Creating table: {PROPERTIES_TABLE_NAME}")
        _create_properties_table()


# =========================
# HELPER FUNCTIONS
# =========================

def get_full_interest_details(interests_table, users_table, properties_table, interest_id):
    """
    Get complete details for an interest including user and property info
    """
    # Get interest record
    response = interests_table.get_item(Key={"interestId": interest_id})
    interest = response.get("Item")
    
    if not interest:
        return None
    
    # Get user details
    user = get_user(users_table, interest["userId"])
    
    # Get property details
    property_data = get_property(properties_table, interest["propertyId"])
    
    return {
        "interest": interest,
        "user": user,
        "property": property_data
    }