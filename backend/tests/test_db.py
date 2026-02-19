import pytest
from app import create_app

# Mock table
class MockTable:
    name = "HousemateAppUsers"

    def scan(self, Limit=None):
        return {"Count": 0}

@pytest.fixture
def client(mocker):
    # Create app in test mode
    app = create_app(testing=True)

    # Patch get_users_table to return the mock
    mocker.patch("app.get_users_table", return_value=MockTable())

    with app.test_client() as client:
        yield client

def test_dynamodb_debug_endpoint(client):
    response = client.get("/debug/dynamodb")
    assert response.status_code == 200

    data = response.get_json()
    assert data["dynamodb"] == "connected"
    assert data["table"] == "HousemateAppUsers"
    assert "sampleItemCount" in data
