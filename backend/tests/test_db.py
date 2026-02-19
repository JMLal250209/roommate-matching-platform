import os
import pytest
from unittest.mock import MagicMock
from flask import Flask, request
from app import create_app

# ---------------- Mock Classes ----------------
class MockTable:
    name = "HousemateAppUsers"
    def scan(self, Limit=None):
        return {"Count": 0}

# ---------------- Fixtures ----------------
@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    """Mock boto3 and AWS env vars to avoid NoRegionError"""
    monkeypatch.setenv("AWS_DEFAULT_REGION", "eu-west-1")
    # Mock boto3.resource globally
    mock_resource = MagicMock()
    monkeypatch.setattr("boto3.resource", lambda *args, **kwargs: mock_resource)

@pytest.fixture
def client(mocker):
    # Create app in test mode
    app = create_app(testing=True)

    # ---------------- Mock external dependencies ----------------
    mocker.patch("app.get_users_table", return_value=MockTable())
    mocker.patch("app.verify_jwt", return_value={"sub": "mock_user"})
    mocker.patch("app.ensure_user_exists", return_value={"sub": "mock_user"})

    # ---------------- Add a protected test route ----------------
    @app.route("/protected")
    def protected():
        return {"user": request.user["sub"]}

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

def test_protected_endpoint_requires_auth(client, mocker):
    # Remove JWT mock to simulate missing auth
    mocker.patch("app.verify_jwt", return_value=None)
    mocker.patch("app.ensure_user_exists", return_value=None)

    response = client.get("/protected")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data

def test_protected_endpoint_with_mock_token(client):
    response = client.get(
        "/protected",
        headers={"Authorization": "Bearer test"}  # matches mock
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"] == "mock_user"
