import requests
import json

SERVER_URL = 'http://localhost:8080'

try:
    print("=== בדיקת GmarUp Server API ===")
    print(f"שרת: {SERVER_URL}")
    print()
    
    # Test donations API
    print("🔍 בדיקת API תרומות...")
    try:
        response = requests.get(f'{SERVER_URL}/api/admin/donations')
        print(f"✅ סטטוס: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 מספר תרומות: {len(data)}")
        else:
            print(f"❌ שגיאה: {response.text}")
    except Exception as e:
        print(f"❌ שגיאת חיבור: {e}")
    
    # Test registrations API
    print("\n🔍 בדיקת API רישומים...")
    try:
        response = requests.get(f'{SERVER_URL}/api/admin/registrations')
        print(f"✅ סטטוס: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 מספר רישומים: {len(data)}")
        else:
            print(f"❌ שגיאה: {response.text}")
    except Exception as e:
        print(f"❌ שגיאת חיבור: {e}")
        
    # Test donation creation
    print("\n🔍 בדיקת יצירת תרומה...")
    donation_data = {
        "amount": 100,
        "donor_name": "בדיקה API",
        "donor_email": "test@test.com",
        "source": "api_test"
    }
    
    try:
        response = requests.post(f'{SERVER_URL}/api/donate', 
                               json=donation_data,
                               headers={'Content-Type': 'application/json'})
        print(f"✅ סטטוס: {response.status_code}")
        print(f"📨 תגובה: {response.text}")
    except Exception as e:
        print(f"❌ שגיאה: {e}")
        
    print("\n✅ בדיקת API הושלמה!")
        
except Exception as e:
    print(f"❌ שגיאה כללית: {e}")