import pytest
from app import app  
import boto3
from botocore.exceptions import ClientError

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_dynamodb_debug_endpoint(client):
    """Check if /debug/dynamodb returns expected keys"""
    response = client.get('/debug/dynamodb')
    assert response.status_code == 200

    data = response.get_json()
    assert "dynamodb" in data
    assert "table" in data
    assert data["table"] == "Users"
    # sampleItemCount should be present, even if 0
    assert "sampleItemCount" in data


def test_dynamodb_connection_directly():
    """Directly test DynamoDB table connection"""
    dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
    table = dynamodb.Table("Users")

    try:
        response = table.scan(Limit=1)
        # Should return dict with Count key
        assert "Count" in response
    except ClientError as e:
        pytest.fail(f"DynamoDB connection failed: {e}")
