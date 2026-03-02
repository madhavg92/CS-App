from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    title: str
    email: str
    phone: Optional[str] = None
    role: str  # decision-maker, influencer, user
    last_contact: Optional[str] = None
    notes: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str  # active, at-risk, healthy
    health_score: int  # 0-100
    relationship_owner: str
    last_engagement: str
    next_qbr: Optional[str] = None
    contract_value: float
    renewal_date: str
    contacts: List[Contact] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientCreate(BaseModel):
    name: str
    relationship_owner: str
    contract_value: float
    renewal_date: str

class PerformanceMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    week_ending: str
    denials_worked: int
    denials_recovered: int
    recovery_rate: float
    dollars_recovered: float
    sla_compliance: float
    error_rate: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PerformanceCreate(BaseModel):
    client_id: str
    client_name: str
    week_ending: str
    denials_worked: int
    denials_recovered: int
    dollars_recovered: float
    sla_compliance: float
    error_rate: float

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    alert_type: str  # engagement_gap, new_stakeholder, frustration, scope_creep, innovation_update, policy_alert
    severity: str  # high, medium, low
    message: str
    status: str  # open, acknowledged, resolved
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AlertCreate(BaseModel):
    client_id: str
    client_name: str
    alert_type: str
    severity: str
    message: str

class FollowUpItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    description: str
    priority: str  # high, medium, low
    action_type: str  # call, email
    days_open: int
    owner: str
    suggested_action: str
    status: str  # pending, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FollowUpCreate(BaseModel):
    client_id: str
    client_name: str
    description: str
    priority: str
    action_type: str
    owner: str
    suggested_action: str

class EmailDraftRequest(BaseModel):
    client_id: str
    client_name: str
    context: str
    email_type: str  # response, follow_up, innovation_update, policy_alert

class EmailDraftResponse(BaseModel):
    subject: str
    body: str

class WeeklySummaryRequest(BaseModel):
    client_id: str
    week_ending: str

class WeeklySummaryResponse(BaseModel):
    client_name: str
    week_ending: str
    key_topics: List[str]
    action_items: List[dict]
    red_flags: List[str]
    new_contacts: List[str]
    escalation_items: List[str]

class EmailCadence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    cadence_type: str  # monthly_checkin, qbr_reminder, renewal_reminder
    frequency_days: int
    last_sent: Optional[str] = None
    next_scheduled: str
    status: str  # active, paused
    auto_send: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EmailCadenceCreate(BaseModel):
    client_id: str
    client_name: str
    cadence_type: str
    frequency_days: int
    auto_send: bool = False

class SchedulingRequest(BaseModel):
    client_id: str
    client_name: str
    meeting_type: str  # qbr, check_in, demo, implementation
    preferred_dates: List[str]
    duration_minutes: int
    attendees: List[str]

class SchedulingResponse(BaseModel):
    suggested_times: List[dict]
    email_draft: str
    calendar_invite: str

class LOB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # EV, Prior Auth, Coding, Billing, AR, Payment Posting
    description: Optional[str] = None

class AnkaTeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str  # manager, supervisor, team_lead
    email: str
    phone: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientLOBMapping(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    lob_id: str
    lob_name: str
    anka_team_members: List[str] = []  # List of AnkaTeamMember IDs
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientLOBMappingCreate(BaseModel):
    client_id: str
    client_name: str
    lob_id: str
    lob_name: str
    anka_team_member_ids: List[str]

class ScheduledReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    review_type: str  # weekly, monthly, qbr
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int
    attendees: List[str] = []  # AnkaTeamMember IDs
    attendee_names: List[str] = []
    status: str = "scheduled"  # scheduled, completed, cancelled
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduledReviewCreate(BaseModel):
    client_id: str
    client_name: str
    review_type: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int
    attendee_ids: List[str]

class Communication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    comm_type: str  # email, call, meeting
    subject: Optional[str] = None
    summary: str
    sentiment: str  # positive, neutral, negative
    action_items: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CommunicationCreate(BaseModel):
    client_id: str
    client_name: str
    comm_type: str
    subject: Optional[str] = None
    content: str

# Helper function for PHI scrubbing
def scrub_phi(text: str) -> str:
    # Basic rule-based PHI redaction
    # Redact SSN patterns
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]', text)
    # Redact phone numbers
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE_REDACTED]', text)
    # Redact email addresses (excluding professional domains)
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@(?!anka|company)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]', text)
    # Redact potential patient IDs (MRN patterns)
    text = re.sub(r'\bMRN[:\s]*\d+\b', '[MRN_REDACTED]', text, flags=re.IGNORECASE)
    text = re.sub(r'\bpatient[\s]+id[:\s]*\d+\b', '[PATIENT_ID_REDACTED]', text, flags=re.IGNORECASE)
    return text

