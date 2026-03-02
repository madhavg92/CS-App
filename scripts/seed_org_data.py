import sys
import asyncio
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv
import uuid

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_org_data():
    # Clear existing data
    await db.lobs.delete_many({})
    await db.team_members.delete_many({})
    await db.client_lob_mappings.delete_many({})
    await db.scheduled_reviews.delete_many({})
    
    # Sample LOBs
    lobs = [
        {
            "id": "lob-1",
            "name": "EV (Eligibility Verification)",
            "description": "Patient eligibility and benefits verification"
        },
        {
            "id": "lob-2",
            "name": "Prior Authorization",
            "description": "Prior auth requests and approvals"
        },
        {
            "id": "lob-3",
            "name": "Coding",
            "description": "Medical coding and documentation"
        },
        {
            "id": "lob-4",
            "name": "Billing",
            "description": "Claims submission and billing"
        },
        {
            "id": "lob-5",
            "name": "AR (Accounts Receivable)",
            "description": "AR follow-up and collections"
        },
        {
            "id": "lob-6",
            "name": "Payment Posting",
            "description": "Payment posting and reconciliation"
        }
    ]
    
    await db.lobs.insert_many(lobs)
    
    # Sample Anka Team Members
    team_members = [
        {
            "id": "tm-1",
            "name": "Maria Rodriguez",
            "role": "manager",
            "email": "maria.rodriguez@anka.com",
            "phone": "555-1001",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tm-2",
            "name": "James Wilson",
            "role": "manager",
            "email": "james.wilson@anka.com",
            "phone": "555-1002",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tm-3",
            "name": "Priya Patel",
            "role": "supervisor",
            "email": "priya.patel@anka.com",
            "phone": "555-1003",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tm-4",
            "name": "Carlos Mendez",
            "role": "supervisor",
            "email": "carlos.mendez@anka.com",
            "phone": "555-1004",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tm-5",
            "name": "Emily Chen",
            "role": "team_lead",
            "email": "emily.chen@anka.com",
            "phone": "555-1005",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "tm-6",
            "name": "David Kim",
            "role": "team_lead",
            "email": "david.kim@anka.com",
            "phone": "555-1006",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.team_members.insert_many(team_members)
    
    # Sample Client LOB Mappings for Springfield General Hospital (client-1)
    mappings = [
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "lob_id": "lob-2",
            "lob_name": "Prior Authorization",
            "anka_team_members": ["tm-1", "tm-3"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "lob_id": "lob-3",
            "lob_name": "Coding",
            "anka_team_members": ["tm-2", "tm-5"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "lob_id": "lob-5",
            "lob_name": "AR (Accounts Receivable)",
            "anka_team_members": ["tm-1", "tm-4"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.client_lob_mappings.insert_many(mappings)
    
    # Sample Scheduled Reviews
    today = datetime.now(timezone.utc)
    reviews = [
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "review_type": "weekly",
            "scheduled_date": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "scheduled_time": "10:00",
            "duration_minutes": 60,
            "attendees": ["tm-1", "tm-3"],
            "attendee_names": ["Maria Rodriguez", "Priya Patel"],
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "review_type": "weekly",
            "scheduled_date": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "scheduled_time": "14:00",
            "duration_minutes": 60,
            "attendees": ["tm-2", "tm-4"],
            "attendee_names": ["James Wilson", "Carlos Mendez"],
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-3",
            "client_name": "Mountain View Clinic Network",
            "review_type": "monthly",
            "scheduled_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
            "scheduled_time": "11:00",
            "duration_minutes": 90,
            "attendees": ["tm-1", "tm-2", "tm-5"],
            "attendee_names": ["Maria Rodriguez", "James Wilson", "Emily Chen"],
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.scheduled_reviews.insert_many(reviews)
    
    print("✅ Org structure data seeded successfully!")
    print(f"   - {len(lobs)} LOBs")
    print(f"   - {len(team_members)} team members")
    print(f"   - {len(mappings)} client-LOB mappings")
    print(f"   - {len(reviews)} scheduled reviews")

if __name__ == "__main__":
    asyncio.run(seed_org_data())
