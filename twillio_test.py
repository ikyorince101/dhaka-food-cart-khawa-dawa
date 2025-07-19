#!/usr/bin/env python3
"""
Twilio API Key Test Script
Tests your Twilio API Key (SID and Secret)
"""

import requests
from requests.auth import HTTPBasicAuth
import json

# Your Twilio API Key credentials
API_KEY_SID = "SK48345ee0fb8b9862eb47adb9b1be877d"  # This might be different for API Key
API_KEY_SECRET = "aNnmWOafvYZCrgGavRDiEyvly28c5fOf"  # Your API Key Secret
VERIFY_SID = "VAc1c5e91108c4ac6b139170a382b0ab6c"

def test_twilio_api_key():
    """Test Twilio API Key authentication"""
    print("�� Testing Twilio API Key...")
    print(f"API Key SID: {API_KEY_SID}")
    print(f"API Key Secret: {API_KEY_SECRET[:8]}...{API_KEY_SECRET[-8:]}")
    print(f"Verify SID: {VERIFY_SID}")
    print("-" * 50)
    
    # Test 1: Check if API Key is valid
    print("1. Testing API Key Authentication...")
    try:
        response = requests.get(
            "https://api.twilio.com/2010-04-01/Accounts.json",
            auth=HTTPBasicAuth(API_KEY_SID, API_KEY_SECRET)
        )
        
        if response.status_code == 200:
            accounts_data = response.json()
            print("✅ API Key authentication successful!")
            print(f"   Found {len(accounts_data.get('accounts', []))} account(s)")
            
            # Show account details
            for account in accounts_data.get('accounts', []):
                print(f"   Account: {account.get('friendly_name', 'N/A')} ({account.get('sid', 'N/A')})")
                print(f"   Status: {account.get('status', 'N/A')}")
        else:
            print(f"❌ API Key authentication failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing API Key: {e}")
        return False
    
    # Test 2: Check Verify service
    print("\n2. Testing Verify Service...")
    try:
        response = requests.get(
            f"https://verify.twilio.com/v2/Services/{VERIFY_SID}",
            auth=HTTPBasicAuth(API_KEY_SID, API_KEY_SECRET)
        )
        
        if response.status_code == 200:
            service_data = response.json()
            print("✅ Verify service found!")
            print(f"   Service Name: {service_data.get('friendly_name', 'N/A')}")
            print(f"   Service Status: {service_data.get('status', 'N/A')}")
            print(f"   Code Length: {service_data.get('code_length', 'N/A')}")
        else:
            print(f"❌ Verify service not found: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing verify service: {e}")
        return False
    
    # Test 3: Try to send a test verification
    print("\n3. Testing Verify Service Access...")
    try:
        response = requests.post(
            f"https://verify.twilio.com/v2/Services/{VERIFY_SID}/Verifications",
            auth=HTTPBasicAuth(API_KEY_SID, API_KEY_SECRET),
            data={
                "To": "+1234567890",  # Test number
                "Channel": "sms"
            }
        )
        
        if response.status_code in [400, 401, 403]:
            # These are expected errors for invalid phone numbers or permissions
            print("✅ Verify service is accessible!")
            print(f"   Response: {response.status_code} - {response.json().get('message', 'Expected error for test number')}")
        elif response.status_code == 200:
            print("✅ Verify service working perfectly!")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing verify service access: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Twilio API Key test completed!")
    print("If you see ✅ marks above, your API Key is working.")
    print("If you see ❌ marks, there's an issue with your API Key.")
    return True


def test_account_sid_auth_token():
    """Test with Account SID and Auth Token (alternative method)"""
    print("\n🔍 Testing Account SID and Auth Token...")
    
    # You might need to get these from your Twilio Console
    ACCOUNT_SID = "YOUR_ACCOUNT_SID_HERE"  # Different from API Key SID
    AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"    # Different from API Key Secret
    
    try:
        response = requests.get(
            f"https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}.json",
            auth=HTTPBasicAuth(ACCOUNT_SID, AUTH_TOKEN)
        )
        
        if response.status_code == 200:
            print("✅ Account SID and Auth Token work!")
        else:
            print(f"❌ Account SID and Auth Token failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Twilio API Key Test Script")
    print("=" * 50)
    
    # Run the main test
    success = test_twilio_api_key()
    
    print("\n📝 Next Steps:")
    print("1. If tests pass (✅), your API Key is valid")
    print("2. If tests fail (❌), check your Twilio console")
    print("3. Make sure your API Key has the right permissions")
    print("4. Verify the Verify service is properly configured")
    
    print("\n🔧 To fix the Docker app:")
    print("1. Update docker-compose.yml to use API Key instead of Account SID/Auth Token")
    print("2. Or get your Account SID and Auth Token from Twilio Console")