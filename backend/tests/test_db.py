import pytest
from app import create_app
from flask import request
# ---------------- Mock Classes ----------------
class MockTable:
    name = "HousemateAppUsers"
    def scan(self, Limit=None):
        return {"Count": 0}

# ---------------- Fixtures ----------------
@pytest.fixture
def client(mocker):
    # Create app in test mode
    app = create_app(testing=True)

    # Fully mock external dependencies
    mocker.patch("app.get_users_table", return_value=MockTable())
    mocker.patch("app.verify_jwt", return_value={"sub": "mock_user"})
    mocker.patch("app.ensure_user_exists", return_value={"sub": "mock_user"})

    with app.test_client() as client:
        yield client

# ---------------- Tests ----------------
def test_dynamodb_debug_endpoint(client):
    response = client.get("/debug/dynamodb")
    assert response.status_code == 200
    data = response.get_json()
    assert data["dynamodb"] == "connected"
    assert data["table"] == "HousemateAppUsers"
    assert data["sampleItemCount"] == 0

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"

def test_protected_endpoint_requires_auth(client):
    @client.application.route("/protected")
    def protected():
        return {"user": getattr(request, "user", None)}

    response = client.get("/protected")
    # No auth header -> 401
    assert response.status_code == 401

def test_protected_endpoint_with_mock_token(client):
    @client.application.route("/protected")
    def protected():
        return {"user": request.user["sub"]}

    response = client.get(
        "/protected",
        headers={"Authorization": "Bearer test"}  # matches mock
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"] == "mock_user"
