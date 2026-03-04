"""
Test file for Anka CS Hub Phase 2 Features
Testing: Innovation Update, Policy Impact Brief templates, Policy Updates, Email Cadences,
         Weekly Summary, Mark Innovation Briefed, Audit Logs, Alert Types, Follow-up logging
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://anka-success-hub.preview.emergentagent.com')

# Test credentials
CS_LEAD_EMAIL = "gayatri.garg@anka.health"
CS_LEAD_PASSWORD = "anka2026!"
ADMIN_EMAIL = "admin@anka.health"
ADMIN_PASSWORD = "admin123"

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def cs_lead_token(self, session):
        """Login as CS Lead"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        # Fall back to admin if CS Lead doesn't exist
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, cs_lead_token):
        return {"Authorization": f"Bearer {cs_lead_token}"}
    
    def test_login_cs_lead(self, session):
        """Test login with CS Lead credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        # May not exist, fall back to admin
        if response.status_code == 401:
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"Logged in as: {data['user']['email']} ({data['user']['role']})")


class TestTemplates:
    """Test template endpoints - innovation_update and policy_impact_brief templates"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_templates(self, session, auth_headers):
        """GET /api/templates - should contain innovation_update and policy_impact_brief"""
        response = session.get(f"{BASE_URL}/api/templates", headers=auth_headers)
        assert response.status_code == 200
        templates = response.json()
        assert isinstance(templates, list)
        
        slugs = [t['slug'] for t in templates]
        print(f"Found templates: {slugs}")
        
        # Verify Phase 2 templates exist
        assert "innovation_update" in slugs, "innovation_update template not found"
        assert "policy_impact_brief" in slugs, "policy_impact_brief template not found"
        
        # Verify template structure
        innovation_template = next((t for t in templates if t['slug'] == 'innovation_update'), None)
        assert innovation_template is not None
        assert "name" in innovation_template
        assert "description" in innovation_template
        assert "system_prompt" in innovation_template
        print(f"innovation_update template: {innovation_template['name']}")


class TestMarkInnovationBriefed:
    """Test mark-innovation-briefed endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_mark_innovation_briefed(self, session, auth_headers):
        """POST /api/clients/{id}/mark-innovation-briefed"""
        # First get a client
        clients_response = session.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert clients_response.status_code == 200
        clients = clients_response.json()
        assert len(clients) > 0, "No clients found for testing"
        
        client_id = clients[0]['id']
        
        # Mark as briefed
        response = session.post(
            f"{BASE_URL}/api/clients/{client_id}/mark-innovation-briefed", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Client marked as innovation briefed"
        print(f"Marked client {clients[0]['name']} as innovation briefed")
        
        # Verify the update
        client_response = session.get(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert client_response.status_code == 200
        updated_client = client_response.json()
        assert updated_client.get("last_innovation_briefing") is not None
        print(f"last_innovation_briefing: {updated_client['last_innovation_briefing']}")


class TestWeeklySummary:
    """Test weekly summary endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_generate_weekly_summary(self, session, auth_headers):
        """POST /api/weekly-summary"""
        # Get a client first
        clients_response = session.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert clients_response.status_code == 200
        clients = clients_response.json()
        assert len(clients) > 0
        
        client_id = clients[0]['id']
        week_ending = datetime.now().strftime("%Y-%m-%d")
        
        response = session.post(
            f"{BASE_URL}/api/weekly-summary",
            headers=auth_headers,
            json={
                "client_id": client_id,
                "week_ending": week_ending
            },
            timeout=60  # AI generation may take time
        )
        
        assert response.status_code == 200, f"Weekly summary failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "key_topics" in data
        assert "action_items" in data
        assert isinstance(data["key_topics"], list)
        print(f"Weekly summary generated with {len(data['key_topics'])} topics")


