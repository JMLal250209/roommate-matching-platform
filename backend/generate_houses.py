print("generate_houses.py started")


import boto3
import uuid
from datetime import datetime, timedelta
import random

# DynamoDB setup
dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
table = dynamodb.Table("Houses")

AMENITIES = [
    "WiFi", "Washing Machine", "Dishwasher",
    "Heating", "Balcony", "Parking", "Gym"
]

DUBLIN_AREAS = [
    "Dublin 1", "Dublin 2", "Dublin 4",
    "Dublin 6", "Dublin 7", "Dublin 8",
    "Dublin 9", "Dublin 12", "Dublin 14"
]

for i in range(1, 51):  # 50 houses
    item = {
        "propertyId": str(uuid.uuid4()),
        "createdAt": datetime.utcnow().isoformat(),
        "title": f"Modern Apartment in {random.choice(DUBLIN_AREAS)}",
        "description": "Bright and fully furnished apartment close to public transport.",
        "address": f"{random.randint(1, 120)} Example Street",
        "city": "Dublin",
        "rent_per_month": random.randint(700, 1600),
        "required_roommates": random.randint(1, 3),
        "bedrooms": random.randint(1, 4),
        "bathrooms": random.randint(1, 2),
        "amenities": random.sample(AMENITIES, random.randint(2, 5)),
        "available_from": (
            datetime.utcnow() + timedelta(days=random.randint(0, 30))
        ).date().isoformat(),
        "pets_allowed": random.choice([True, False]),
        "smoking_allowed": False,
        "status": "available",
        "image": f"house_{i}.jpeg"
    }

    table.put_item(Item=item)
    print(f"Inserted house {i}")

print("All houses inserted successfully!")
