import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
table = dynamodb.Table("GreenComputingStats")

table.put_item(Item={
    "statId": "test-001",
    "period": "daily",
    "timestamp": "2026-03-24T12:00:00Z",
    "invocations": 142,
    "total_duration_ms": 38400,
    "gb_seconds": Decimal("0.019"),
    "estimated_kwh": Decimal("0.0000053"),
    "co2_kg": Decimal("0.0000017"),
})

print("Inserted successfully!")
