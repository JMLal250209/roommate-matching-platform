import pytest
from app import app

class MockTable:
    name = "HousemateAppUsers"

    def scan(self, Limit=None):
        return {"Count": 0}

@pytest.fixture
def client(mocker):
    # Mock the DynamoDB table
    mocker.patch("app.get_users_table", return_value=MockTable())

    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_dynamodb_debug_endpoint(client):
    response = client.get("/debug/dynamodb")
    assert response.status_code == 200

    data = response.get_json()
    assert data["dynamodb"] == "connected"
    assert data["table"] == "HousemateAppUsers"
    assert "sampleItemCount" in data
