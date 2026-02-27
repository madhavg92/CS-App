import sys
import asyncio
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    # Clear existing data
    await db.clients.delete_many({})
    await db.performance_metrics.delete_many({})
    await db.alerts.delete_many({})
    await db.followups.delete_many({})
    await db.communications.delete_many({})
    
    # Sample clients
    clients = [
        {
            "id": "client-1",
            "name": "Springfield General Hospital",
            "status": "healthy",
            "health_score": 92,
            "relationship_owner": "Sarah Johnson",
            "last_engagement": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "next_qbr": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "contract_value": 450000.0,
            "renewal_date": (datetime.now(timezone.utc) + timedelta(days=180)).isoformat(),
            "contacts": [
                {
                    "id": "contact-1",
                    "name": "Dr. Michael Chen",
                    "title": "Chief Medical Officer",
                    "email": "m.chen@springfield.health",
                    "phone": "555-0101",
                    "role": "decision-maker",
                    "last_contact": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
                    "notes": "Key decision maker, prefers data-driven presentations"
                },
                {
                    "id": "contact-2",
                    "name": "Jennifer Martinez",
                    "title": "Director of Operations",
                    "email": "j.martinez@springfield.health",
                    "phone": "555-0102",
                    "role": "influencer",
                    "last_contact": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
                    "notes": "Day-to-day contact, very responsive"
                }
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
        },
        {
            "id": "client-2",
            "name": "Riverside Medical Center",
            "status": "at-risk",
            "health_score": 65,
            "relationship_owner": "David Park",
            "last_engagement": (datetime.now(timezone.utc) - timedelta(days=18)).isoformat(),
            "next_qbr": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
            "contract_value": 320000.0,
            "renewal_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
            "contacts": [
                {
                    "id": "contact-3",
                    "name": "Robert Williams",
                    "title": "VP of Finance",
                    "email": "r.williams@riverside.med",
                    "phone": "555-0201",
                    "role": "decision-maker",
                    "last_contact": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
                    "notes": "Cost-conscious, needs ROI justification"
                }
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=200)).isoformat()
        },
        {
            "id": "client-3",
            "name": "Mountain View Clinic Network",
            "status": "healthy",
            "health_score": 88,
            "relationship_owner": "Emily Rodriguez",
            "last_engagement": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "next_qbr": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
            "contract_value": 275000.0,
            "renewal_date": (datetime.now(timezone.utc) + timedelta(days=240)).isoformat(),
            "contacts": [
                {
                    "id": "contact-4",
                    "name": "Dr. Lisa Thompson",
                    "title": "Network Administrator",
                    "email": "l.thompson@mountainview.health",
                    "phone": "555-0301",
                    "role": "decision-maker",
                    "last_contact": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
                    "notes": "Tech-savvy, interested in innovation"
                },
                {
                    "id": "contact-5",
                    "name": "James Anderson",
                    "title": "IT Manager",
                    "email": "j.anderson@mountainview.health",
                    "phone": "555-0302",
                    "role": "user",
                    "last_contact": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
                    "notes": "Technical point of contact"
                }
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=150)).isoformat()
        }
    ]
    
    await db.clients.insert_many(clients)
    
    # Performance metrics
    metrics = [
        {
            "id": "metric-1",
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "week_ending": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "denials_worked": 245,
            "denials_recovered": 198,
            "recovery_rate": 80.82,
            "dollars_recovered": 156780.50,
            "sla_compliance": 96.5,
            "error_rate": 2.1,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        },
        {
            "id": "metric-2",
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "week_ending": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat(),
            "denials_worked": 232,
            "denials_recovered": 185,
            "recovery_rate": 79.74,
            "dollars_recovered": 142340.25,
            "sla_compliance": 95.2,
            "error_rate": 2.5,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        },
        {
            "id": "metric-3",
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "week_ending": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "denials_worked": 178,
            "denials_recovered": 123,
            "recovery_rate": 69.10,
            "dollars_recovered": 98450.75,
            "sla_compliance": 88.5,
            "error_rate": 4.2,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        },
        {
            "id": "metric-4",
            "client_id": "client-3",
            "client_name": "Mountain View Clinic Network",
            "week_ending": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "denials_worked": 156,
            "denials_recovered": 134,
            "recovery_rate": 85.90,
            "dollars_recovered": 112890.00,
            "sla_compliance": 97.8,
            "error_rate": 1.5,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        }
    ]
    
    await db.performance_metrics.insert_many(metrics)
    
    # Alerts
    alerts = [
        {
            "id": "alert-1",
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "alert_type": "engagement_gap",
            "severity": "high",
            "message": "No 1:1 engagement with key stakeholder Robert Williams in 30 days. Recommend immediate outreach.",
            "status": "open",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": "alert-2",
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "alert_type": "scope_creep",
            "severity": "medium",
            "message": "Client requesting additional services beyond contracted scope. Review and discuss contract amendment.",
            "status": "open",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        },
        {
            "id": "alert-3",
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "alert_type": "innovation_update",
            "severity": "low",
            "message": "Client not briefed on new AI-powered denial prediction feature launched 45 days ago.",
            "status": "open",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        }
    ]
    
    await db.alerts.insert_many(alerts)
    
    # Follow-ups
    followups = [
        {
            "id": "followup-1",
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "description": "Schedule QBR to discuss recent performance decline and renewal strategy",
            "priority": "high",
            "action_type": "call",
            "days_open": 5,
            "owner": "David Park",
            "suggested_action": "Call Robert Williams to schedule 1-hour QBR within next 2 weeks. Prepare performance improvement plan.",
            "status": "pending",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        },
        {
            "id": "followup-2",
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "description": "Send monthly check-in email with latest product updates",
            "priority": "medium",
            "action_type": "email",
            "days_open": 2,
            "owner": "Sarah Johnson",
            "suggested_action": "Draft email highlighting Q1 innovations and schedule demo of AI denial prediction tool.",
            "status": "pending",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "id": "followup-3",
            "client_id": "client-3",
            "client_name": "Mountain View Clinic Network",
            "description": "Follow up on technical integration questions from last call",
            "priority": "medium",
            "action_type": "email",
            "days_open": 1,
            "owner": "Emily Rodriguez",
            "suggested_action": "Send technical documentation for API integration and offer follow-up call with engineering team.",
            "status": "pending",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        }
    ]
    
    await db.followups.insert_many(followups)
    
    # Communications
    communications = [
        {
            "id": "comm-1",
            "client_id": "client-1",
            "client_name": "Springfield General Hospital",
            "comm_type": "call",
            "subject": "Weekly Status Call",
            "summary": "Discussed Q1 performance metrics. Client very satisfied with 80% recovery rate and low error rates. Jennifer mentioned upcoming budget planning and requested cost-benefit analysis for renewal.",
            "sentiment": "positive",
            "action_items": [
                "Prepare cost-benefit analysis by end of week",
                "Schedule follow-up with CFO for budget discussion"
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "id": "comm-2",
            "client_id": "client-2",
            "client_name": "Riverside Medical Center",
            "comm_type": "email",
            "subject": "Performance Review Request",
            "summary": "Client expressed concerns about recent decline in recovery rates and increased error rates. Requested detailed root cause analysis and improvement plan.",
            "sentiment": "negative",
            "action_items": [
                "Conduct internal performance audit",
                "Prepare improvement action plan",
                "Schedule meeting with client leadership"
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        },
        {
            "id": "comm-3",
            "client_id": "client-3",
            "client_name": "Mountain View Clinic Network",
            "comm_type": "meeting",
            "subject": "QBR - Q4 2025 Review",
            "summary": "Excellent QBR session. Dr. Thompson praised team responsiveness and technical capabilities. Discussed expansion to two additional clinic locations in Q2 2026. Potential upsell opportunity of $75K.",
            "sentiment": "positive",
            "action_items": [
                "Draft expansion proposal for 2 new locations",
                "Coordinate implementation timeline with ops team",
                "Schedule contract negotiation call"
            ],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        }
    ]
    
    await db.communications.insert_many(communications)
    
    print("✅ Sample data seeded successfully!")
    print(f"   - {len(clients)} clients")
    print(f"   - {len(metrics)} performance metrics")
    print(f"   - {len(alerts)} alerts")
    print(f"   - {len(followups)} follow-up items")
    print(f"   - {len(communications)} communications")

if __name__ == "__main__":
    asyncio.run(seed_data())