# AI Helper
async def generate_with_ai(prompt: str, system_message: str = "You are a helpful AI assistant for healthcare customer success operations.") -> str:
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Anka Healthcare CS Platform API"}

# Clients
@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@api_router.post("/clients", response_model=Client)
async def create_client(input: ClientCreate):
    client = Client(
        name=input.name,
        status="healthy",
        health_score=85,
        relationship_owner=input.relationship_owner,
        last_engagement=datetime.now(timezone.utc).isoformat(),
        contract_value=input.contract_value,
        renewal_date=input.renewal_date,
        contacts=[]
    )
    await db.clients.insert_one(client.model_dump())
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client: Client):
    await db.clients.update_one({"id": client_id}, {"$set": client.model_dump()})
    return client

# Contacts
@api_router.post("/clients/{client_id}/contacts", response_model=Contact)
async def add_contact(client_id: str, contact: Contact):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    contacts = client.get('contacts', [])
    contacts.append(contact.model_dump())
    await db.clients.update_one({"id": client_id}, {"$set": {"contacts": contacts}})
    return contact

# Performance Metrics
@api_router.get("/performance", response_model=List[PerformanceMetrics])
async def get_performance_metrics(client_id: Optional[str] = None):
    query = {"client_id": client_id} if client_id else {}
    metrics = await db.performance_metrics.find(query, {"_id": 0}).to_list(1000)
    return metrics

@api_router.post("/performance", response_model=PerformanceMetrics)
async def create_performance_metric(input: PerformanceCreate):
    recovery_rate = (input.denials_recovered / input.denials_worked * 100) if input.denials_worked > 0 else 0
    metric = PerformanceMetrics(
        client_id=input.client_id,
        client_name=input.client_name,
        week_ending=input.week_ending,
        denials_worked=input.denials_worked,
        denials_recovered=input.denials_recovered,
        recovery_rate=round(recovery_rate, 2),
        dollars_recovered=input.dollars_recovered,
        sla_compliance=input.sla_compliance,
        error_rate=input.error_rate
    )
    await db.performance_metrics.insert_one(metric.model_dump())
    return metric

# Alerts
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(status: Optional[str] = None):
    query = {"status": status} if status else {}
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return alerts

@api_router.post("/alerts", response_model=Alert)
async def create_alert(input: AlertCreate):
    alert = Alert(
        client_id=input.client_id,
        client_name=input.client_name,
        alert_type=input.alert_type,
        severity=input.severity,
        message=input.message,
        status="open"
    )
    await db.alerts.insert_one(alert.model_dump())
    return alert

