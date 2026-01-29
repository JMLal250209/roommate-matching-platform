import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from db import get_all_users, create_user
import uuid
import pprint

pp = pprint.PrettyPrinter(indent=2)

print("Initial users:")
pp.pprint(get_all_users())

user1 = {
    "userId": str(uuid.uuid4()),
    "name": "Alice",
    "email": "alice@example.com",
    "budgetMin": 600,
    "budgetMax": 900,
    "preferredLocations": ["Dublin 2", "Dublin 4"],
    "smoker": False,
    "petFriendly": True
}

create_user(user1)
print("\nAfter adding Alice:")
pp.pprint(get_all_users())
