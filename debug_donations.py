import sqlite3
import sys

# Set UTF-8 encoding for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    conn = sqlite3.connect('database/leads.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("=== בדיקת טבלת התרומות ===")
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='donations'")
    table_exists = cursor.fetchone()
    print(f"טבלת תרומות קיימת: {table_exists is not None}")
    
    if table_exists:
        # Get column info
        cursor.execute("PRAGMA table_info(donations)")
        columns = cursor.fetchall()
        print(f"עמודות בטבלה: {len(columns)}")
        for col in columns:
            print(f"  {col[1]} - {col[2]}")
        
        # Count records
        cursor.execute('SELECT COUNT(*) FROM donations')
        count = cursor.fetchone()[0]
        print(f"\nמספר תרומות בטבלה: {count}")
        
        # Get recent records
        cursor.execute('''
            SELECT id, donation_id, amount, donor_name, status, created_at
            FROM donations 
            ORDER BY created_at DESC 
            LIMIT 5
        ''')
        
        donations = cursor.fetchall()
        print(f"\n5 התרומות האחרונות:")
        for don in donations:
            print(f"  ID: {don[0]}, DonationID: {don[1]}, Amount: {don[2]}, Name: {don[3]}, Status: {don[4]}")
    
    conn.close()
    
except Exception as e:
    print(f"שגיאה: {e}")
    import traceback
    traceback.print_exc()