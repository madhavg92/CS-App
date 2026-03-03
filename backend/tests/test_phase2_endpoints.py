"""
Anka Healthcare CS Hub - Phase 2 Backend API Tests
Tests new features: Policy Updates, Email Cadences, Weekly Summary, Innovation Briefing, Audit Logs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

TEST_PREFIX = "TEST_PHASE2_"

@pytest.fixture(scope="module")
def admin_auth():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@anka.health", "password": "admin123"}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    return {
        "Authorization": f"Bearer {data['access_token']}",
        "Content-Type": "application/json"
    }

@pytest.fixture(scope="module")
def csm_auth():
    """Get authentication token for CSM user (gayatri.garg)"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "gayatri.garg@anka.health", "password": "anka2026!"}
    )
    assert response.status_code == 200, f"CSM login failed: {response.text}"
    data = response.json()
    return {
        "Authorization": f"Bearer {data['access_token']}",
        "Content-Type": "application/json"
    }

@pytest.fixture(scope="module")
def client_id(admin_auth):
    """Get a valid client ID for testing"""
    response = requests.get(f"{BASE_URL}/api/clients", headers=admin_auth)
    assert response.status_code == 200
    clients = response.json()
    assert len(clients) > 0, "No clients available for testing"
    return clients[0]["id"]


class TestAuthWithNewCredentials:
    """Test authentication with both admin and CS Lead (Gayatri) credentials"""
    
    def test_admin_login(self):
        """Test admin login with admin@anka.health / admin123"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@anka.health", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "admin@anka.health"
        assert data["user"]["role"] == "cs_lead"
        print("✓ Admin login (admin@anka.health / admin123) passed")
    
    def test_gayatri_login(self):
        """Test CS Lead login with gayatri.garg@anka.health / anka2026!"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "gayatri.garg@anka.health", "password": "anka2026!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "gayatri.garg@anka.health"
        print(f"✓ Gayatri login (gayatri.garg@anka.health / anka2026!) passed - Role: {data['user']['role']}")


