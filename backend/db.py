import boto3
import uuid
from datetime import datetime, timezone

REGION = "eu-west-1"
TABLE_NAME = "HousemateAppUsers"

# Use default credentials from AWS CLI (~/.aws/credentials)
session = boto3.Session()

def create_table_if_not_exists():
    dynamodb_client = session.client("dynamodb", region_name=REGION)

    try:
        dynamodb_client.describe_table(TableName=TABLE_NAME)
        print("Table already exists.")
        return
    except dynamodb_client.exceptions.ResourceNotFoundException:
        pass

    print("Creating HousemateAppUsers table...")

    dynamodb_client.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {"AttributeName": "userId", "KeyType": "HASH"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )

    waiter = dynamodb_client.get_waiter("table_exists")
    waiter.wait(TableName=TABLE_NAME)
    print("HousemateAppUsers table is ready.")


def get_users_table():
    dynamodb = session.resource("dynamodb", region_name=REGION)
    return dynamodb.Table(TABLE_NAME)


def create_user(table, email, name):
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    table.put_item(
        Item={
            "userId": user_id,
            "email": email,
            "name": name,
            "createdAt": now,
        }
    )

    return user_id


def list_users(table):
    response = table.scan()
    return response.get("Items", [])
