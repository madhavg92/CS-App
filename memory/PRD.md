# Anka CS Hub - Product Requirements Document

## Original Problem Statement
Build a comprehensive Healthcare Customer Success application for managing client relationships, performance tracking, alerting, communications, and reporting. The system needs production-grade features with real data models, role-based access control, and AI-powered capabilities.

## What's Been Implemented (Phase 1-5 Complete - March 2026)

### Latest Updates (March 4, 2026 - Section 5: NLP-Powered Alerts + Call Transcripts)
- ✅ CallTranscript model with all required fields (call_date, attendees, transcript_text, summary, action_items, sentiment, new_attendees)
- ✅ NLP helper functions: analyze_email_sentiment() and analyze_scope_creep() using Emergent LLM
- ✅ Scheduler integration for NLP email analysis (runs when M365 connected)
- ✅ CRUD endpoints: GET/POST /api/transcripts, POST /api/transcripts/{id}/analyze
- ✅ New stakeholder detection: compares attendees against client_contacts
- ✅ Auto-generation of new_stakeholder alerts (severity: low) for unrecognized attendees
- ✅ Frontend: "Call Notes & Transcripts" section in ClientDetailPage Communications tab
- ✅ Upload Call Notes dialog with date, duration, attendees, transcript_text fields
- ✅ AI-powered analysis with summary, action items, sentiment badges
- ✅ "New stakeholders" badge and blue detail panel for detected unknown attendees
- ✅ Audit logging for transcript_create and transcript_analysis actions
- ✅ All tests passed (100% backend, 100% frontend)

### Previous Updates (March 3, 2026 - Section 4: Microsoft 365 Integration)
- ✅ Added msal library for OAuth client credentials flow
- ✅ Graph API helper function (get_graph_token)
- ✅ M365 Configure and Test Connection endpoints
- ✅ Email endpoints: GET /email/threads, GET /email/thread/{id}, POST /email/draft-reply, POST /email/send
- ✅ Calendar endpoints: GET /calendar/events, POST /calendar/create-event
- ✅ Settings > Integrations tab with M365 configuration form
- ✅ Communications > Outlook Inbox tab with two-panel thread view
- ✅ Calendar page shows Outlook events in blue alongside app reviews
- ✅ AI-powered draft replies for email threads with client context
- ✅ PHI scrubbing applied to all email content

### Previous Updates (Phase 2-3 - March 3, 2026)
- ✅ All 13 Phase 2-3 tasks completed
- ✅ Innovation Briefing tracking
- ✅ Policy Updates with auto-alert generation
- ✅ Email Cadences automation
- ✅ Weekly Summary AI generation
- ✅ 8 templates including innovation_update and policy_impact_brief
- ✅ Enhanced audit logging
- ✅ Alert type icons/colors in AlertsPage

### Core Infrastructure
| Feature | Status | Description |
|---------|--------|-------------|
| JWT Authentication | ✅ Complete | Email/password auth with role-based access |
| Role-Based Access Control | ✅ Complete | cs_lead, csm, ops roles with permissions |
| Production Data Models | ✅ Complete | 12+ data models with MongoDB |
| PHI Scrubbing Middleware | ✅ Complete | Regex-based PHI detection & redaction |
| Anka Blue Color Scheme | ✅ Complete | #1B4F72 primary, professional design |
| Audit Logging | ✅ Complete | All key actions logged with filters |
| Scheduled Background Tasks | ✅ Complete | Daily alert checks, policy alerts, cadence execution |

### Data Models Implemented
- **User**: name, email, role, assigned_clients
- **Client Account**: name, contract dates, services, SLA targets, status, health_score, last_innovation_briefing
- **Client Contact**: client_id, name, title, role_type (decision-maker/influencer/operations/billing)
- **Performance Record**: client_id, period, denials_worked, dollars_recovered, recovery_rate, denial_codes, payer_breakdown, claims_processed, avg_turnaround_days, team_size
- **Alert**: client_id, alert_type (9 types including frustration, scope_creep), severity, status (active/acknowledged/resolved/snoozed)
- **Communication**: client_id, type (draft/sent/received), channel, ai_generated
- **Follow-Up Item**: client_id, priority_score, category (call_required/email_sufficient)
- **Prompt Template**: 8 pre-loaded AI templates
- **Policy Update**: title, description, policy_type, affected_services, affected_payers
- **Email Cadence**: client_id, cadence_type, frequency_days, status, template_slug
- **Call Transcript**: client_id, call_date, attendees, transcript_text, summary, action_items, sentiment, new_attendees
- **Audit Log**: user_id, action_type, resource_type, details, timestamp

### Pages & Navigation
| Page | Status | Features |
|------|--------|----------|
| Login | ✅ Complete | JWT auth with credentials |
| Dashboard | ✅ Complete | Metrics cards, today's alerts, call list |
| Clients | ✅ Complete | List/Grid views, health scores, sorting, filters |
| Client Detail | ✅ Complete | 8 tabs: Overview, Org Chart, Communications, Performance, Alerts, Follow-Ups, Weekly Summary, Email Cadences |
| Alerts | ✅ Complete | Type icons, severity filtering, acknowledge/snooze/resolve |
| Follow-Ups | ✅ Complete | Priority scoring, AI draft generation, green empty state |
| Communications | ✅ Complete | Draft queue, sent history |
| Reports | ✅ Complete | Overview charts, AI report generator, .docx export |
| Settings | ✅ Complete | 4 tabs: Alert Thresholds, User Management, Audit Log, Policies |

