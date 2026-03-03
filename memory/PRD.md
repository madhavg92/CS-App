# Anka CS Hub - Product Requirements Document

## Original Problem Statement
Build a comprehensive Healthcare Customer Success application for managing client relationships, performance tracking, alerting, communications, and reporting. The system needs production-grade features with real data models, role-based access control, and AI-powered capabilities.

## What's Been Implemented (Phase 1 Complete - Dec 2025)

### Core Infrastructure
| Feature | Status | Description |
|---------|--------|-------------|
| JWT Authentication | ✅ Complete | Email/password auth with role-based access |
| Role-Based Access Control | ✅ Complete | cs_lead, csm, ops roles with permissions |
| Production Data Models | ✅ Complete | 10+ data models with MongoDB |
| PHI Scrubbing Middleware | ✅ Complete | Regex-based PHI detection & redaction |
| Anka Blue Color Scheme | ✅ Complete | #1B4F72 primary, professional design |

### Data Models Implemented
- **User**: name, email, role, assigned_clients
- **Client Account**: name, contract dates, services, SLA targets, status, health_score
- **Client Contact**: client_id, name, title, role_type (decision-maker/influencer/operations/billing)
- **Performance Record**: client_id, period, denials_worked, dollars_recovered, recovery_rate, denial_codes, payer_breakdown
- **Alert**: client_id, alert_type, severity, status (active/acknowledged/resolved/snoozed)
- **Communication**: client_id, type (draft/sent/received), channel, ai_generated
- **Follow-Up Item**: client_id, priority_score, category (call_required/email_sufficient)
- **Prompt Template**: 6 pre-loaded AI templates
- **Alert Threshold**: Configurable per-client or global settings
- **CRM Contact/Deal/Ticket**: HubSpot-like structure for future integration

### Pages & Navigation
| Page | Status | Features |
|------|--------|----------|
| Login | ✅ Complete | JWT auth with demo credentials |
| Dashboard | ✅ Complete | Metrics cards, today's alerts, call list |
| Clients | ✅ Complete | Searchable list, health scores, filters |
| Client Detail | ✅ Complete | 6 tabs: Overview, Org Chart, Communications, Performance, Alerts, Follow-Ups |
| Alerts | ✅ Complete | Severity filtering, acknowledge/snooze/resolve actions |
| Follow-Ups | ✅ Complete | Priority scoring, AI draft generation |
| Communications | ✅ Complete | Draft queue, sent history |
| Reports | ✅ Complete | Overview with charts, AI report generator |
| Settings | ✅ Complete | Alert thresholds, user management |

### Alerting Engine
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
December 2025 - Phase 1 Production Rebuild Complete
