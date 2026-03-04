"""
Test Suite for Section 5: NLP-Powered Alerts + Call Transcripts
Tests: CallTranscript model, CRUD endpoints, AI analysis, new stakeholder detection
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
CS_LEAD_EMAIL = "gayatri.garg@anka.health"
CS_LEAD_PASSWORD = "anka2026!"
TEST_CLIENT_ID = "2544b824-d25f-4dab-ad16-2be53af92e11"


class TestTranscriptsCRUD:
    """Test CallTranscript CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_transcript_ids = []
    
    def teardown_method(self):
        """Cleanup: Try to clean up any test transcripts created during tests"""
        # Note: If no delete endpoint exists, this will just pass
        pass
    
    def test_01_login_success(self):
        """Test login with CS Lead credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "cs_lead"
        print("PASS: Login successful with cs_lead credentials")
    
    def test_02_get_transcripts_empty_or_existing(self):
        """Test GET /api/transcripts endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/transcripts?client_id={TEST_CLIENT_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/transcripts returns list with {len(data)} items")
    
    def test_03_create_transcript_basic(self):
        """Test POST /api/transcripts creates a new transcript"""
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 30,
            "attendees": ["John Smith", "Jane Doe"],
            "transcript_text": "Test transcript for basic creation test",
            "source": "manual"
        }
        response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Create transcript failed: {response.text}"
        data = response.json()
        assert "id" in data
        self.created_transcript_ids.append(data["id"])
        print(f"PASS: POST /api/transcripts created transcript with id {data['id']}")
        return data["id"]
    
    def test_04_create_transcript_with_new_attendees(self):
        """Test creating transcript with attendees not in client contacts"""
        # These attendees should trigger 'new stakeholder' detection during analysis
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 45,
            "attendees": ["TEST_Unknown_Person_ABC", "TEST_New_Stakeholder_XYZ", "TEST_Random_Name_123"],
            "transcript_text": "We discussed the recent performance issues. TEST_Unknown_Person_ABC expressed concern about turnaround times. TEST_New_Stakeholder_XYZ mentioned they are taking over operations next month. The team agreed to schedule a follow-up call next week.",
            "source": "manual"
        }
        response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Create transcript failed: {response.text}"
        data = response.json()
        assert "id" in data
        self.test_transcript_id = data["id"]
        print(f"PASS: POST /api/transcripts created transcript with new attendees, id: {data['id']}")
        return data["id"]
    
    def test_05_analyze_transcript_ai(self):
        """Test POST /api/transcripts/{id}/analyze returns AI analysis"""
        # First create a transcript
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 60,
            "attendees": ["TEST_Analysis_Person_AAA", "TEST_Analysis_Person_BBB"],
            "transcript_text": """
            Meeting started with a review of last month's metrics.
            The client expressed frustration with the error rate being above SLA.
            Action items:
            1. Anka team to provide root cause analysis by Friday
            2. Schedule training for new billing codes
            3. Review AR aging report together next week
            
            Client mentioned they are considering expanding services to include prior auth.
            CEO joined briefly to express concerns about renewal terms.
            Meeting ended on a positive note with agreement to continue partnership.
            """,
            "source": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert create_response.status_code == 200
        transcript_id = create_response.json()["id"]
        
        # Analyze the transcript
        analyze_response = requests.post(
            f"{BASE_URL}/api/transcripts/{transcript_id}/analyze",
            headers=self.headers
        )
        assert analyze_response.status_code == 200, f"Analyze failed: {analyze_response.text}"
        data = analyze_response.json()
        
        # Verify response structure
        assert "summary" in data, "Response missing 'summary'"
        assert "action_items" in data, "Response missing 'action_items'"
        assert "sentiment" in data, "Response missing 'sentiment'"
        assert "new_attendees" in data, "Response missing 'new_attendees'"
        
        print(f"PASS: POST /api/transcripts/{transcript_id}/analyze returned analysis:")
        print(f"  - Summary: {data['summary'][:100]}...")
        print(f"  - Sentiment: {data['sentiment']}")
        print(f"  - Action Items count: {len(data['action_items'])}")
        print(f"  - New Attendees: {data['new_attendees']}")
        
        return transcript_id
    
    def test_06_verify_transcript_updated_after_analysis(self):
        """Test that transcript is updated with analysis results after calling analyze"""
        # Create and analyze a transcript
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 30,
            "attendees": ["TEST_Verify_Person"],
            "transcript_text": "Short call to verify the analysis update flow. Everything looks good.",
            "source": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert create_response.status_code == 200
        transcript_id = create_response.json()["id"]
        
        # Wait a moment for AI processing
        time.sleep(1)
        
        # Analyze
        analyze_response = requests.post(
            f"{BASE_URL}/api/transcripts/{transcript_id}/analyze",
            headers=self.headers
        )
        assert analyze_response.status_code == 200
        
        # Wait for AI response
        time.sleep(2)
        
        # Fetch transcripts and verify update
        get_response = requests.get(
            f"{BASE_URL}/api/transcripts?client_id={TEST_CLIENT_ID}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        transcripts = get_response.json()
        
        # Find our transcript
        our_transcript = next((t for t in transcripts if t["id"] == transcript_id), None)
        assert our_transcript is not None, "Created transcript not found in list"
        
        # Verify it has analysis fields populated
        assert our_transcript.get("summary"), "Transcript summary should be populated after analysis"
        print(f"PASS: Transcript updated after analysis - summary: {our_transcript.get('summary', 'N/A')[:80]}...")
    
    def test_07_new_stakeholder_alert_created(self):
        """Test that new_stakeholder alerts are created for unrecognized attendees"""
        # Create transcript with clearly new/unique attendees
        unique_name = f"TEST_UNIQUE_STAKEHOLDER_{int(time.time())}"
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 15,
            "attendees": [unique_name],
            "transcript_text": f"Quick call with {unique_name} to discuss onboarding.",
            "source": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert create_response.status_code == 200
        transcript_id = create_response.json()["id"]
        
        # Analyze to trigger stakeholder detection
        analyze_response = requests.post(
            f"{BASE_URL}/api/transcripts/{transcript_id}/analyze",
            headers=self.headers
        )
        assert analyze_response.status_code == 200
        analysis_data = analyze_response.json()
        
        # Check that new_attendees includes our unique name
        assert unique_name in analysis_data.get("new_attendees", []), \
            f"Expected {unique_name} in new_attendees: {analysis_data.get('new_attendees')}"
        
        # Wait a moment for alert creation
        time.sleep(1)
        
        # Check alerts for new_stakeholder type
        alerts_response = requests.get(
            f"{BASE_URL}/api/alerts?client_id={TEST_CLIENT_ID}&alert_type=new_stakeholder",
            headers=self.headers
        )
        assert alerts_response.status_code == 200
        alerts = alerts_response.json()
        
        # Find alert for our unique stakeholder
        matching_alerts = [a for a in alerts if unique_name in a.get("title", "") or unique_name in str(a.get("trigger_data", {}))]
        assert len(matching_alerts) > 0, f"No new_stakeholder alert found for {unique_name}"
        
        alert = matching_alerts[0]
        assert alert["severity"] == "low", "new_stakeholder alerts should have 'low' severity"
        print(f"PASS: new_stakeholder alert created for {unique_name}")
        print(f"  - Alert title: {alert['title']}")
        print(f"  - Severity: {alert['severity']}")


class TestNLPHelpers:
    """Test NLP helper functions (analyze_email_sentiment, analyze_scope_creep)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_08_scheduler_nlp_email_analysis_logs(self):
        """Test that scheduler NLP email analysis is implemented (checks logs/behavior)"""
        # This test verifies the feature exists - actual execution requires M365 connection
        # For now, we just verify the endpoint doesn't crash
        # The scheduler would call analyze_email_sentiment internally
        
        # Verify alerts endpoint works (where frustration alerts would appear)
        response = requests.get(
            f"{BASE_URL}/api/alerts?alert_type=frustration",
            headers=self.headers
        )
        assert response.status_code == 200
        print("PASS: Alerts endpoint supports frustration alert_type filter")
    
    def test_09_scope_creep_alerts_endpoint(self):
        """Test that scope_creep alerts can be queried"""
        response = requests.get(
            f"{BASE_URL}/api/alerts?alert_type=scope_creep",
            headers=self.headers
        )
        assert response.status_code == 200
        print("PASS: Alerts endpoint supports scope_creep alert_type filter")


class TestAuditLogging:
    """Test audit logging for transcript operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CS_LEAD_EMAIL,
            "password": CS_LEAD_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_10_audit_log_transcript_create(self):
        """Test that transcript_create is logged in audit"""
        # Create a transcript
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 10,
            "attendees": ["Audit Test Person"],
            "transcript_text": "Test for audit logging",
            "source": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert create_response.status_code == 200
        transcript_id = create_response.json()["id"]
        
        # Wait for audit log to be written
        time.sleep(1)
        
        # Check audit logs
        audit_response = requests.get(
            f"{BASE_URL}/api/audit-logs?action_type=transcript_create",
            headers=self.headers
        )
        assert audit_response.status_code == 200
        audit_logs = audit_response.json()
        
        # Find our log entry
        matching = [log for log in audit_logs if log.get("resource_id") == transcript_id]
        assert len(matching) > 0, f"No audit log found for transcript_create {transcript_id}"
        
        print(f"PASS: transcript_create logged in audit for transcript {transcript_id}")
    
    def test_11_audit_log_transcript_analysis(self):
        """Test that transcript_analysis is logged in audit"""
        # Create and analyze a transcript
        payload = {
            "client_id": TEST_CLIENT_ID,
            "call_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 15,
            "attendees": ["Analysis Audit Person"],
            "transcript_text": "Test for audit logging of analysis",
            "source": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/transcripts",
            json=payload,
            headers=self.headers
        )
        assert create_response.status_code == 200
        transcript_id = create_response.json()["id"]
        
        # Analyze
        analyze_response = requests.post(
            f"{BASE_URL}/api/transcripts/{transcript_id}/analyze",
            headers=self.headers
        )
        assert analyze_response.status_code == 200
        
        # Wait for audit log
        time.sleep(2)
        
        # Check audit logs for ai_generation with transcript_analysis
        audit_response = requests.get(
            f"{BASE_URL}/api/audit-logs?action_type=ai_generation",
            headers=self.headers
        )
        assert audit_response.status_code == 200
        audit_logs = audit_response.json()
        
        # Find log for transcript_analysis
        matching = [log for log in audit_logs 
                    if log.get("resource_id") == transcript_id 
                    and log.get("resource_type") == "transcript_analysis"]
        assert len(matching) > 0, f"No audit log found for transcript_analysis {transcript_id}"
        
        print(f"PASS: transcript_analysis logged in audit for transcript {transcript_id}")


class TestTranscriptsAuthentication:
    """Test authentication requirements for transcript endpoints"""
    
    def test_12_get_transcripts_requires_auth(self):
        """Test GET /api/transcripts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/transcripts")
        assert response.status_code == 401
        print("PASS: GET /api/transcripts requires authentication (401)")
    
    def test_13_create_transcript_requires_auth(self):
        """Test POST /api/transcripts requires authentication"""
        payload = {"client_id": TEST_CLIENT_ID, "call_date": "2024-01-01"}
        response = requests.post(f"{BASE_URL}/api/transcripts", json=payload)
        assert response.status_code == 401
        print("PASS: POST /api/transcripts requires authentication (401)")
    
    def test_14_analyze_transcript_requires_auth(self):
        """Test POST /api/transcripts/{id}/analyze requires authentication"""
        response = requests.post(f"{BASE_URL}/api/transcripts/fake-id/analyze")
        assert response.status_code == 401
        print("PASS: POST /api/transcripts/{id}/analyze requires authentication (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
