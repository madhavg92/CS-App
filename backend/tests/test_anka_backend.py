"""
Anka Healthcare CS Hub - Backend API Tests
Tests authentication, clients, contacts, alerts, follow-ups, communications, and performance APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data that will be created and cleaned up
TEST_PREFIX = "TEST_"
created_resources = {
    "clients": [],
    "contacts": [],
    "alerts": [],
    "followups": [],
    "communications": []
}

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@anka.health", "password": "admin123"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    return data["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with authentication"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

class TestHealthAndAuth:
    """Test health check and authentication endpoints"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_login_valid_credentials(self):
        """Test login with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@anka.health", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@anka.health"
        assert data["user"]["role"] == "cs_lead"
        print("✓ Login with valid credentials passed")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Login with invalid credentials returns 401")
    
    def test_get_current_user(self, auth_headers):
        """Test getting current user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@anka.health"
        assert data["role"] == "cs_lead"
        print("✓ Get current user passed")

class TestClients:
    """Test client CRUD operations"""
    
    def test_get_all_clients(self, auth_headers):
        """Test fetching all clients"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get all clients passed - found {len(data)} clients")
    
    def test_create_client(self, auth_headers):
        """Test creating a new client"""
        client_data = {
            "name": f"{TEST_PREFIX}Healthcare Partner",
            "contract_start": "2024-01-01",
            "contract_end": "2025-12-31",
            "contracted_services": ["EV", "Prior Auth", "Billing"],
            "sla_targets": {"recovery_rate": 85, "error_rate": 2}
        }
        response = requests.post(
            f"{BASE_URL}/api/clients",
            json=client_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == client_data["name"]
        assert "id" in data
        created_resources["clients"].append(data["id"])
        print(f"✓ Create client passed - ID: {data['id']}")
        return data["id"]
    
    def test_get_client_by_id(self, auth_headers):
        """Test fetching a specific client"""
        # First create a client
        client_id = self.test_create_client(auth_headers)
        
        response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == client_id
        assert "health_score" in data
        print(f"✓ Get client by ID passed - health score: {data['health_score']}")
    
    def test_update_client(self, auth_headers):
        """Test updating a client"""
        # Get existing clients or create one
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            client_id = self.test_create_client(auth_headers)
        else:
            client_id = clients[0]["id"]
        
        update_data = {
            "name": f"{TEST_PREFIX}Updated Healthcare Partner",
            "contract_start": "2024-01-01",
            "contract_end": "2026-12-31",
            "contracted_services": ["EV", "Prior Auth", "Billing", "AR"],
            "sla_targets": {"recovery_rate": 90, "error_rate": 1.5}
        }
        response = requests.put(
            f"{BASE_URL}/api/clients/{client_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Update client passed")

class TestContacts:
    """Test client contact operations"""
    
    def test_get_contacts(self, auth_headers):
        """Test fetching contacts"""
        response = requests.get(f"{BASE_URL}/api/contacts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get contacts passed - found {len(data)} contacts")
    
    def test_create_contact(self, auth_headers):
        """Test creating a contact for a client"""
        # Get a client ID first
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available to create contact")
        
        client_id = clients[0]["id"]
        
        contact_data = {
            "client_id": client_id,
            "name": f"{TEST_PREFIX}John Smith",
            "title": "CFO",
            "email": f"test_{TEST_PREFIX.lower()}john.smith@testclient.com",
            "phone": "555-123-4567",
            "role_type": "decision-maker"
        }
        response = requests.post(
            f"{BASE_URL}/api/contacts",
            json=contact_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == contact_data["name"]
        assert data["role_type"] == "decision-maker"
        created_resources["contacts"].append(data["id"])
        print(f"✓ Create contact passed - ID: {data['id']}")

class TestAlerts:
    """Test alert operations"""
    
    def test_get_alerts(self, auth_headers):
        """Test fetching all alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get alerts passed - found {len(data)} alerts")
    
    def test_get_active_alerts(self, auth_headers):
        """Test fetching active alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts?status=active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned alerts should be active
        for alert in data:
            assert alert["status"] == "active"
        print(f"✓ Get active alerts passed - found {len(data)} active alerts")
    
    def test_create_alert(self, auth_headers):
        """Test creating a new alert"""
        # Get a client first
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client = clients[0]
        
        alert_data = {
            "client_id": client["id"],
            "client_name": client["name"],
            "alert_type": "engagement_gap",
            "severity": "medium",
            "title": f"{TEST_PREFIX}Test Alert - No Contact in 15 Days",
            "description": "Test alert for automated testing",
            "trigger_data": {"days_since_contact": 15}
        }
        response = requests.post(
            f"{BASE_URL}/api/alerts",
            json=alert_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == alert_data["title"]
        assert data["status"] == "active"
        created_resources["alerts"].append(data["id"])
        print(f"✓ Create alert passed - ID: {data['id']}")
        return data["id"]
    
    def test_update_alert_status(self, auth_headers):
        """Test updating alert status"""
        # Create an alert first
        alert_id = self.test_create_alert(auth_headers)
        
        response = requests.patch(
            f"{BASE_URL}/api/alerts/{alert_id}",
            json={"status": "acknowledged"},
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Update alert status passed")
    
    def test_snooze_alert(self, auth_headers):
        """Test snoozing an alert"""
        alert_id = self.test_create_alert(auth_headers)
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/{alert_id}/snooze?days=3",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "snoozed_until" in data
        print("✓ Snooze alert passed")

class TestFollowUps:
    """Test follow-up operations"""
    
    def test_get_followups(self, auth_headers):
        """Test fetching all follow-ups"""
        response = requests.get(f"{BASE_URL}/api/followups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get follow-ups passed - found {len(data)} follow-ups")
    
    def test_get_call_list(self, auth_headers):
        """Test fetching the call list"""
        response = requests.get(f"{BASE_URL}/api/followups/call-list", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get call list passed - {len(data)} items")
    
    def test_create_followup(self, auth_headers):
        """Test creating a follow-up"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client = clients[0]
        
        followup_data = {
            "client_id": client["id"],
            "client_name": client["name"],
            "description": f"{TEST_PREFIX}Follow up on SLA discussion",
            "owner": "admin@anka.health",
            "priority_level": 4,
            "suggested_action": "Schedule call to discuss SLA improvements",
            "source": "manual"
        }
        response = requests.post(
            f"{BASE_URL}/api/followups",
            json=followup_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == followup_data["description"]
        assert data["category"] == "call_required"  # Because priority >= 4
        created_resources["followups"].append(data["id"])
        print(f"✓ Create follow-up passed - ID: {data['id']}")
        return data["id"]
    
    def test_update_followup(self, auth_headers):
        """Test updating a follow-up"""
        followup_id = self.test_create_followup(auth_headers)
        
        response = requests.patch(
            f"{BASE_URL}/api/followups/{followup_id}?status=completed",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Update follow-up passed")

class TestCommunications:
    """Test communication operations"""
    
    def test_get_communications(self, auth_headers):
        """Test fetching communications"""
        response = requests.get(f"{BASE_URL}/api/communications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get communications passed - found {len(data)} communications")
    
    def test_get_draft_communications(self, auth_headers):
        """Test fetching draft communications"""
        response = requests.get(f"{BASE_URL}/api/communications/drafts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get draft communications passed - found {len(data)} drafts")
    
    def test_create_communication(self, auth_headers):
        """Test creating a communication"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client_id = clients[0]["id"]
        
        comm_data = {
            "client_id": client_id,
            "comm_type": "draft",
            "channel": "email",
            "subject": f"{TEST_PREFIX}Monthly Performance Review",
            "body": "Dear Team,\n\nPlease find attached the monthly performance summary.\n\nBest regards,\nAnka CS Team"
        }
        response = requests.post(
            f"{BASE_URL}/api/communications",
            json=comm_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == comm_data["subject"]
        created_resources["communications"].append(data["id"])
        print(f"✓ Create communication passed - ID: {data['id']}")
        return data["id"]
    
    def test_create_communication_with_phi_scrubbing(self, auth_headers):
        """Test that PHI is scrubbed from communications"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client_id = clients[0]["id"]
        
        # Include PHI patterns that should be redacted
        comm_data = {
            "client_id": client_id,
            "comm_type": "draft",
            "channel": "email",
            "subject": f"{TEST_PREFIX}Patient Follow-up",
            "body": "The patient SSN is 123-45-6789 and DOB is 01/15/1985. Please review."
        }
        response = requests.post(
            f"{BASE_URL}/api/communications",
            json=comm_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # PHI should be redacted
        assert "123-45-6789" not in data["body"]
        assert "[REDACTED" in data["body"]
        created_resources["communications"].append(data["id"])
        print("✓ PHI scrubbing in communications passed")

class TestPerformance:
    """Test performance record operations"""
    
    def test_get_performance_records(self, auth_headers):
        """Test fetching performance records"""
        response = requests.get(f"{BASE_URL}/api/performance", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get performance records passed - found {len(data)} records")
    
    def test_create_performance_record(self, auth_headers):
        """Test creating a performance record"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        clients = response.json()
        
        if not clients:
            pytest.skip("No clients available")
        
        client_id = clients[0]["id"]
        
        perf_data = {
            "client_id": client_id,
            "period_start": "2024-01-01",
            "period_end": "2024-01-31",
            "denials_worked": 150,
            "dollars_recovered": 45000.00,
            "recovery_rate": 87.5,
            "sla_compliance_pct": 95.2,
            "error_rate": 1.5,
            "top_denial_codes": {"CO-4": 45, "PR-1": 30, "CO-16": 25},
            "payer_breakdown": {"Medicare": 25000, "Medicaid": 15000, "Commercial": 5000}
        }
        response = requests.post(
            f"{BASE_URL}/api/performance",
            json=perf_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["recovery_rate"] == perf_data["recovery_rate"]
        assert "id" in data
        print(f"✓ Create performance record passed - ID: {data['id']}")

class TestDashboard:
    """Test dashboard and metrics endpoints"""
    
    def test_get_dashboard_metrics(self, auth_headers):
        """Test fetching dashboard metrics"""
        response = requests.get(f"{BASE_URL}/api/dashboard/metrics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        assert "at_risk_clients" in data
        assert "avg_recovery_rate" in data
        assert "open_followups" in data
        assert "active_alerts" in data
        print(f"✓ Dashboard metrics passed - {data['total_clients']} clients, {data['active_alerts']} alerts")

class TestSettings:
    """Test settings endpoints (cs_lead only)"""
    
    def test_get_alert_thresholds(self, auth_headers):
        """Test fetching alert thresholds"""
        response = requests.get(f"{BASE_URL}/api/settings/alert-thresholds", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "engagement_gap_decision_maker_days" in data
        assert "engagement_gap_influencer_days" in data
        assert "renewal_alert_60_days" in data
        print("✓ Get alert thresholds passed")
    
    def test_set_alert_thresholds(self, auth_headers):
        """Test setting alert thresholds"""
        threshold_data = {
            "engagement_gap_decision_maker_days": 14,
            "engagement_gap_influencer_days": 30,
            "renewal_alert_60_days": True,
            "renewal_alert_30_days": True,
            "renewal_alert_15_days": True,
            "performance_decline_threshold_pct": 5.0,
            "followup_overdue_days": 7
        }
        response = requests.post(
            f"{BASE_URL}/api/settings/alert-thresholds",
            json=threshold_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Set alert thresholds passed")

class TestUsers:
    """Test user management endpoints"""
    
    def test_get_users(self, auth_headers):
        """Test fetching users (cs_lead only)"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify admin user exists
        admin_user = next((u for u in data if u["email"] == "admin@anka.health"), None)
        assert admin_user is not None
        assert admin_user["role"] == "cs_lead"
        print(f"✓ Get users passed - found {len(data)} users")

class TestAlertEngine:
    """Test alert generation engine endpoints"""
    
    def test_check_engagement_gaps(self, auth_headers):
        """Test engagement gap check"""
        response = requests.post(
            f"{BASE_URL}/api/alerts/check-engagement",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Check engagement gaps passed - {data['message']}")
    
    def test_check_renewals(self, auth_headers):
        """Test renewal alert check"""
        response = requests.post(
            f"{BASE_URL}/api/alerts/check-renewals",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Check renewals passed - {data['message']}")
    
    def test_check_overdue_followups(self, auth_headers):
        """Test overdue follow-ups check"""
        response = requests.post(
            f"{BASE_URL}/api/alerts/check-overdue-followups",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Check overdue follow-ups passed - {data['message']}")

class TestCRM:
    """Test CRM sync endpoints"""
    
    def test_get_crm_contacts(self, auth_headers):
        """Test fetching CRM contacts"""
        response = requests.get(f"{BASE_URL}/api/crm/contacts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get CRM contacts passed - found {len(data)} contacts")
    
    def test_get_crm_deals(self, auth_headers):
        """Test fetching CRM deals"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get CRM deals passed - found {len(data)} deals")

class TestTemplates:
    """Test AI prompt templates"""
    
    def test_get_templates(self, auth_headers):
        """Test fetching prompt templates"""
        response = requests.get(f"{BASE_URL}/api/templates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get templates passed - found {len(data)} templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