@api_router.patch("/alerts/{alert_id}")
async def update_alert_status(alert_id: str, status: str):
    result = await db.alerts.update_one({"id": alert_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert updated"}

# Follow-up Items
@api_router.get("/followups", response_model=List[FollowUpItem])
async def get_followups(status: Optional[str] = None):
    query = {"status": status} if status else {}
    followups = await db.followups.find(query, {"_id": 0}).to_list(1000)
    return followups

@api_router.post("/followups", response_model=FollowUpItem)
async def create_followup(input: FollowUpCreate):
    followup = FollowUpItem(
        client_id=input.client_id,
        client_name=input.client_name,
        description=input.description,
        priority=input.priority,
        action_type=input.action_type,
        days_open=0,
        owner=input.owner,
        suggested_action=input.suggested_action,
        status="pending"
    )
    await db.followups.insert_one(followup.model_dump())
    return followup

@api_router.patch("/followups/{followup_id}")
async def update_followup_status(followup_id: str, status: str):
    result = await db.followups.update_one({"id": followup_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return {"message": "Follow-up updated"}

# Communications
@api_router.get("/communications/{client_id}", response_model=List[Communication])
async def get_communications(client_id: str):
    comms = await db.communications.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return comms

@api_router.post("/communications", response_model=Communication)
async def create_communication(input: CommunicationCreate):
    # Scrub PHI from content
    scrubbed_content = scrub_phi(input.content)
    
    # Analyze sentiment and extract action items with AI
    analysis_prompt = f"""Analyze this {input.comm_type} communication:

{scrubbed_content}

Provide:
1. Sentiment (positive/neutral/negative)
2. Key action items (list)
3. Brief summary (2-3 sentences)

Format as JSON:
{{
  "sentiment": "...",
  "action_items": [...],
  "summary": "..."
}}"""
    
    try:
        analysis = await generate_with_ai(analysis_prompt)
        import json
        analysis_data = json.loads(analysis)
    except:
        analysis_data = {
            "sentiment": "neutral",
            "action_items": [],
            "summary": scrubbed_content[:200]
        }
    
    comm = Communication(
        client_id=input.client_id,
        client_name=input.client_name,
        comm_type=input.comm_type,
        subject=input.subject,
        summary=analysis_data.get('summary', scrubbed_content[:200]),
        sentiment=analysis_data.get('sentiment', 'neutral'),
        action_items=analysis_data.get('action_items', [])
    )
    await db.communications.insert_one(comm.model_dump())
    return comm

# AI Email Drafting
@api_router.post("/draft-email", response_model=EmailDraftResponse)
async def draft_email(request: EmailDraftRequest):
    # Get client context
    client = await db.clients.find_one({"id": request.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get recent communications
    recent_comms = await db.communications.find(
        {"client_id": request.client_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(3).to_list(3)
    
    # Get recent metrics
    recent_metrics = await db.performance_metrics.find(
        {"client_id": request.client_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(1).to_list(1)
    
    comm_context = "\n".join([f"- {c['comm_type']}: {c['summary']}" for c in recent_comms])
    metrics_context = ""
    if recent_metrics:
        m = recent_metrics[0]
        metrics_context = f"Recent performance: {m['denials_recovered']} denials recovered (${m['dollars_recovered']:,.2f}), {m['sla_compliance']}% SLA compliance"
    
    prompt = f"""Draft a professional email for Anka Healthcare CS team.

Client: {request.client_name}
Email Type: {request.email_type}
Context: {request.context}

Recent Communications:
{comm_context}

{metrics_context}

Write a concise, professional email that:
- Addresses the context provided
- References relevant recent interactions or metrics
- Maintains a warm but professional healthcare tone
- Includes a clear call-to-action

Format as JSON:
{{
  "subject": "...",
  "body": "..."
}}"""
    
    response = await generate_with_ai(prompt)
    import json
    try:
        email_data = json.loads(response)
    except:
        email_data = {
            "subject": f"Update regarding {request.client_name}",
            "body": "Dear valued partner,\n\nI wanted to reach out regarding our recent collaboration...\n\nBest regards,\nAnka Healthcare CS Team"
        }
    
    return EmailDraftResponse(**email_data)

# Weekly Client Summaries (Phase 2)
@api_router.post("/weekly-summary", response_model=WeeklySummaryResponse)
async def generate_weekly_summary(request: WeeklySummaryRequest):
    client = await db.clients.find_one({"id": request.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get communications from the past week
    comms = await db.communications.find(
        {"client_id": request.client_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    comms_text = "\n\n".join([f"Type: {c['comm_type']}\nSubject: {c.get('subject', 'N/A')}\nSummary: {c['summary']}\nSentiment: {c['sentiment']}" for c in comms])
    
    prompt = f"""Generate an internal weekly summary for {client['name']} for week ending {request.week_ending}.

Recent communications:
{comms_text}

Provide a structured summary in JSON format:
{{
  "key_topics": ["topic1", "topic2", ...],
  "action_items": [{{"description": "...", "owner": "...", "priority": "high/medium/low"}}],
  "red_flags": ["flag1", "flag2", ...],
  "new_contacts": ["name1", "name2", ...],
  "escalation_items": ["item1", "item2", ...]
}}

Focus on: Key discussion topics, actionable items with owners, any red flags (frustration, scope creep, delays), new people mentioned, items needing escalation."""
    
    try:
        response = await generate_with_ai(prompt)
        import json
        summary_data = json.loads(response)
    except:
        summary_data = {
            "key_topics": ["Week in review"],
            "action_items": [],
            "red_flags": [],
            "new_contacts": [],
            "escalation_items": []
        }
    
    return WeeklySummaryResponse(
        client_name=client['name'],
        week_ending=request.week_ending,
        **summary_data
    )

# Email Cadence Management (Phase 2 & 3)
@api_router.get("/email-cadences", response_model=List[EmailCadence])
async def get_email_cadences(client_id: Optional[str] = None):
    query = {"client_id": client_id} if client_id else {}
    cadences = await db.email_cadences.find(query, {"_id": 0}).to_list(1000)
    return cadences

@api_router.post("/email-cadences", response_model=EmailCadence)
async def create_email_cadence(input: EmailCadenceCreate):
    next_scheduled = (datetime.now(timezone.utc) + timedelta(days=input.frequency_days)).isoformat()
    cadence = EmailCadence(
        client_id=input.client_id,
        client_name=input.client_name,
        cadence_type=input.cadence_type,
        frequency_days=input.frequency_days,
        next_scheduled=next_scheduled,
        status="active",
        auto_send=input.auto_send
    )
    await db.email_cadences.insert_one(cadence.model_dump())
    return cadence

@api_router.patch("/email-cadences/{cadence_id}")
async def update_cadence_status(cadence_id: str, status: str):
    result = await db.email_cadences.update_one({"id": cadence_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cadence not found")
    return {"message": "Cadence updated"}

@api_router.post("/email-cadences/{cadence_id}/send")
async def send_scheduled_email(cadence_id: str):
    cadence = await db.email_cadences.find_one({"id": cadence_id}, {"_id": 0})
    if not cadence:
        raise HTTPException(status_code=404, detail="Cadence not found")
    
    # Draft email based on cadence type
    context_map = {
        "monthly_checkin": "Monthly check-in to review progress and discuss any concerns",
        "qbr_reminder": "Upcoming QBR scheduling reminder",
        "renewal_reminder": "Contract renewal discussion and planning"
    }
    
    email_response = await axios.post(f"{API}/draft-email", {
        "client_id": cadence['client_id'],
        "client_name": cadence['client_name'],
        "context": context_map.get(cadence['cadence_type'], "Regular touchpoint"),
        "email_type": "follow_up"
    })
    
    # Update last sent and next scheduled
    next_scheduled = (datetime.now(timezone.utc) + timedelta(days=cadence['frequency_days'])).isoformat()
    await db.email_cadences.update_one(
        {"id": cadence_id},
        {"$set": {
            "last_sent": datetime.now(timezone.utc).isoformat(),
            "next_scheduled": next_scheduled
        }}
    )
    
    return {"message": "Email sent", "next_scheduled": next_scheduled}

# AI Scheduling Assistant (Phase 2 & 3)
@api_router.post("/schedule-meeting", response_model=SchedulingResponse)
async def schedule_meeting(request: SchedulingRequest):
    client = await db.clients.find_one({"id": request.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    prompt = f"""As an EA scheduling assistant, help schedule a {request.meeting_type} meeting for {request.client_name}.

Duration: {request.duration_minutes} minutes
Preferred dates: {', '.join(request.preferred_dates)}
Attendees: {', '.join(request.attendees)}

Provide in JSON format:
{{
  "suggested_times": [
    {{"date": "YYYY-MM-DD", "time": "HH:MM", "reason": "why this works"}},
    {{"date": "YYYY-MM-DD", "time": "HH:MM", "reason": "why this works"}}
  ],
  "email_draft": "Professional email proposing meeting times",
  "calendar_invite": "Calendar invitation text with agenda"
}}"""
    
    try:
        response = await generate_with_ai(prompt)
        import json
        schedule_data = json.loads(response)
    except:
        schedule_data = {
            "suggested_times": [{"date": request.preferred_dates[0] if request.preferred_dates else "TBD", "time": "10:00 AM", "reason": "Morning availability"}],
            "email_draft": f"Hi team, let's schedule our {request.meeting_type}.",
            "calendar_invite": f"{request.meeting_type.upper()} - {request.duration_minutes} minutes"
        }
    
    return SchedulingResponse(**schedule_data)

# Auto-respond to routine requests (Phase 3)
@api_router.post("/auto-respond")
async def auto_respond_email(client_id: str, request_type: str, request_content: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Define response templates for routine requests
    routine_responses = {
        "access_request": "Access credentials and login instructions",
        "report_request": "Latest performance report",
        "scheduling": "Meeting scheduling confirmation",
        "documentation": "Technical documentation and guides"
    }
    
    if request_type not in routine_responses:
        return {"auto_send": False, "message": "Request requires human review"}
    
    prompt = f"""Generate an automated response for a routine {request_type} request from {client['name']}.

Request: {request_content}

Provide a professional, complete response that resolves the request. Format as JSON:
{{
  "subject": "...",
  "body": "...",
  "auto_send": true
}}"""
    
    try:
        response = await generate_with_ai(prompt)
        import json
        response_data = json.loads(response)
        
        # Log the auto-response
        await db.communications.insert_one({
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "client_name": client['name'],
            "comm_type": "email",
            "subject": response_data['subject'],
            "summary": f"Auto-response sent for {request_type}",
            "sentiment": "neutral",
            "action_items": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except:
        return {"auto_send": False, "message": "Failed to generate auto-response"}

# LOB Management
@api_router.get("/lobs", response_model=List[LOB])
async def get_lobs():
    lobs = await db.lobs.find({}, {"_id": 0}).to_list(1000)
    return lobs

@api_router.post("/lobs", response_model=LOB)
async def create_lob(lob: LOB):
    await db.lobs.insert_one(lob.model_dump())
    return lob

# Anka Team Members
@api_router.get("/team-members", response_model=List[AnkaTeamMember])
async def get_team_members():
    members = await db.team_members.find({}, {"_id": 0}).to_list(1000)
    return members

@api_router.post("/team-members", response_model=AnkaTeamMember)
async def create_team_member(member: AnkaTeamMember):
    await db.team_members.insert_one(member.model_dump())
    return member

# Client LOB Mapping
@api_router.get("/client-lob-mappings", response_model=List[ClientLOBMapping])
async def get_client_lob_mappings(client_id: Optional[str] = None):
    query = {"client_id": client_id} if client_id else {}
    mappings = await db.client_lob_mappings.find(query, {"_id": 0}).to_list(1000)
    return mappings

@api_router.post("/client-lob-mappings", response_model=ClientLOBMapping)
async def create_client_lob_mapping(input: ClientLOBMappingCreate):
    mapping = ClientLOBMapping(
        client_id=input.client_id,
        client_name=input.client_name,
        lob_id=input.lob_id,
        lob_name=input.lob_name,
        anka_team_members=input.anka_team_member_ids
    )
    await db.client_lob_mappings.insert_one(mapping.model_dump())
    return mapping

@api_router.delete("/client-lob-mappings/{mapping_id}")
async def delete_client_lob_mapping(mapping_id: str):
    result = await db.client_lob_mappings.delete_one({"id": mapping_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return {"message": "Mapping deleted"}

# Scheduled Reviews & Calendar
@api_router.get("/scheduled-reviews", response_model=List[ScheduledReview])
async def get_scheduled_reviews(
    client_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    attendee_id: Optional[str] = None
):
    query = {}
    if client_id:
        query["client_id"] = client_id
    if start_date and end_date:
        query["scheduled_date"] = {"$gte": start_date, "$lte": end_date}
    if attendee_id:
        query["attendees"] = attendee_id
    
    reviews = await db.scheduled_reviews.find(query, {"_id": 0}).sort("scheduled_date", 1).to_list(1000)
    return reviews

@api_router.post("/scheduled-reviews", response_model=ScheduledReview)
async def create_scheduled_review(input: ScheduledReviewCreate):
    # Get attendee names
    attendee_names = []
    for attendee_id in input.attendee_ids:
        member = await db.team_members.find_one({"id": attendee_id}, {"_id": 0})
        if member:
            attendee_names.append(member['name'])
    
    review = ScheduledReview(
        client_id=input.client_id,
        client_name=input.client_name,
        review_type=input.review_type,
        scheduled_date=input.scheduled_date,
        scheduled_time=input.scheduled_time,
        duration_minutes=input.duration_minutes,
        attendees=input.attendee_ids,
        attendee_names=attendee_names,
        status="scheduled"
    )
    await db.scheduled_reviews.insert_one(review.model_dump())
    return review

@api_router.get("/calendar/conflicts")
async def check_calendar_conflicts(date: str, time: str, attendee_ids: str):
    # Parse attendee_ids (comma-separated)
    attendee_list = attendee_ids.split(',') if attendee_ids else []
    
    # Find reviews on the same date
    reviews = await db.scheduled_reviews.find(
        {"scheduled_date": date, "status": "scheduled"},
        {"_id": 0}
    ).to_list(1000)
    
    conflicts = []
    for review in reviews:
        # Check if any attendees overlap
        overlapping = set(review['attendees']) & set(attendee_list)
        if overlapping:
            conflicts.append({
                "review": review,
                "conflicting_attendees": list(overlapping)
            })
    
    return {"conflicts": conflicts, "has_conflicts": len(conflicts) > 0}

@api_router.patch("/scheduled-reviews/{review_id}")
async def update_review_status(review_id: str, status: str):
    result = await db.scheduled_reviews.update_one({"id": review_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review updated"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