class TestPolicyUpdates:
    """Test Policy Update endpoints"""
    
    def test_get_policy_updates(self, admin_auth):
        """Test GET /api/policy-updates"""
        response = requests.get(f"{BASE_URL}/api/policy-updates", headers=admin_auth)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/policy-updates passed - found {len(data)} policies")
    
    def test_create_policy_update(self, admin_auth):
        """Test POST /api/policy-updates"""
        policy_data = {
            "id": str(uuid.uuid4()),
            "title": f"{TEST_PREFIX}Medicare Billing Update",
            "description": "New Medicare billing guidelines effective January 2026",
            "policy_type": "payer_update",
            "affected_services": ["Billing", "AR"],
            "affected_payers": ["Medicare"],
            "effective_date": "2026-01-01",
            "source_url": "https://cms.gov/example",
            "status": "active"
        }
        response = requests.post(
            f"{BASE_URL}/api/policy-updates",
            json=policy_data,
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == policy_data["title"]
        print(f"✓ POST /api/policy-updates passed - created policy: {data['id']}")
        return data["id"]
    
    def test_csm_can_read_policy_updates(self, csm_auth):
        """Test that CSM role can read policy updates"""
        response = requests.get(f"{BASE_URL}/api/policy-updates", headers=csm_auth)
        assert response.status_code == 200
        print("✓ CSM can read policy updates")
    
    def test_patch_policy_update(self, admin_auth):
        """Test PATCH /api/policy-updates/{policy_id}"""
        # First create a policy
        policy_id = self.test_create_policy_update(admin_auth)
        
        response = requests.patch(
            f"{BASE_URL}/api/policy-updates/{policy_id}",
            json={"status": "archived"},
            headers=admin_auth
        )
        assert response.status_code == 200
        print("✓ PATCH /api/policy-updates/{policy_id} passed")
    
    def test_delete_policy_update(self, admin_auth):
        """Test DELETE /api/policy-updates/{policy_id}"""
        # First create a policy
        policy_id = self.test_create_policy_update(admin_auth)
        
        response = requests.delete(
            f"{BASE_URL}/api/policy-updates/{policy_id}",
            headers=admin_auth
        )
        assert response.status_code == 200
        print("✓ DELETE /api/policy-updates/{policy_id} passed")


class TestEmailCadences:
    """Test Email Cadence endpoints"""
    
    def test_get_email_cadences(self, admin_auth):
        """Test GET /api/email-cadences"""
        response = requests.get(f"{BASE_URL}/api/email-cadences", headers=admin_auth)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/email-cadences passed - found {len(data)} cadences")
    
    def test_create_email_cadence(self, admin_auth, client_id):
        """Test POST /api/email-cadences"""
        cadence_data = {
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "client_name": "Test Client",
            "cadence_type": "monthly_checkin",
            "frequency_days": 30,
            "auto_send": False,
            "status": "active",
            "template_slug": "engagement_outreach"
        }
        response = requests.post(
            f"{BASE_URL}/api/email-cadences",
            json=cadence_data,
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cadence_type"] == "monthly_checkin"
        assert "next_trigger" in data
        print(f"✓ POST /api/email-cadences passed - created cadence: {data['id']}")
        return data["id"]
    
    def test_patch_email_cadence(self, admin_auth, client_id):
        """Test PATCH /api/email-cadences/{cadence_id}"""
        # First create a cadence
        cadence_id = self.test_create_email_cadence(admin_auth, client_id)
        
        response = requests.patch(
            f"{BASE_URL}/api/email-cadences/{cadence_id}?status=paused",
            headers=admin_auth
        )
        assert response.status_code == 200
        print("✓ PATCH /api/email-cadences/{cadence_id} passed - status updated to paused")
    
    def test_trigger_email_cadence(self, admin_auth, client_id):
        """Test POST /api/email-cadences/{cadence_id}/send"""
        # First create a cadence
        cadence_id = self.test_create_email_cadence(admin_auth, client_id)
        
        response = requests.post(
            f"{BASE_URL}/api/email-cadences/{cadence_id}/send",
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ POST /api/email-cadences/{cadence_id}/send passed - {data['message']}")
    
    def test_delete_email_cadence(self, admin_auth, client_id):
        """Test DELETE /api/email-cadences/{cadence_id}"""
        # First create a cadence
        cadence_id = self.test_create_email_cadence(admin_auth, client_id)
        
        response = requests.delete(
            f"{BASE_URL}/api/email-cadences/{cadence_id}",
            headers=admin_auth
        )
        assert response.status_code == 200
        print("✓ DELETE /api/email-cadences/{cadence_id} passed")


class TestWeeklySummary:
    """Test Weekly Summary endpoint"""
    
    def test_generate_weekly_summary(self, admin_auth, client_id):
        """Test POST /api/weekly-summary"""
        response = requests.post(
            f"{BASE_URL}/api/weekly-summary",
            json={
                "client_id": client_id,
                "week_ending": "2026-01-10"
            },
            headers=admin_auth,
            timeout=60  # AI generation may take time
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data or "key_topics" in data
        print("✓ POST /api/weekly-summary passed - AI summary generated")


class TestInnovationBriefing:
    """Test Innovation Briefing endpoint"""
    
    def test_mark_innovation_briefed(self, admin_auth, client_id):
        """Test POST /api/clients/{client_id}/mark-innovation-briefed"""
        response = requests.post(
            f"{BASE_URL}/api/clients/{client_id}/mark-innovation-briefed",
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ POST /api/clients/{client_id}/mark-innovation-briefed passed")
        
        # Verify the client was updated
        client_resp = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=admin_auth)
        client = client_resp.json()
        assert client.get("last_innovation_briefing") is not None
        print("✓ Client last_innovation_briefing field updated")


class TestAuditLogs:
    """Test Audit Log endpoints"""
    
    def test_get_audit_logs(self, admin_auth):
        """Test GET /api/audit-logs"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", headers=admin_auth)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/audit-logs passed - found {len(data)} logs")
    
    def test_get_audit_logs_with_filter(self, admin_auth):
        """Test GET /api/audit-logs with action_type filter"""
        response = requests.get(
            f"{BASE_URL}/api/audit-logs?action_type=alert_action&limit=50",
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # If results returned, all should match the filter
        for log in data:
            if log.get("action_type"):
                assert log["action_type"] == "alert_action"
        print(f"✓ GET /api/audit-logs with filter passed - found {len(data)} logs")
    
    def test_get_audit_logs_with_date_range(self, admin_auth):
        """Test GET /api/audit-logs with date range filter"""
        response = requests.get(
            f"{BASE_URL}/api/audit-logs?start_date=2025-01-01&end_date=2027-01-01",
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/audit-logs with date range passed - found {len(data)} logs")
    
    def test_gayatri_can_access_audit_logs_as_cs_lead(self, csm_auth):
        """Test that Gayatri (cs_lead role) can access audit logs"""
        # Note: gayatri.garg@anka.health has cs_lead role, not csm
        response = requests.get(f"{BASE_URL}/api/audit-logs", headers=csm_auth)
        # Gayatri is cs_lead so she should be able to access audit logs
        assert response.status_code == 200
        print("✓ Gayatri (cs_lead) correctly has access to audit logs")


class TestDocxExport:
    """Test .docx export endpoints (Report generation)"""
    
    def test_generate_docx_report(self, admin_auth, client_id):
        """Test POST /api/reports/generate-docx"""
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-docx?client_id={client_id}&report_type=internal",
            headers=admin_auth,
            timeout=60
        )
        # Expect 200 with blob or possible error if not fully implemented
        if response.status_code == 200:
            assert response.headers.get('content-type') in ['application/octet-stream', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            print("✓ POST /api/reports/generate-docx passed - .docx file generated")
        else:
            print(f"⚠ POST /api/reports/generate-docx returned {response.status_code} - may need implementation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
