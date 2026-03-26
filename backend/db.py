import boto3
import uuid
import decimal
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key, Attr
from matching_algorithm import assign_animal_archetype

USERS_TABLE_NAME = "HousemateAppUsers"
INTERESTS_TABLE_NAME = "HousemateAppInterests"
PROPERTIES_TABLE_NAME = "Houses"
GREEN_STATS_TABLE_NAME = "GreenComputingStats"

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")


# =========================
# DECIMAL HELPER
# =========================

def _deserialize(obj):
    """
    Recursively convert decimal.Decimal values returned by DynamoDB into
    int or float so Flask's jsonify() never throws a serialization error.

    DynamoDB stores ALL numbers as Decimal regardless of how they were saved.
    This includes fields like required_roommates, rent_per_month, age, bedrooms,
    bathrooms, and any numeric value inside a nested 'profile' dict.

    Call this on every Item before returning it from a db function.
    """
    if isinstance(obj, list):
        return [_deserialize(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _deserialize(v) for k, v in obj.items()}
    if isinstance(obj, decimal.Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


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

    animal_archetype = assign_animal_archetype(profile_data)

    user_item = {
        "userId": user_id,
        "name": name,
        "email": email,
        "animal_archetype": animal_archetype,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "profile": profile_data,
    }

    table.put_item(Item=user_item)
    return user_id


def update_user_profile(table, user_id, profile_updates):
    """
    Update user profile and recalculate animal archetype if personality changes
    FIXED: Handles reserved keywords by storing profile as nested object

    Args:
        table: DynamoDB users table
        user_id: User ID to update
        profile_updates: Dict of fields to update

    Returns:
        Updated user item (Decimals already deserialized)
    """
    response = table.get_item(Key={"userId": user_id})
    current_user = response.get("Item")

    if not current_user:
        raise ValueError(f"User {user_id} not found")

    # Get current profile or empty dict
    current_profile = current_user.get("profile", {})

    # Merge updates with current profile
    updated_profile = {**current_profile, **profile_updates}

    personality_fields = {
    "wakeTime", "bedtime",
    "noise_level",           # was missing
    "socialPreference",
    "cleanliness",
}
    personality_changed = bool(personality_fields & set(profile_updates.keys()))
    
    # Build update expression
    update_expression_parts = ["profile = :profile", "updatedAt = :updatedAt"]
    expression_attribute_values = {
        ":profile": updated_profile,
        ":updatedAt": datetime.now(timezone.utc).isoformat()
    }

    if personality_changed:
        # Pass the full nested profile so get_profile_field() can find everything
        new_animal = assign_animal_archetype({"profile": updated_profile})
        update_expression_parts.append("animal_archetype = :animal")
        expression_attribute_values[":animal"] = new_animal

    update_expression = "SET " + ", ".join(update_expression_parts)

    response = table.update_item(
        Key={"userId": user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ReturnValues="ALL_NEW",
    )

    return _deserialize(response.get("Attributes"))


def get_user(table, user_id):
    """Get a single user by ID (Decimals deserialized)"""
    response = table.get_item(Key={"userId": user_id})
    item = response.get("Item")
    return _deserialize(item) if item else None


def list_users(table):
    """List all users (Decimals deserialized)"""
    response = table.scan()
    return [_deserialize(item) for item in response.get("Items", [])]


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
        property_data: Dict containing title, address, rent_per_month,
                       required_roommates, bedrooms, bathrooms, etc.

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
    """Get a single property by ID (Decimals deserialized)"""
    response = table.get_item(Key={"propertyId": property_id})
    item = response.get("Item")
    return _deserialize(item) if item else None


def list_properties(table, status=None):
    """
    List properties, optionally filtered by status (Decimals deserialized)

    Args:
        status: Optional status filter ("available", "matched", "occupied")
    """
    if status:
        response = table.scan(FilterExpression=Attr("status").eq(status))
    else:
        response = table.scan()

    return [_deserialize(item) for item in response.get("Items", [])]


# =========================
# INTERESTS TABLE
# =========================

def _create_interests_table():
    """Create the interests table with GSIs for querying by property or user"""
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
    existing = get_user_interests(interests_table, user_id)
    for interest in existing:
        if interest.get("propertyId") == property_id:
            status = interest.get("status")

            # Active interest already exists — return it as-is
            if status in ("pending", "matched"):
                return interest.get("interestId")

            # Was withdrawn — reset it to pending so it's active again
            if status == "withdrawn":
                interest_id = interest.get("interestId")
                interests_table.update_item(
                    Key={"interestId": interest_id},
                    UpdateExpression="SET #s = :status, registeredAt = :rat",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={
                        ":status": "pending",
                        ":rat": datetime.now(timezone.utc).isoformat(),
                    },
                )
                return interest_id

    # No existing record — create a fresh one
    interest_id = str(uuid.uuid4())
    interest_item = {
        "interestId": interest_id,
        "userId": user_id,
        "propertyId": property_id,
        "registeredAt": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    if budget:
        interest_item["budget"] = budget

    interests_table.put_item(Item=interest_item)
    return interest_id


def get_property_interests(interests_table, property_id, status=None):
    """
    Get all interests for a specific property (Decimals deserialized).

    Args:
        interests_table: DynamoDB interests table
        property_id: Property ID
        status: Optional filter — "pending", "matched", or "withdrawn"

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

    return [_deserialize(item) for item in resp.get("Items", [])]


def get_user_interests(interests_table, user_id):
    """
    Get all interests registered by a user (Decimals deserialized).

    Returns:
        List of interest records
    """
    resp = interests_table.query(
        IndexName="UserIndex",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    return [_deserialize(item) for item in resp.get("Items", [])]


def update_interest_status(interests_table, interest_id, status, match_group_id=None):
    """
    Update the status of an interest record.

    Args:
        interests_table: DynamoDB interests table
        interest_id: Interest record ID
        status: New status — "pending", "matched", or "withdrawn"
        match_group_id: Shared group UUID assigned when status is "matched"

    Returns:
        Updated interest record (Decimals deserialized)
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
    return _deserialize(resp.get("Attributes"))

def mark_interest_seen(interests_table, interest_id: str, seen_at: str):
    """Sets seenAt timestamp. Called when user opens matches tab."""
    interests_table.update_item(
        Key={"interestId": interest_id},
        UpdateExpression="SET seenAt = :seen",
        ExpressionAttributeValues={":seen": seen_at},
    )

def withdraw_interest(interests_table, interest_id):
    """Withdraw (cancel) an interest registration"""
    return update_interest_status(interests_table, interest_id, "withdrawn")


# =========================
# GREEN COMPUTING STATS TABLE
# =========================

def _create_green_stats_table():
    """Create GreenComputingStats table with period+timestamp GSI for querying trends"""
    dynamodb_client.create_table(
        TableName=GREEN_STATS_TABLE_NAME,
        KeySchema=[{"AttributeName": "statId", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "statId", "AttributeType": "S"},
            {"AttributeName": "period", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "PeriodTimestampIndex",
                "KeySchema": [
                    {"AttributeName": "period", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
        BillingMode="PAY_PER_REQUEST",
    )


def get_green_stats_table():
    """Get reference to GreenComputingStats table"""
    return dynamodb.Table(GREEN_STATS_TABLE_NAME)


def get_latest_green_stats(table, limit=7):
    """
    Query the most recent daily stats records (up to `limit` items).
    Returns records sorted newest-first.
    """
    resp = table.query(
        IndexName="PeriodTimestampIndex",
        KeyConditionExpression=Key("period").eq("daily"),
        ScanIndexForward=False,
        Limit=limit,
    )
    return [_deserialize(item) for item in resp.get("Items", [])]


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

    if GREEN_STATS_TABLE_NAME not in existing_tables:
        print(f"Creating table: {GREEN_STATS_TABLE_NAME}")
        _create_green_stats_table()


# =========================
# HELPER FUNCTIONS
# =========================

def get_full_interest_details(interests_table, users_table, properties_table, interest_id):
    """Get complete details for an interest including user and property info"""
    response = interests_table.get_item(Key={"interestId": interest_id})
    interest = response.get("Item")

    if not interest:
        return None

    return {
        "interest": _deserialize(interest),
        "user": get_user(users_table, interest["userId"]),
        "property": get_property(properties_table, interest["propertyId"]),
    }