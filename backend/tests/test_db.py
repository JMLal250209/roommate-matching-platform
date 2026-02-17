import pytest

@pytest.fixture(scope="session", autouse=True)
def mock_dynamodb_init(mocker):
    # Mock DynamoDB init before app is imported
    mocker.patch("app.create_table_if_not_exists")

from app import app 

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
    assert data["table"] == "HousemateAppUsers"
    # sampleItemCount should be present, even if 0
    assert "sampleItemCount" in data


