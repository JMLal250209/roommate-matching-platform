import boto3
from moto import mock_dynamodb

mock = mock_dynamodb()
mock.start()

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')

def create_users_table():
    existing_tables = dynamodb.meta.client.list_tables()['TableNames']
    if 'Users' not in existing_tables:
        table = dynamodb.create_table(
            TableName='Users',
            KeySchema=[{'AttributeName': 'userId', 'KeyType':'HASH'}],
            AttributeDefinitions=[{'AttributeName':'userId','AttributeType':'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
    return dynamodb.Table('Users')

users_table = create_users_table()

def get_all_users():
    return users_table.scan().get("Items", [])

def create_user(item):
    users_table.put_item(Item=item)
    return item
