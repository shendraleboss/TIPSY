import requests
import sys
import json
from datetime import datetime

class TipsyAPITester:
    def __init__(self, base_url="https://tipsy-pay.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_phone = f"+33612345{datetime.now().strftime('%H%M')}"
        self.server_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_send_otp(self):
        """Test sending OTP (mock)"""
        success, response = self.run_test(
            "Send OTP",
            "POST",
            "auth/send-otp",
            200,
            data={"phone": self.test_phone}
        )
        return success

    def test_verify_otp_new_user(self):
        """Test OTP verification for new user"""
        success, response = self.run_test(
            "Verify OTP (New User)",
            "POST",
            "auth/verify-otp",
            200,
            data={"phone": self.test_phone, "otp": "123456"}
        )
        if success and response.get('is_new_user'):
            print("✅ Correctly identified as new user")
            return True
        return False

    def test_verify_otp_invalid(self):
        """Test OTP verification with invalid code"""
        success, response = self.run_test(
            "Verify OTP (Invalid)",
            "POST",
            "auth/verify-otp",
            400,
            data={"phone": self.test_phone, "otp": "000000"}
        )
        return success

    def test_create_server_profile(self):
        """Test creating server profile"""
        success, response = self.run_test(
            "Create Server Profile",
            "POST",
            "servers/profile",
            200,
            data={
                "phone": self.test_phone,
                "first_name": "TestServer",
                "photo_url": "https://example.com/photo.jpg"
            }
        )
        if success:
            self.server_data = response
            print(f"✅ Server created with ID: {response.get('id')}")
        return success

    def test_get_server_by_phone(self):
        """Test getting server by phone"""
        if not self.server_data:
            print("❌ No server data available")
            return False
        
        success, response = self.run_test(
            "Get Server by Phone",
            "GET",
            f"servers/by-phone/{self.test_phone}",
            200
        )
        return success

    def test_get_server_by_id(self):
        """Test getting server by ID"""
        if not self.server_data:
            print("❌ No server data available")
            return False
        
        server_id = self.server_data.get('id')
        success, response = self.run_test(
            "Get Server by ID",
            "GET",
            f"servers/{server_id}",
            200
        )
        return success

    def test_get_server_stats(self):
        """Test getting server stats"""
        if not self.server_data:
            print("❌ No server data available")
            return False
        
        server_id = self.server_data.get('id')
        success, response = self.run_test(
            "Get Server Stats",
            "GET",
            f"servers/{server_id}/stats",
            200
        )
        if success:
            stats = response
            print(f"✅ Stats: {stats.get('total_tips', 0)}€, {stats.get('tip_count', 0)} tips")
        return success

    def test_get_server_tips(self):
        """Test getting server tips"""
        if not self.server_data:
            print("❌ No server data available")
            return False
        
        server_id = self.server_data.get('id')
        success, response = self.run_test(
            "Get Server Tips",
            "GET",
            f"servers/{server_id}/tips",
            200
        )
        return success

    def test_create_tip_checkout(self):
        """Test creating tip checkout session"""
        if not self.server_data:
            print("❌ No server data available")
            return False
        
        server_id = self.server_data.get('id')
        success, response = self.run_test(
            "Create Tip Checkout",
            "POST",
            "tips/create-checkout",
            200,
            data={
                "server_id": server_id,
                "amount": 10.0,
                "host_url": self.base_url
            }
        )
        if success:
            print(f"✅ Checkout URL: {response.get('url', 'N/A')[:50]}...")
            print(f"✅ Breakdown: {response.get('breakdown', {})}")
        return success

    def test_verify_otp_existing_user(self):
        """Test OTP verification for existing user"""
        success, response = self.run_test(
            "Verify OTP (Existing User)",
            "POST",
            "auth/verify-otp",
            200,
            data={"phone": self.test_phone, "otp": "123456"}
        )
        if success and not response.get('is_new_user'):
            print("✅ Correctly identified as existing user")
            return True
        return False

def main():
    print("🚀 Starting Tipsy API Tests")
    print("=" * 50)
    
    tester = TipsyAPITester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_root_endpoint),
        ("Send OTP", tester.test_send_otp),
        ("Verify OTP (Invalid)", tester.test_verify_otp_invalid),
        ("Verify OTP (New User)", tester.test_verify_otp_new_user),
        ("Create Server Profile", tester.test_create_server_profile),
        ("Get Server by Phone", tester.test_get_server_by_phone),
        ("Get Server by ID", tester.test_get_server_by_id),
        ("Get Server Stats", tester.test_get_server_stats),
        ("Get Server Tips", tester.test_get_server_tips),
        ("Create Tip Checkout", tester.test_create_tip_checkout),
        ("Verify OTP (Existing User)", tester.test_verify_otp_existing_user),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())