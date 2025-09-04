#!/usr/bin/env python3
"""
GmarUp Robust Server - גרסה מחזקת שתתמודד טוב יותר עם בעיות מסד נתונים
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
import traceback
from datetime import datetime
import uuid
import webbrowser
from threading import Timer
import json
import logging

app = Flask(__name__, static_folder='.', static_url_path='')

# הגדרות
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'leads.db')
PORT = 8080

# הגדרת לוגים
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# פונקציות עזר למסד נתונים
def create_connection():
    """יוצר חיבור בטוח למסד נתונים"""
    try:
        if not os.path.exists(os.path.dirname(DB_PATH)):
            os.makedirs(os.path.dirname(DB_PATH))
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"שגיאה ביצירת חיבור למסד נתונים: {e}")
        raise

def init_database():
    """אתחול מסד הנתונים עם כל הטבלאות הנדרשות"""
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        # יצירת טבלת רישומים
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                source TEXT DEFAULT 'website',
                status TEXT DEFAULT 'new',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                lead_score INTEGER DEFAULT 75,
                notes TEXT,
                last_contacted TEXT,
                attempt_count INTEGER DEFAULT 1
            )
        ''')
        
        # יצירת טבלת תרומות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donation_id TEXT UNIQUE NOT NULL,
                amount REAL NOT NULL,
                donor_name TEXT NOT NULL,
                donor_email TEXT,
                donor_phone TEXT,
                message TEXT,
                source TEXT DEFAULT 'website',
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                completed_at TEXT,
                ip_address TEXT,
                user_agent TEXT,
                is_anonymous INTEGER DEFAULT 0
            )
        ''')
        
        # יצירת טבלת אנליטיקס
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                category TEXT NOT NULL,
                action TEXT NOT NULL,
                label TEXT,
                value INTEGER,
                url TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            )
        ''')
        
        # יצירת טבלת הגדרות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        
        # יצירת טבלת לוגים לרישומים
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (lead_id) REFERENCES registrations (id)
            )
        ''')
        
        # יצירת טבלת לוגים לתרומות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donation_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donation_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (donation_id) REFERENCES donations (id)
            )
        ''')
        
        
        # הכנסת הגדרות ברירת מחדל
        default_settings = [
            ('whatsapp_link', 'https://chat.whatsapp.com/LNmVCXvv35S9SsbWTol2qW'),
            ('bit_phone', '0502277660'),
            ('admin_email', 'gmarupil@gmail.com'),
            ('site_title', 'גמראפ - לימוד גמרא לכל אחד'),
            ('memorial_counter_start', '2500'),
            ('admin_password', '0544227754')
        ]
        
        for key, value in default_settings:
            cursor.execute('''
                INSERT OR IGNORE INTO settings (key, value, updated_at)
                VALUES (?, ?, ?)
            ''', (key, value, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        logger.info("✅ מסד הנתונים אותחל בהצלחה")
        
    except Exception as e:
        logger.error(f"❌ שגיאה באתחול מסד הנתונים: {e}")
        logger.error(traceback.format_exc())

# CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    return response

# Handle OPTIONS requests
@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/', methods=['OPTIONS'])
def handle_options(path=''):
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    return response

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# API לרישום
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # וידוא שהנתונים הגיעו
        if not data:
            return jsonify({'success': False, 'error': 'לא התקבלו נתונים'}), 400
        
        # בדיקת שדות חובה
        required_fields = ['fullName', 'email', 'phone', 'emailConsent']
        for field in required_fields:
            if field == 'emailConsent':
                if not data.get(field):
                    return jsonify({'success': False, 'error': 'חובה לאשר קבלת עדכונים באימייל'}), 400
            elif not data.get(field):
                return jsonify({'success': False, 'error': f'שדה חובה חסר: {field}'}), 400
        
        conn = create_connection()
        cursor = conn.cursor()
        
        # הכנסת הרישום
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO registrations 
            (name, email, phone, newsletter, source, created_at, updated_at, ip_address, user_agent, lead_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('fullName', ''),
            data.get('email', ''),
            data.get('phone', ''),
            1 if data.get('emailConsent', False) else 0,  # Convert boolean to integer
            data.get('source', 'website'),
            now,
            now,
            request.remote_addr,
            request.headers.get('User-Agent', ''),
            75,  # ציון ליד ברירת מחדל
            f"רמת לימוד: {data.get('studyLevel', 'לא צוין')}, אישור דיוור: {'כן' if data.get('emailConsent', False) else 'לא'}"
        ))
        
        # לוג פעילות
        reg_id = cursor.lastrowid
        cursor.execute('''
            INSERT INTO activity_log (lead_id, action, details, created_at)
            VALUES (?, ?, ?, ?)
        ''', (reg_id, 'registration', 'רישום חדש דרך האתר', now))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ רישום חדש נשמר בהצלחה: {data.get('fullName')} - {data.get('email')}")
        
        return jsonify({
            'success': True, 
            'message': 'ברוך הבא למשפחת גמראפ! ההרשמה התקבלה בהצלחה',
            'registration_id': reg_id
        })
        
    except Exception as e:
        logger.error(f"❌ שגיאה ברישום: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה בשמירת הרישום. אנא נסה שוב'}), 500

# API לתרומה
@app.route('/api/donate', methods=['POST'])
def donate():
    try:
        data = request.get_json()
        
        if not data or not data.get('amount'):
            return jsonify({'success': False, 'error': 'חסר סכום תרומה'}), 400
        
        conn = create_connection()
        cursor = conn.cursor()
        
        # יצירת מזהה תרומה ייחודי
        donation_id = f"DON_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO donations 
            (donation_id, amount, donor_name, donor_email, donor_phone, message, source, status, created_at, ip_address, user_agent, is_anonymous)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            donation_id,
            data.get('amount', 0),
            data.get('donor_name', 'תורם אנונימי'),
            data.get('donor_email', ''),
            data.get('donor_phone', ''),
            data.get('message', ''),
            data.get('source', 'website'),
            'pending',
            now,
            request.remote_addr,
            request.headers.get('User-Agent', ''),
            data.get('is_anonymous', 0)
        ))
        
        # לוג פעילות תרומה
        don_db_id = cursor.lastrowid
        cursor.execute('''
            INSERT INTO donation_activity (donation_id, action, details, created_at)
            VALUES (?, ?, ?, ?)
        ''', (don_db_id, 'created', f'תרומה חדשה של ₪{data.get("amount", 0)}', now))
        
        conn.commit()
        conn.close()
        
        # קבלת מספר BIT מההגדרות
        try:
            conn = create_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('bit_phone',))
            result = cursor.fetchone()
            bit_phone = result[0] if result else '0502277660'
            conn.close()
        except:
            bit_phone = '0502277660'
        
        # יצירת קישור תשלום BIT
        amount = data.get('amount', 0)
        description = f'תרומה לזכר אור מנצור - {donation_id}'
        payment_url = f'https://www.bitpay.co.il/app/me/14D6AE95-19DD-340D-BE3D-1EB146D9A0B420D2?amount={amount}'
        
        logger.info(f"✅ תרומה חדשה נוצרה: {donation_id} - ₪{amount}")
        
        return jsonify({
            'success': True,
            'donation_id': donation_id,
            'payment_url': payment_url,
            'message': 'תרומה נוצרה בהצלחה - סטטוס: ממתין לאישור תשלום'
        })
        
    except Exception as e:
        logger.error(f"❌ שגיאה ביצירת תרומה: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה ביצירת התרומה. אנא נסה שוב'}), 500

# Admin API - רישומים
@app.route('/api/admin/registrations', methods=['GET'])
def get_registrations():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, email, phone, source, status, created_at, updated_at, 
                   lead_score, notes, last_contacted, attempt_count
            FROM registrations 
            ORDER BY created_at DESC
        ''')
        
        registrations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        logger.info(f"📊 נשלחו {len(registrations)} רישומים לדשבורד האדמין")
        return jsonify(registrations)
        
    except Exception as e:
        logger.error(f"❌ שגיאה בקבלת רישומים: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'שגיאה בטעינת הרישומים'}), 500

# Admin API - תרומות
@app.route('/api/admin/donations', methods=['GET'])
def get_donations():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, donation_id, amount, donor_name, donor_email, donor_phone, 
                   message, status, created_at, completed_at, source, is_anonymous
            FROM donations 
            ORDER BY created_at DESC
        ''')
        
        donations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        logger.info(f"💰 נשלחו {len(donations)} תרומות לדשבורד האדמין")
        return jsonify(donations)
        
    except Exception as e:
        logger.error(f"❌ שגיאה בקבלת תרומות: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'שגיאה בטעינת התרומות'}), 500

# Admin API - אנליטיקס
@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, session_id, category, action, label, value, 
                   url, ip_address, created_at
            FROM analytics 
            ORDER BY created_at DESC
            LIMIT 200
        ''')
        
        analytics = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        logger.info(f"📈 נשלחו {len(analytics)} אירועי אנליטיקס לדשבורד")
        return jsonify(analytics)
        
    except Exception as e:
        logger.error(f"❌ שגיאה בקבלת אנליטיקס: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'שגיאה בטעינת האנליטיקס'}), 500

# Admin API - הגדרות
@app.route('/api/admin/settings', methods=['GET'])
def get_admin_settings():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT key, value FROM settings')
        rows = cursor.fetchall()
        
        settings = {row['key']: row['value'] for row in rows}
        conn.close()
        
        return jsonify(settings)
        
    except Exception as e:
        logger.error(f"❌ שגיאה בקבלת הגדרות אדמין: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'שגיאה בטעינת ההגדרות'}), 500

# Public API - הגדרות ציבוריות
@app.route('/api/settings', methods=['GET'])
def get_public_settings():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        
        # הגדרות שמותר לגשת אליהן בלי אותנטיקציה
        public_keys = ['whatsapp_link', 'bit_phone', 'admin_email', 'site_title', 'memorial_counter_start']
        placeholders = ','.join(['?' for _ in public_keys])
        
        cursor.execute(f'SELECT key, value FROM settings WHERE key IN ({placeholders})', public_keys)
        rows = cursor.fetchall()
        
        settings = {row['key']: row['value'] for row in rows}
        conn.close()
        
        # ברירות מחדל
        defaults = {
            'whatsapp_link': 'https://chat.whatsapp.com/LNmVCXvv35S9SsbWTol2qW',
            'bit_phone': '0502277660',
            'admin_email': 'gmarupil@gmail.com',
            'site_title': 'גמראפ - לימוד גמרא לכל אחד',
            'memorial_counter_start': '2500'
        }
        
        for key, default_value in defaults.items():
            if key not in settings:
                settings[key] = default_value
        
        return jsonify(settings)
        
    except Exception as e:
        logger.error(f"❌ שגיאה בקבלת הגדרות ציבוריות: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'שגיאה בטעינת ההגדרות'}), 500

# Admin API - עדכון הגדרות
@app.route('/api/admin/settings', methods=['POST'])
def update_settings():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'לא התקבלו נתונים'}), 400
        
        conn = create_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        for key, value in data.items():
            cursor.execute('''
                INSERT OR REPLACE INTO settings (key, value, updated_at)
                VALUES (?, ?, ?)
            ''', (key, value, now))
        
        conn.commit()
        conn.close()
        
        logger.info(f"⚙️ הגדרות עודכנו: {list(data.keys())}")
        return jsonify({'success': True, 'message': 'הגדרות עודכנו בהצלחה'})
        
    except Exception as e:
        logger.error(f"❌ שגיאה בעדכון הגדרות: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה בעדכון ההגדרות'}), 500

# API לעדכון/מחיקת רישום
@app.route('/api/admin/registration', methods=['POST'])
def update_registration():
    try:
        data = request.get_json()
        
        reg_id = data.get('id')
        action = data.get('action', 'update')
        
        if not reg_id:
            return jsonify({'success': False, 'error': 'חסר מזהה רישום'}), 400
        
        conn = create_connection()
        cursor = conn.cursor()
        
        if action == 'delete':
            # מחיקת לוגים קשורים
            cursor.execute('DELETE FROM activity_log WHERE lead_id = ?', (reg_id,))
            
            # מחיקת הרישום
            cursor.execute('DELETE FROM registrations WHERE id = ?', (reg_id,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"🗑️ רישום נמחק: ID {reg_id}")
            return jsonify({'success': True, 'message': 'רישום נמחק בהצלחה'})
        
        else:
            # עדכון רישום
            now = datetime.now().isoformat()
            cursor.execute('''
                UPDATE registrations 
                SET status = ?, notes = ?, updated_at = ?, last_contacted = ?
                WHERE id = ?
            ''', (
                data.get('status'),
                data.get('notes', ''),
                now,
                now if data.get('status') == 'contacted' else None,
                reg_id
            ))
            
            # לוג פעילות
            cursor.execute('''
                INSERT INTO activity_log (lead_id, action, details, created_at)
                VALUES (?, ?, ?, ?)
            ''', (reg_id, 'status_update', f'סטטוס עודכן ל-{data.get("status")}', now))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✏️ רישום עודכן: ID {reg_id}")
            return jsonify({'success': True, 'message': 'רישום עודכן בהצלחה'})
        
    except Exception as e:
        logger.error(f"❌ שגיאה בעדכון רישום: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה בעדכון הרישום'}), 500

# API לעדכון/מחיקת תרומה
@app.route('/api/admin/donation', methods=['POST'])
def update_donation():
    try:
        data = request.get_json()
        
        don_id = data.get('id')
        action = data.get('action', 'update')
        
        if not don_id:
            return jsonify({'success': False, 'error': 'חסר מזהה תרומה'}), 400
        
        conn = create_connection()
        cursor = conn.cursor()
        
        if action == 'delete':
            # מחיקת לוגים קשורים
            cursor.execute('DELETE FROM donation_activity WHERE donation_id = ?', (don_id,))
            
            # מחיקת התרומה
            cursor.execute('DELETE FROM donations WHERE id = ?', (don_id,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"🗑️ תרומה נמחקה: ID {don_id}")
            return jsonify({'success': True, 'message': 'תרומה נמחקה בהצלחה'})
        
        else:
            # עדכון תרומה
            now = datetime.now().isoformat()
            cursor.execute('''
                UPDATE donations 
                SET status = ?, completed_at = ?
                WHERE id = ?
            ''', (
                data.get('status'),
                now if data.get('status') == 'completed' else None,
                don_id
            ))
            
            # לוג פעילות
            cursor.execute('''
                INSERT INTO donation_activity (donation_id, action, details, created_at)
                VALUES (?, ?, ?, ?)
            ''', (don_id, 'status_update', f'סטטוס עודכן ל-{data.get("status")}', now))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✏️ תרומה עודכנה: ID {don_id}")
            return jsonify({'success': True, 'message': 'תרומה עודכנה בהצלחה'})
        
    except Exception as e:
        logger.error(f"❌ שגיאה בעדכון תרומה: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה בעדכון התרומה'}), 500





# פונקציית בדיקה לחיבור
@app.route('/api/test', methods=['GET'])
def test_connection():
    try:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM registrations')
        reg_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM donations')
        don_count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'חיבור תקין למסד הנתונים',
            'stats': {
                'registrations': reg_count,
                'donations': don_count,
                'server_time': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ בדיקת חיבור נכשלה: {e}")
        return jsonify({
            'success': False,
            'error': 'בעיה בחיבור למסד הנתונים',
            'details': str(e)
        }), 500

# API למעקב ביקורים דרך analytics
@app.route('/api/admin/actions', methods=['POST'])
def admin_actions():
    try:
        # Check if it's form data or JSON
        if request.content_type == 'application/x-www-form-urlencoded':
            data = request.form
        else:
            data = request.get_json() or {}
        
        action = data.get('action', '')
        
        if action == 'track_analytics':
            # Track analytics event
            conn = create_connection()
            cursor = conn.cursor()
            
            now = datetime.now().isoformat()
            cursor.execute('''
                INSERT INTO analytics 
                (session_id, category, action, label, value, url, ip_address, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('sessionId', ''),
                data.get('category', 'Page'),
                data.get('eventAction', data.get('action', 'visit')),
                data.get('label', ''),
                data.get('value', 1),
                data.get('url', '/'),
                request.remote_addr,
                now
            ))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Analytics tracked'})
        
        else:
            return jsonify({'success': False, 'error': 'פעולה לא מוכרת'}), 400
            
    except Exception as e:
        logger.error(f"❌ שגיאה בפעולות אדמין: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'שגיאה בביצוע הפעולה'}), 500

def main():
    print("Starting GmarUp Robust Server...")
    
    # אתחול מסד הנתונים
    try:
        init_database()
    except Exception as e:
        print(f"Database init error: {e}")
        return
    
    print(f"Server running: http://localhost:{PORT}")
    print(f"Admin dashboard: http://localhost:{PORT}/admin.html")
    print("Admin password: 0544227754")
    print("Stop server: Ctrl+C")
    print(f"Test connection: http://localhost:{PORT}/api/test")
    print("-" * 50)
    
    # פתיחת דפדפן
    Timer(1.0, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    
    # הפעלת שרת Flask
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except Exception as e:
        print(f"❌ שגיאה בהפעלת השרת: {e}")

if __name__ == '__main__':
    main()