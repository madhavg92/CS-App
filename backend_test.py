import requests
import sys
import json
from datetime import datetime

class CSPlatformAPITester:
    def __init__(self, base_url="https://cs-ops-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_client_id = None
        self.test_alert_id = None
        self.test_followup_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def run_api_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success:
                details += f" - Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if response.content and success else response.text

        except Exception as e:
            self.log_test(name, False, str(e))
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_api_test("API Root", "GET", "", 200)

    def test_get_clients(self):
        """Test getting all clients"""
        success, response = self.run_api_test("Get All Clients", "GET", "clients", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} existing clients")
            if len(response) > 0:
                print(f"   Sample client: {response[0].get('name', 'Unknown')}")
        return success, response

    def test_create_client(self):
        """Test creating a new client"""
        client_data = {
            "name": f"Test Client {datetime.now().strftime('%H%M%S')}",
            "relationship_owner": "Test Owner",
            "contract_value": 250000.00,
            "renewal_date": "2025-12-31"
        }
        success, response = self.run_api_test("Create Client", "POST", "clients", 200, client_data)
        if success and isinstance(response, dict):
            self.test_client_id = response.get('id')
            print(f"   Created client with ID: {self.test_client_id}")
        return success, response

    def test_get_client_by_id(self):
        """Test getting a specific client"""
        if not self.test_client_id:
            self.log_test("Get Client by ID", False, "No test client ID available")
            return False, {}
        
        return self.run_api_test("Get Client by ID", "GET", f"clients/{self.test_client_id}", 200)

    def test_add_contact_to_client(self):
        """Test adding a contact to a client"""
        if not self.test_client_id:
            self.log_test("Add Contact to Client", False, "No test client ID available")
            return False, {}

        contact_data = {
            "name": "Dr. Jane Smith",
            "title": "Chief Medical Officer",
            "email": "jane.smith@testclient.com",
            "phone": "555-0123",
            "role": "decision-maker"
        }
        return self.run_api_test("Add Contact to Client", "POST", f"clients/{self.test_client_id}/contacts", 200, contact_data)

    def test_get_alerts(self):
        """Test getting alerts"""
        success, response = self.run_api_test("Get All Alerts", "GET", "alerts", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} existing alerts")
        return success, response

    def test_create_alert(self):
        """Test creating an alert"""
        if not self.test_client_id:
            # Use a mock client ID for testing
            client_id = "test-client-id"
            client_name = "Test Client"
        else:
            client_id = self.test_client_id
            client_name = f"Test Client {datetime.now().strftime('%H%M%S')}"

        alert_data = {
            "client_id": client_id,
            "client_name": client_name,
            "alert_type": "engagement_gap",
            "severity": "medium",
            "message": "No engagement in the past 30 days"
        }
        success, response = self.run_api_test("Create Alert", "POST", "alerts", 200, alert_data)
        if success and isinstance(response, dict):
            self.test_alert_id = response.get('id')
            print(f"   Created alert with ID: {self.test_alert_id}")
        return success, response

    def test_update_alert_status(self):
        """Test updating alert status"""
        if not self.test_alert_id:
            self.log_test("Update Alert Status", False, "No test alert ID available")
            return False, {}
        
        return self.run_api_test("Update Alert Status", "PATCH", f"alerts/{self.test_alert_id}?status=acknowledged", 200)

    def test_get_followups(self):
        """Test getting follow-ups"""
        success, response = self.run_api_test("Get All Follow-ups", "GET", "followups", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} existing follow-ups")
        return success, response

    def test_create_followup(self):
        """Test creating a follow-up"""
        if not self.test_client_id:
            client_id = "test-client-id"
            client_name = "Test Client"
        else:
            client_id = self.test_client_id
            client_name = f"Test Client {datetime.now().strftime('%H%M%S')}"

        followup_data = {
            "client_id": client_id,
            "client_name": client_name,
            "description": "Schedule QBR meeting",
            "priority": "high",
            "action_type": "call",
            "owner": "Test CS Manager",
            "suggested_action": "Call to schedule quarterly business review"
        }
        success, response = self.run_api_test("Create Follow-up", "POST", "followups", 200, followup_data)
        if success and isinstance(response, dict):
            self.test_followup_id = response.get('id')
            print(f"   Created follow-up with ID: {self.test_followup_id}")
        return success, response

    def test_update_followup_status(self):
        """Test updating follow-up status"""
        if not self.test_followup_id:
            self.log_test("Update Follow-up Status", False, "No test follow-up ID available")
            return False, {}
        
        return self.run_api_test("Update Follow-up Status", "PATCH", f"followups/{self.test_followup_id}?status=completed", 200)

    def test_get_performance_metrics(self):
        """Test getting performance metrics"""
        success, response = self.run_api_test("Get Performance Metrics", "GET", "performance", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} existing metrics")
        return success, response

    def test_get_communications(self):
        """Test getting communications for a client"""
        if not self.test_client_id:
            # Use a known client ID or skip
            self.log_test("Get Communications", False, "No test client ID available")
            return False, {}
        
        success, response = self.run_api_test("Get Communications", "GET", f"communications/{self.test_client_id}", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} communications for client")
        return success, response

    def test_create_communication(self):
        """Test creating a communication with PHI scrubbing"""
        if not self.test_client_id:
            client_id = "test-client-id"
            client_name = "Test Client"
        else:
            client_id = self.test_client_id
            client_name = f"Test Client {datetime.now().strftime('%H%M%S')}"

        # Test content with PHI that should be scrubbed
        comm_data = {
            "client_id": client_id,
            "client_name": client_name,
            "comm_type": "email",
            "subject": "Test Communication",
            "content": "Patient John Doe (SSN: 123-45-6789) called about his claim. His phone number is 555-123-4567 and email is john.doe@email.com. MRN: 12345."
        }
        success, response = self.run_api_test("Create Communication with PHI", "POST", "communications", 200, comm_data)
        if success:
            print("   PHI scrubbing test: Content should have redacted SSN, phone, email, and MRN")
        return success, response

    def test_ai_email_drafting(self):
        """Test AI email drafting functionality"""
        if not self.test_client_id:
            client_id = "test-client-id"
            client_name = "Test Client"
        else:
            client_id = self.test_client_id
            client_name = f"Test Client {datetime.now().strftime('%H%M%S')}"

        draft_data = {
            "client_id": client_id,
            "client_name": client_name,
            "context": "Following up on our recent QBR meeting",
            "email_type": "follow_up"
        }
        success, response = self.run_api_test("Draft AI Email", "POST", "draft-email", 200, draft_data)
        if success and isinstance(response, dict):
            subject = response.get('subject', '')
            body = response.get('body', '')
            print(f"   AI generated subject: {subject[:50]}...")
            print(f"   AI generated body length: {len(body)} characters")
        return success, response

def main():
    print("🏥 Anka Healthcare CS Platform API Testing")
    print("=" * 50)
    
    tester = CSPlatformAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_get_clients,
        tester.test_create_client,
        tester.test_get_client_by_id,
        tester.test_add_contact_to_client,
        tester.test_get_alerts,
        tester.test_create_alert,
        tester.test_update_alert_status,
        tester.test_get_followups,
        tester.test_create_followup,
        tester.test_update_followup_status,
        tester.test_get_performance_metrics,
        tester.test_get_communications,
        tester.test_create_communication,
        tester.test_ai_email_drafting
    ]

    print(f"\nRunning {len(tests)} API tests...\n")
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ {test.__name__} - ERROR: {str(e)}")
            tester.tests_run += 1
        print()  # Add spacing between tests

    # Print summary
    print("=" * 50)
    print(f"📊 BACKEND TESTING SUMMARY")
    print(f"Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests PASSED!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())