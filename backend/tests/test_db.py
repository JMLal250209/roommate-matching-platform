import time
import uuid
import pytest
import boto3
from botocore.exceptions import ClientError
from app import app

USERS_TABLE = "HousemateAppUsers"
INTERESTS_TABLE = "HousemateAppInterests"
REGION = "eu-west-1"


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_users_table_connection_directly():
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    table = dynamodb.Table(USERS_TABLE)
    try:
        resp = table.scan(Limit=1)
        assert "Count" in resp
    except ClientError as e:
        pytest.fail(f"Users table connection failed: {e}")


def test_interests_table_connection_directly():
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    table = dynamodb.Table(INTERESTS_TABLE)
    try:
        resp = table.scan(Limit=1)
        assert "Count" in resp
    except ClientError as e:
        pytest.fail(f"Interests table connection failed: {e}")


def test_interest_flow_end_to_end(client):
    # Use a unique propertyId each run to avoid old records affecting results
    property_id = f"property-e2e-{uuid.uuid4()}"

    # 1) create user
    r = client.post("/api/users", json={"name": "Pytest User", "email": f"pytest+{uuid.uuid4()}@example.com"})
    assert r.status_code == 201
    user_id = r.get_json()["userId"]
    assert user_id

    # 2) register interest
    r = client.post("/api/interests", json={"userId": user_id, "propertyId": property_id})
    assert r.status_code == 201
    interest_id = r.get_json()["interestId"]
    assert interest_id

    # 3) user interests should include it as pending
    r = client.get(f"/api/interests/user/{user_id}")
    assert r.status_code == 200
    items = r.get_json()
    assert any(x.get("interestId") == interest_id and x.get("status") == "pending" for x in items)

    # 4) pending for property should include it
    r = client.get(f"/api/interests/property/{property_id}/pending")
    assert r.status_code == 200
    pending = r.get_json()
    assert any(x.get("interestId") == interest_id for x in pending)

    # 5) update to matched (and verify response item says matched)
    r = client.patch(f"/api/interests/{interest_id}", json={"status": "matched", "matchedGroupId": "group-e2e-001"})
    assert r.status_code == 200
    updated = r.get_json()["item"]
    assert updated["interestId"] == interest_id
    assert updated["status"] == "matched"

    # 6) pending list should no longer include it
    # NOTE: GSI is eventually consistent, so retry a few times.
    for _ in range(10):
        r = client.get(f"/api/interests/property/{property_id}/pending")
        assert r.status_code == 200
        pending = r.get_json()
        if all(x.get("interestId") != interest_id for x in pending):
            break
        time.sleep(0.2)
    else:
        pytest.fail("Interest still appeared in pending list after retries (GSI propagation delay too long?)")