### Alert Types Supported
- engagement_gap (Clock icon, amber)
- renewal (Bell icon, blue)
- performance_decline (TrendingDown icon, red)
- followup_overdue (Clock icon, amber)
- innovation_update_due (Sparkles icon, blue)
- policy_update (FileText icon, amber)
- new_stakeholder (UserPlus icon, blue)
- frustration (AlertOctagon icon, red) - NLP detected from emails
- scope_creep (ArrowUpRight icon, amber) - NLP detected from emails

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@anka.health | admin123 |
| CS Lead | gayatri.garg@anka.health | anka2026! |
| CS Lead | gurpreet.sahni@anka.health | anka2026! |
| CSM | priya.sharma@anka.health | anka2026! |
| CSM | rahul.verma@anka.health | anka2026! |
| Ops | ankit.patel@anka.health | anka2026! |
| Alert Type | Status | Trigger |
|------------|--------|---------|
| Engagement Gap | ✅ Complete | No contact with decision-maker/influencer beyond threshold |
| Renewal Approaching | ✅ Complete | Contract end within 60/30/15 days |
| Performance Decline | ✅ Complete | Recovery rate drops >5% or SLA below target |
| Follow-Up Overdue | ✅ Complete | Item open >7 days |

### AI Features (OpenAI GPT-4o via Emergent LLM Key)
| Template | Status | Purpose |
|----------|--------|---------|
| Weekly Client Summary | ✅ Complete | Aggregate communications & metrics |
| Client Report External | ✅ Complete | Professional client-facing report |
| Follow-Up List | ✅ Complete | Prioritized action items |
| Engagement Gap Outreach | ✅ Complete | Warm check-in email |
| QBR Scheduling | ✅ Complete | Meeting scheduling with agenda |
| Escalation Notification | ✅ Complete | Internal escalation email |

### API Endpoints
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Users**: `/api/users` (GET, PATCH)
- **Clients**: `/api/clients` (CRUD)
- **Contacts**: `/api/contacts` (CRUD)
- **Performance**: `/api/performance` (GET, POST), `/api/performance/upload` (CSV upload)
- **Alerts**: `/api/alerts` (CRUD), `/api/alerts/today`, `/api/alerts/{id}/snooze`, `/api/alerts/{id}/escalate`
- **Alert Checks**: `/api/alerts/check-engagement`, `/api/alerts/check-renewals`, `/api/alerts/check-overdue-followups`
- **Communications**: `/api/communications` (CRUD), `/api/communications/drafts`, `/api/communications/{id}/send`
- **Follow-Ups**: `/api/followups` (CRUD), `/api/followups/call-list`, `/api/followups/{id}/generate-draft`
- **Templates**: `/api/templates`, `/api/templates/execute/{slug}`
- **Settings**: `/api/settings/alert-thresholds`
- **CRM Stub**: `/api/crm/contacts`, `/api/crm/deals`, `/api/crm/tickets`, `/api/crm/sync`
- **Dashboard**: `/api/dashboard/metrics`
- **Email (M365)**: `/api/email/threads`, `/api/email/thread/{id}`, `/api/email/draft-reply`, `/api/email/send`
- **Calendar (M365)**: `/api/calendar/events`, `/api/calendar/create-event`
- **Transcripts**: `/api/transcripts` (GET, POST), `/api/transcripts/{id}/analyze`

### Seed Data
- 5 users (admin, CS lead, 2 CSMs, ops)
- 8 realistic healthcare clients
- 38 contacts with role types
- 48 performance records (6 months history)
- 15 alerts
- 20 follow-ups
- 39 communications
- Default alert thresholds

## Priority Backlog

### P0 (Critical) - None

### P1 (High Priority)
1. **Ops Data Upload** - Test CSV upload flow end-to-end
2. **CRM Sync** - Add HubSpot API integration when key provided
3. **Calendar Integration** - QBR scheduling with Google Calendar

### P2 (Medium Priority)
1. **Report Export** - Add .docx export for external reports
2. **Email Integration** - Connect draft queue to actual email sending
3. **Dashboard Charts** - Add trend line charts for recovery rate over time
4. **Notification System** - Email alerts for critical events

### P3 (Future)
1. **Microsoft SSO** - Azure AD integration
2. **Mobile Responsive** - Tablet optimization
3. **Real-time Updates** - WebSocket for live alerts
4. **Advanced Analytics** - Predictive churn scoring

## Technical Stack
- **Frontend**: React 18, Tailwind CSS, Shadcn UI, react-router-dom
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via emergentintegrations
- **Auth**: JWT with role-based access

## Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@anka.health | admin123 |
| CS Lead | sarah.mitchell@anka.health | password123 |
| CSM | james.rodriguez@anka.health | password123 |
| CSM | emily.chen@anka.health | password123 |
| Ops | michael.thompson@anka.health | password123 |

## Color Scheme
- **Primary**: #1B4F72 (Anka Blue)
- **Secondary/Accent**: #85C1E9 (Light Blue)
- **Health Green**: #27AE60 (score >80)
- **Health Amber**: #F39C12 (score 60-80)
- **Health Red**: #E74C3C (score <60)
- **Alert Critical**: Red with pulse animation
- **Alert High**: Red static
- **Alert Medium**: Amber
- **Alert Low**: Gray

## Last Updated
March 4, 2026 - Section 5 NLP-Powered Alerts + Call Transcripts Complete