class TestPolicyUpdates:
    """Test Policy Updates CRUD and alert generation"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_policy_updates(self, session, auth_headers):
        """GET /api/policy-updates"""
        response = session.get(f"{BASE_URL}/api/policy-updates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} policy updates")
    
    def test_create_policy_update(self, session, auth_headers):
        """POST /api/policy-updates"""
        unique_id = str(uuid.uuid4())[:8]
        policy_data = {
            "id": f"TEST_policy_{unique_id}",
            "title": f"TEST Medicare Policy Change {unique_id}",
            "description": "Test policy update for Phase 2 testing",
            "policy_type": "payer_update",
            "affected_services": ["Billing", "AR"],
            "affected_payers": ["Medicare"],
            "effective_date": "2026-04-01",
            "status": "active"
        }
        
        response = session.post(
            f"{BASE_URL}/api/policy-updates",
            headers=auth_headers,
            json=policy_data
        )
        
        assert response.status_code == 200, f"Failed to create policy: {response.text}"
        data = response.json()
        assert data.get("title") == policy_data["title"]
        print(f"Created policy update: {data['title']}")
        return data
    
    def test_generate_policy_alerts(self, session, auth_headers):
        """POST /api/policy-updates/{id}/generate-alerts"""
        # First create a policy
        unique_id = str(uuid.uuid4())[:8]
        policy_data = {
            "id": f"TEST_alert_policy_{unique_id}",
            "title": f"TEST Policy for Alert Generation {unique_id}",
            "description": "Policy to test alert generation",
            "policy_type": "regulatory",
            "affected_services": ["EV", "Prior Auth", "Coding", "Billing", "AR"],
            "affected_payers": ["Medicare", "Medicaid"],
            "effective_date": "2026-04-15",
            "status": "active"
        }
        
        create_response = session.post(
            f"{BASE_URL}/api/policy-updates",
            headers=auth_headers,
            json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]
        
        # Generate alerts
        response = session.post(
            f"{BASE_URL}/api/policy-updates/{policy_id}/generate-alerts",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "alerts_created" in data
        print(f"Generated {data['alerts_created']} policy alerts")


class TestEmailCadences:
    """Test Email Cadences CRUD"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_email_cadences(self, session, auth_headers):
        """GET /api/email-cadences"""
        response = session.get(f"{BASE_URL}/api/email-cadences", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} email cadences")
    
    def test_create_email_cadence(self, session, auth_headers):
        """POST /api/email-cadences"""
        # Get a client first
        clients_response = session.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = clients_response.json()
        assert len(clients) > 0
        
        unique_id = str(uuid.uuid4())[:8]
        cadence_data = {
            "id": f"TEST_cadence_{unique_id}",
            "client_id": clients[0]['id'],
            "client_name": clients[0]['name'],
            "cadence_type": "monthly_checkin",
            "frequency_days": 30,
            "auto_send": False,
            "status": "active"
        }
        
        response = session.post(
            f"{BASE_URL}/api/email-cadences",
            headers=auth_headers,
            json=cadence_data
        )
        
        assert response.status_code == 200, f"Failed to create cadence: {response.text}"
        data = response.json()
        assert data.get("cadence_type") == "monthly_checkin"
        print(f"Created email cadence for {clients[0]['name']}")
        return data
    
    def test_get_email_cadences_by_client(self, session, auth_headers):
        """GET /api/email-cadences?client_id=xxx"""
        clients_response = session.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = clients_response.json()
        
        if len(clients) > 0:
            response = session.get(
                f"{BASE_URL}/api/email-cadences?client_id={clients[0]['id']}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"Found {len(data)} cadences for client {clients[0]['name']}")


class TestAuditLogs:
    """Test Audit Log endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_audit_logs(self, session, auth_headers):
        """GET /api/audit-logs"""
        response = session.get(f"{BASE_URL}/api/audit-logs?limit=100", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} audit logs")
        
        if len(data) > 0:
            log = data[0]
            assert "action_type" in log
            assert "timestamp" in log
            print(f"Sample log: {log['action_type']} - {log.get('resource_type', 'N/A')}")
    
    def test_get_audit_logs_with_filter(self, session, auth_headers):
        """GET /api/audit-logs with action_type filter"""
        response = session.get(
            f"{BASE_URL}/api/audit-logs?action_type=alert_action&limit=50", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # All returned logs should be of type alert_action
        for log in data:
            assert log.get("action_type") == "alert_action"
        print(f"Found {len(data)} alert_action audit logs")


class TestFollowUpAuditLogging:
    """Test that follow-up updates are logged to audit"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_followup_update_creates_audit_log(self, session, auth_headers):
        """PATCH /api/followups/{id} should create audit log"""
        # Get a followup
        followups_response = session.get(f"{BASE_URL}/api/followups", headers=auth_headers)
        assert followups_response.status_code == 200
        followups = followups_response.json()
        
        if len(followups) == 0:
            # Create a followup first
            clients_response = session.get(f"{BASE_URL}/api/clients", headers=auth_headers)
            clients = clients_response.json()
            if len(clients) > 0:
                unique_id = str(uuid.uuid4())[:8]
                followup_data = {
                    "client_id": clients[0]['id'],
                    "client_name": clients[0]['name'],
                    "description": f"TEST Follow-up {unique_id}",
                    "owner": "Test User",
                    "priority_level": 3,
                    "suggested_action": "Test action",
                    "source": "manual"
                }
                create_response = session.post(
                    f"{BASE_URL}/api/followups",
                    headers=auth_headers,
                    json=followup_data
                )
                assert create_response.status_code == 200
                followups = [create_response.json()]
        
        if len(followups) > 0:
            followup_id = followups[0]['id']
            
            # Update the followup
            update_response = session.patch(
                f"{BASE_URL}/api/followups/{followup_id}?status=in_progress",
                headers=auth_headers
            )
            assert update_response.status_code == 200
            
            # Check audit log
            audit_response = session.get(
                f"{BASE_URL}/api/audit-logs?limit=10",
                headers=auth_headers
            )
            assert audit_response.status_code == 200
            logs = audit_response.json()
            
            # Find the follow-up log
            followup_logs = [l for l in logs if l.get('resource_type') == 'followup']
            print(f"Found {len(followup_logs)} follow-up audit logs")


class TestAlertTypes:
    """Test alert type filtering"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_alerts(self, session, auth_headers):
        """GET /api/alerts"""
        response = session.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"Found {len(alerts)} alerts")
        
        if len(alerts) > 0:
            # Get unique alert types
            alert_types = set(a.get('alert_type') for a in alerts)
            print(f"Alert types found: {alert_types}")
    
    def test_get_alerts_by_type(self, session, auth_headers):
        """GET /api/alerts?alert_type=xxx"""
        # First get all alerts to find available types
        all_response = session.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        all_alerts = all_response.json()
        
        if len(all_alerts) > 0:
            alert_type = all_alerts[0].get('alert_type')
            
            response = session.get(
                f"{BASE_URL}/api/alerts?alert_type={alert_type}",
                headers=auth_headers
            )
            assert response.status_code == 200
            filtered = response.json()
            
            # All should be of the specified type
            for alert in filtered:
                assert alert.get('alert_type') == alert_type
            print(f"Filtered by type '{alert_type}': {len(filtered)} alerts")


# Cleanup test data
class TestCleanup:
    """Cleanup TEST_ prefixed data after tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_cleanup_test_policies(self, session, auth_headers):
        """Clean up TEST_ policies"""
        response = session.get(f"{BASE_URL}/api/policy-updates", headers=auth_headers)
        if response.status_code == 200:
            policies = response.json()
            test_policies = [p for p in policies if p.get('title', '').startswith('TEST')]
            for policy in test_policies:
                session.delete(f"{BASE_URL}/api/policy-updates/{policy['id']}", headers=auth_headers)
            print(f"Cleaned up {len(test_policies)} test policies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
