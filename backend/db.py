import boto3
import uuid
from datetime import datetime
from botocore.exceptions import ClientError
from datetime import datetime, timezone

REGION = "eu-west-1"
TABLE_NAME = "Users"


def create_table_if_not_exists():
    dynamodb = boto3.client("dynamodb", region_name=REGION)

    try:
        dynamodb.describe_table(TableName=TABLE_NAME)
        print("Table already exists.")
        return
    except dynamodb.exceptions.ResourceNotFoundException:
        pass

    print("Creating Users table...")

    dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {"AttributeName": "userId", "KeyType": "HASH"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )

    waiter = dynamodb.get_waiter("table_exists")
    waiter.wait(TableName=TABLE_NAME)
    print("Users table is ready.")


def get_table():
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
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

def get_users_table():
    dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
    return dynamodb.Table("Users")





