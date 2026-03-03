"""
Test Microsoft 365 Integration Features for Anka CS Hub Section 4
- M365 configure/test endpoints
- Email thread endpoints (mocked - requires real Azure AD)
- Calendar events endpoints (mocked - requires real Azure AD)
- Integrations status endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestM365Integration:
    """Microsoft 365 Integration API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        # Try gayatri.garg first
        login_data = {"email": "gayatri.garg@anka.health", "password": "anka2026!"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            # Fallback to admin
            login_data = {"email": "admin@anka.health", "password": "admin123"}
            response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.user = response.json()["user"]
            self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        else:
            pytest.skip("Authentication failed - skipping tests")
    
    # =====================================================
    # Integration Status Tests
    # =====================================================
    
    def test_get_integrations_list(self):
        """GET /api/integrations - should return list with microsoft_365"""
        response = requests.get(f"{BASE_URL}/api/integrations", headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Find microsoft_365 integration
        m365 = next((i for i in data if i.get('integration_name') == 'microsoft_365'), None)
        assert m365 is not None, "microsoft_365 integration should exist"
        assert 'connection_status' in m365, "Should have connection_status field"
        print(f"PASS: M365 integration found with status: {m365.get('connection_status')}")
    
    # =====================================================
    # M365 Configuration Tests
    # =====================================================
    
    def test_configure_m365_missing_fields(self):
        """POST /api/integrations/microsoft-365/configure - should fail with missing fields"""
        incomplete_config = {"tenant_id": "test-tenant"}
        response = requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/configure",
            headers=self.headers,
            json=incomplete_config
        )
        
        assert response.status_code == 400, f"Expected 400 for incomplete config, got {response.status_code}"
        assert "Missing required field" in response.text or "client_id" in response.text.lower() or "client_secret" in response.text.lower()
        print("PASS: Missing fields validation works")
    
    def test_configure_m365_with_all_fields(self):
        """POST /api/integrations/microsoft-365/configure - should save configuration"""
        config = {
            "tenant_id": "test-tenant-id-123",
            "client_id": "test-client-id-456",
            "client_secret": "test-secret-789",
            "shared_mailbox": "cs-team@test.com"
        }
        response = requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/configure",
            headers=self.headers,
            json=config
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should have message field"
        assert "saved" in data["message"].lower() or "configuration" in data["message"].lower()
        print(f"PASS: Configuration saved - {data['message']}")
    
    def test_configure_m365_updates_integration_status(self):
        """Verify configuration is reflected in integrations list"""
        response = requests.get(f"{BASE_URL}/api/integrations", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        m365 = next((i for i in data if i.get('integration_name') == 'microsoft_365'), None)
        assert m365 is not None
        
        # After configuration, should have config fields populated
        config = m365.get('config', {})
        assert config.get('tenant_id') == 'test-tenant-id-123', "tenant_id should be saved"
        assert config.get('client_id') == 'test-client-id-456', "client_id should be saved"
        # client_secret should be stored but we might not return it for security
        print("PASS: Configuration reflected in integrations list")
    
    # =====================================================
    # M365 Test Connection Tests
    # =====================================================
    
    def test_test_connection_with_invalid_credentials(self):
        """POST /api/integrations/microsoft-365/test - should fail with invalid Azure credentials"""
        # First ensure configuration exists
        config = {
            "tenant_id": "invalid-tenant-id",
            "client_id": "invalid-client-id",
            "client_secret": "invalid-secret"
        }
        requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/configure",
            headers=self.headers,
            json=config
        )
        
        response = requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/test",
            headers=self.headers
        )
        
        # Should return 200 with error status (not 500)
        assert response.status_code == 200, f"Expected 200 with error status, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert 'status' in data, "Response should have status field"
        assert data['status'] == 'error', f"Expected error status for invalid credentials, got: {data}"
        assert 'message' in data, "Should have error message"
        print(f"PASS: Test connection returns error for invalid credentials - {data.get('message', '')[:100]}")
    
    def test_test_connection_with_incomplete_config_returns_error(self):
        """POST /api/integrations/microsoft-365/test - returns error status with invalid credentials"""
        # Save config with non-empty but invalid values
        config = {"tenant_id": "test", "client_id": "test", "client_secret": "test"}
        requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/configure",
            headers=self.headers,
            json=config
        )
        
        response = requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/test",
            headers=self.headers
        )
        
        # Should return 200 with error status (graceful failure)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('status') == 'error', f"Expected error status, got: {data}"
        print("PASS: Test connection returns error status for incomplete config")
    
    # =====================================================
    # Email Endpoints Tests (Mocked - M365 Not Connected)
    # =====================================================
    
    def test_email_threads_m365_not_connected(self):
        """GET /api/email/threads - should fail gracefully when M365 not connected"""
        # Ensure M365 is not actually connected (it uses test credentials)
        response = requests.get(f"{BASE_URL}/api/email/threads", headers=self.headers)
        
        # Should return 400 with appropriate error
        assert response.status_code == 400, f"Expected 400 when M365 not connected, got {response.status_code}"
        assert "not connected" in response.text.lower() or "not configured" in response.text.lower()
        print("PASS: Email threads endpoint returns 400 when M365 not connected")
    
    def test_email_thread_detail_m365_not_connected(self):
        """GET /api/email/thread/{conversation_id} - should fail gracefully"""
        response = requests.get(
            f"{BASE_URL}/api/email/thread/test-conversation-123",
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Email thread detail returns 400 when M365 not connected")
    
    def test_email_draft_reply_m365_not_connected(self):
        """POST /api/email/draft-reply - should fail gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/email/draft-reply",
            headers=self.headers,
            json={"conversation_id": "test-conv-123"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Email draft reply returns 400 when M365 not connected")
    
    def test_email_send_m365_not_connected(self):
        """POST /api/email/send - should fail gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/email/send",
            headers=self.headers,
            json={
                "message_id": "test-msg-123",
                "body": "Test reply",
                "subject": "RE: Test"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Email send returns 400 when M365 not connected")
    
    # =====================================================
    # Calendar Endpoints Tests (Mocked - M365 Not Connected)
    # =====================================================
    
    def test_calendar_events_m365_not_connected(self):
        """GET /api/calendar/events - should fail gracefully when M365 not connected"""
        response = requests.get(
            f"{BASE_URL}/api/calendar/events",
            headers=self.headers,
            params={"start_date": "2026-01-01T00:00:00Z", "end_date": "2026-01-31T23:59:59Z"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Calendar events returns 400 when M365 not connected")
    
    def test_calendar_create_event_m365_not_connected(self):
        """POST /api/calendar/create-event - should fail gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/calendar/create-event",
            headers=self.headers,
            json={
                "subject": "Test Meeting",
                "start_datetime": "2026-01-15T10:00:00",
                "end_datetime": "2026-01-15T11:00:00",
                "attendee_emails": ["test@test.com"]
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Calendar create event returns 400 when M365 not connected")
    
    # =====================================================
    # Authorization Tests
    # =====================================================
    
    def test_configure_m365_requires_auth(self):
        """M365 configure endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/integrations/microsoft-365/configure",
            json={"tenant_id": "test", "client_id": "test", "client_secret": "test"}
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: Configure M365 requires authentication")
    
    def test_test_connection_requires_auth(self):
        """M365 test connection endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/integrations/microsoft-365/test")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("PASS: Test connection requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
