"""
Seed script for Anka CS Hub - Creates realistic sample data
Run: python seed_data.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
import random
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from motor.motor_asyncio import AsyncIOMotorClient
import hashlib
import uuid

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def random_date(start_days_ago: int, end_days_ago: int = 0) -> str:
    days_ago = random.randint(end_days_ago, start_days_ago)
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()

async def seed_data():
    print("Starting data seed...")
    
    # Clear existing data
    collections = ['users', 'clients', 'client_contacts', 'performance_records', 
                   'alerts', 'communications', 'followups', 'prompt_templates', 
                   'alert_thresholds', 'crm_contacts', 'crm_deals', 'crm_tickets']
    
    for coll in collections:
        await db[coll].delete_many({})
    print("Cleared existing data")
    
    # Create Users
    users = [
        {
            "id": str(uuid.uuid4()),
            "name": "Sarah Mitchell",
            "email": "sarah.mitchell@anka.health",
            "password_hash": hash_password("password123"),
            "role": "cs_lead",
            "assigned_clients": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "James Rodriguez",
            "email": "james.rodriguez@anka.health",
            "password_hash": hash_password("password123"),
            "role": "csm",
            "assigned_clients": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Emily Chen",
            "email": "emily.chen@anka.health",
            "password_hash": hash_password("password123"),
            "role": "csm",
            "assigned_clients": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Michael Thompson",
            "email": "michael.thompson@anka.health",
            "password_hash": hash_password("password123"),
            "role": "ops",
            "assigned_clients": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Admin User",
            "email": "admin@anka.health",
            "password_hash": hash_password("admin123"),
            "role": "cs_lead",
            "assigned_clients": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    csm_ids = [u['id'] for u in users if u['role'] == 'csm']
    lead_ids = [u['id'] for u in users if u['role'] == 'cs_lead']
    
    # Create Clients
    client_data = [
        {
            "name": "Memorial Health System",
            "services": ["EV", "Prior Auth", "Coding", "AR"],
            "status": "active",
            "health": 92,
            "renewal_days": 180
        },
        {
            "name": "Valley Medical Center",
            "services": ["Prior Auth", "Billing", "AR", "Payment Posting"],
            "status": "active",
            "health": 78,
            "renewal_days": 45
        },
        {
            "name": "Sunrise Healthcare Partners",
            "services": ["EV", "Coding", "Billing"],
            "status": "at-risk",
            "health": 58,
            "renewal_days": 30
        },
        {
            "name": "Pacific Northwest Medical Group",
            "services": ["Prior Auth", "AR", "Payment Posting"],
            "status": "active",
            "health": 85,
            "renewal_days": 120
        },
        {
            "name": "Great Lakes Hospital Network",
            "services": ["EV", "Prior Auth", "Coding", "Billing", "AR"],
            "status": "active",
            "health": 88,
            "renewal_days": 200
        },
        {
            "name": "Midwest Regional Medical",
            "services": ["Coding", "Billing", "AR"],
            "status": "at-risk",
            "health": 62,
            "renewal_days": 60
        },
        {
            "name": "Atlantic Healthcare Alliance",
            "services": ["EV", "Prior Auth"],
            "status": "active",
            "health": 95,
            "renewal_days": 300
        },
        {
            "name": "Desert Valley Physicians",
            "services": ["Prior Auth", "Coding", "AR", "Payment Posting"],
            "status": "active",
            "health": 81,
            "renewal_days": 90
        }
    ]
    
    clients = []
    for i, c in enumerate(client_data):
        contract_start = datetime.now(timezone.utc) - timedelta(days=random.randint(180, 730))
        contract_end = datetime.now(timezone.utc) + timedelta(days=c['renewal_days'])
        
        client = {
            "id": str(uuid.uuid4()),
            "name": c['name'],
            "contract_start": contract_start.isoformat(),
            "contract_end": contract_end.isoformat(),
            "contracted_services": c['services'],
            "sla_targets": {
                "recovery_rate": random.randint(82, 90),
                "error_rate": random.uniform(1.5, 3.0),
                "turnaround_days": random.randint(2, 5)
            },
            "status": c['status'],
            "assigned_csm": random.choice(csm_ids),
            "assigned_cs_lead": random.choice(lead_ids),
            "health_score": c['health'],
            "last_contact_date": random_date(30, 1),
            "notes": None,
            "created_at": contract_start.isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        clients.append(client)
    
    await db.clients.insert_many(clients)
    print(f"Created {len(clients)} clients")
    
    # Assign clients to CSMs
    for i, csm_id in enumerate(csm_ids):
        assigned = [c['id'] for j, c in enumerate(clients) if j % len(csm_ids) == i]
        await db.users.update_one({"id": csm_id}, {"$set": {"assigned_clients": assigned}})
    
    # Create Client Contacts
    contact_names = [
        ("Dr. Robert Williams", "Chief Medical Officer", "decision-maker"),
        ("Jennifer Adams", "VP of Revenue Cycle", "decision-maker"),
        ("Mark Stevens", "Director of Operations", "influencer"),
        ("Lisa Chen", "Billing Manager", "operations"),
        ("David Park", "IT Director", "influencer"),
        ("Amanda Foster", "Accounts Receivable Lead", "billing"),
        ("Chris Martinez", "Clinical Operations Manager", "operations"),
        ("Rachel Kim", "Finance Director", "influencer")
    ]
    
    contacts = []
    for client in clients:
        num_contacts = random.randint(3, 6)
        selected_contacts = random.sample(contact_names, num_contacts)
        
        for name, title, role in selected_contacts:
            contact = {
                "id": str(uuid.uuid4()),
                "client_id": client['id'],
                "name": name,
                "title": title,
                "email": f"{name.lower().replace(' ', '.').replace('dr. ', '')}@{client['name'].lower().replace(' ', '')}.com",
                "phone": f"({random.randint(200,999)}) {random.randint(100,999)}-{random.randint(1000,9999)}",
                "role_type": role,
                "anka_relationship_owner": random.choice(csm_ids),
                "last_email_date": random_date(45, 5) if random.random() > 0.3 else None,
                "last_call_date": random_date(60, 10) if random.random() > 0.4 else None,
                "last_meeting_date": random_date(90, 20) if random.random() > 0.5 else None,
                "notes": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            contacts.append(contact)
    
    await db.client_contacts.insert_many(contacts)
    print(f"Created {len(contacts)} contacts")
    
    # Create Performance Records
    denial_codes = ["CO-4", "CO-16", "CO-45", "PR-1", "PR-2", "CO-97", "CO-50", "PI-23", "CO-29", "MA-130"]
    payers = ["Medicare", "Medicaid", "Blue Cross", "Aetna", "UnitedHealth", "Cigna", "Humana"]
    
    performance_records = []
    for client in clients:
        # Create 6 months of performance data
        for months_ago in range(6):
            period_end = datetime.now(timezone.utc) - timedelta(days=months_ago * 30)
            period_start = period_end - timedelta(days=30)
            
            base_rate = 80 + random.uniform(-5, 15)
            if client['status'] == 'at-risk':
                base_rate -= random.uniform(5, 15)
            
            denials_worked = random.randint(800, 3000)
            recovery_rate = min(95, max(60, base_rate + random.uniform(-3, 3)))
            
            # Generate denial codes
            top_codes = {}
            for code in random.sample(denial_codes, random.randint(3, 6)):
                top_codes[code] = random.randint(20, 200)
            
            # Generate payer breakdown
            payer_breakdown = {}
            total_recovered = denials_worked * random.uniform(150, 400)
            remaining = total_recovered
            selected_payers = random.sample(payers, random.randint(3, 5))
            for i, payer in enumerate(selected_payers):
                if i == len(selected_payers) - 1:
                    payer_breakdown[payer] = round(remaining, 2)
                else:
                    amount = remaining * random.uniform(0.15, 0.4)
                    payer_breakdown[payer] = round(amount, 2)
                    remaining -= amount
            
            record = {
                "id": str(uuid.uuid4()),
                "client_id": client['id'],
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "denials_worked": denials_worked,
                "dollars_recovered": round(total_recovered, 2),
                "recovery_rate": round(recovery_rate, 2),
                "sla_compliance_pct": round(random.uniform(88, 99), 2),
                "error_rate": round(random.uniform(0.5, 3.5), 2),
                "top_denial_codes": top_codes,
                "payer_breakdown": payer_breakdown,
                "created_at": period_end.isoformat()
            }
            performance_records.append(record)
    
    await db.performance_records.insert_many(performance_records)
    print(f"Created {len(performance_records)} performance records")
    
    # Create Alerts
    alert_types = [
        ("engagement_gap", "high", "No contact with decision maker in 21 days"),
        ("renewal", "critical", "Contract renewal in 28 days - no QBR scheduled"),
        ("performance_decline", "high", "Recovery rate dropped 8% vs prior period"),
        ("followup_overdue", "medium", "Follow-up item open for 12 days"),
        ("engagement_gap", "medium", "No contact with influencer in 35 days"),
        ("scope_creep", "medium", "Client requesting services outside contract"),
        ("frustration", "high", "Negative sentiment detected in recent communications")
    ]
    
    alerts = []
    for client in clients:
        if client['status'] == 'at-risk':
            num_alerts = random.randint(2, 4)
        else:
            num_alerts = random.randint(0, 2)
        
        for _ in range(num_alerts):
            alert_type, severity, title = random.choice(alert_types)
            status = random.choice(["active", "active", "active", "acknowledged"])
            
            alert = {
                "id": str(uuid.uuid4()),
                "client_id": client['id'],
                "client_name": client['name'],
                "alert_type": alert_type,
                "severity": severity,
                "title": title,
                "description": f"Automated alert generated for {client['name']}. Review and take action.",
                "trigger_data": {"auto_generated": True},
                "status": status,
                "assigned_to": client['assigned_csm'],
                "snoozed_until": None,
                "resolution_notes": None,
                "created_at": random_date(14, 0),
                "acknowledged_at": random_date(7, 0) if status == "acknowledged" else None,
                "resolved_at": None
            }
            alerts.append(alert)
    
    if alerts:
        await db.alerts.insert_many(alerts)
    print(f"Created {len(alerts)} alerts")
    
    # Create Follow-ups
    followup_descriptions = [
        ("Schedule QBR meeting", "Reach out to schedule quarterly business review", "call_required"),
        ("Review contract terms", "Discuss renewal options and pricing", "call_required"),
        ("Send performance summary", "Share monthly performance metrics", "email_sufficient"),
        ("Address billing inquiry", "Respond to questions about invoice", "email_sufficient"),
        ("Introduce new team member", "Connect client with new account manager", "call_required"),
        ("Follow up on training request", "Schedule training session for new features", "email_sufficient"),
        ("Discuss expansion opportunity", "Present additional service options", "call_required"),
        ("Resolve SLA concern", "Address client concerns about turnaround time", "call_required")
    ]
    
    followups = []
    for client in clients:
        num_followups = random.randint(1, 4)
        
        for _ in range(num_followups):
            desc, action, category = random.choice(followup_descriptions)
            days_open = random.randint(1, 15)
            priority_level = random.randint(1, 5)
            
            if days_open > 7 or priority_level >= 4:
                category = "call_required"
            
            followup = {
                "id": str(uuid.uuid4()),
                "client_id": client['id'],
                "client_name": client['name'],
                "description": desc,
                "days_open": days_open,
                "owner": client['assigned_csm'],
                "priority_score": round(random.uniform(3, 9), 2),
                "priority_level": priority_level,
                "category": category,
                "suggested_action": action,
                "status": random.choice(["open", "open", "open", "in_progress"]),
                "draft_email_id": None,
                "source": random.choice(["manual", "crm", "alert"]),
                "due_date": (datetime.now(timezone.utc) + timedelta(days=random.randint(1, 14))).isoformat(),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=days_open)).isoformat(),
                "completed_at": None
            }
            followups.append(followup)
    
    if followups:
        await db.followups.insert_many(followups)
    print(f"Created {len(followups)} follow-ups")
    
    # Create Communications
    comm_subjects = [
        "Weekly Performance Update",
        "QBR Follow-up Items",
        "RE: Billing Inquiry",
        "Monthly Metrics Report",
        "Team Introduction",
        "Service Enhancement Proposal",
        "RE: Contract Discussion",
        "Action Items from Today's Call"
    ]
    
    communications = []
    for client in clients:
        num_comms = random.randint(3, 8)
        
        for _ in range(num_comms):
            comm_type = random.choice(["sent", "sent", "received", "draft"])
            channel = random.choice(["email", "email", "email", "call", "meeting"])
            
            comm = {
                "id": str(uuid.uuid4()),
                "client_id": client['id'],
                "contact_id": None,
                "comm_type": comm_type,
                "channel": channel,
                "subject": random.choice(comm_subjects),
                "body": f"Communication regarding {client['name']} business operations. This is sample content for demonstration purposes.",
                "ai_generated": random.random() > 0.7,
                "template_used": None,
                "created_by": client['assigned_csm'],
                "sent_at": random_date(30, 1) if comm_type == "sent" else None,
                "created_at": random_date(30, 0)
            }
            communications.append(comm)
    
    if communications:
        await db.communications.insert_many(communications)
    print(f"Created {len(communications)} communications")
    
    # Create default alert thresholds
    default_threshold = {
        "id": str(uuid.uuid4()),
        "client_id": None,
        "engagement_gap_decision_maker_days": 14,
        "engagement_gap_influencer_days": 30,
        "renewal_alert_60_days": True,
        "renewal_alert_30_days": True,
        "renewal_alert_15_days": True,
        "performance_decline_threshold_pct": 5.0,
        "followup_overdue_days": 7,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.alert_thresholds.insert_one(default_threshold)
    print("Created default alert thresholds")
    
    print("\n✅ Data seed completed successfully!")
    print("\nLogin credentials:")
    print("  Admin: admin@anka.health / admin123")
    print("  CS Lead: sarah.mitchell@anka.health / password123")
    print("  CSM: james.rodriguez@anka.health / password123")
    print("  CSM: emily.chen@anka.health / password123")
    print("  Ops: michael.thompson@anka.health / password123")

if __name__ == "__main__":
    asyncio.run(seed_data())
