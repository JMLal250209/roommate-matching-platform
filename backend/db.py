import boto3
import uuid
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key, Attr

USERS_TABLE_NAME = "HousemateAppUsers"
INTERESTS_TABLE_NAME = "HousemateAppInterests"

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")


# =========================
# USERS TABLE
# =========================

def _create_users_table():
    dynamodb_client.create_table(
        TableName=USERS_TABLE_NAME,
        KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "userId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )


def get_users_table():
    return dynamodb.Table(USERS_TABLE_NAME)


def create_user(users_table, name, email):
    user_id = str(uuid.uuid4())
    users_table.put_item(
        Item={
            "userId": user_id,
            "name": name,
            "email": email,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
    )
    return user_id


def list_users(users_table):
    response = users_table.scan()
    return response.get("Items", [])


# =========================
# INTERESTS TABLE
# =========================

def _create_interests_table():
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
    return dynamodb.Table(INTERESTS_TABLE_NAME)


def register_property_interest(interests_table, user_id, property_id):
    interest_id = str(uuid.uuid4())
    interests_table.put_item(
        Item={
            "interestId": interest_id,
            "userId": user_id,
            "propertyId": property_id,
            "registeredAt": datetime.now(timezone.utc).isoformat(),
            "status": "pending",
        }
    )
    return interest_id


def get_pending_interests_for_property(interests_table, property_id):
    # NOTE: Querying a GSI is eventually consistent. Even with this filter,
    # the index can lag briefly after an update.
    resp = interests_table.query(
        IndexName="PropertyIndex",
        KeyConditionExpression=Key("propertyId").eq(property_id),
        FilterExpression=Attr("status").eq("pending"),
    )
    return resp.get("Items", [])


def update_interest_status(interests_table, interest_id, status, match_group_id=None, matched_at=None):
    update_expression = "SET #s = :status"
    expr_vals = {":status": status}
    expr_names = {"#s": "status"}

    if status == "matched":
        update_expression += ", matchedGroupId = :gid, matchedAt = :mat"
        expr_vals[":gid"] = match_group_id
        expr_vals[":mat"] = matched_at or datetime.now(timezone.utc).isoformat()

    resp = interests_table.update_item(
        Key={"interestId": interest_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expr_vals,
        ExpressionAttributeNames=expr_names,
        ReturnValues="ALL_NEW",
    )
    return resp.get("Attributes")


def get_user_interests(interests_table, user_id):
    resp = interests_table.query(
        IndexName="UserIndex",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    return resp.get("Items", [])


# =========================
# CREATE TABLES IF NOT EXISTS
# =========================

def create_table_if_not_exists():
    existing_tables = dynamodb_client.list_tables().get("TableNames", [])

    if USERS_TABLE_NAME not in existing_tables:
        _create_users_table()

    if INTERESTS_TABLE_NAME not in existing_tables:
        _create_interests_table()
