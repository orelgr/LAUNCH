#!/usr/bin/env python3
# Database initialization script for GmarUp Landing Page

import sqlite3
import os
from datetime import datetime, timedelta
import json
import random

def init_database():
    db_path = os.path.join(os.path.dirname(__file__), 'leads.db')
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Creating database tables...")
        
        # Create registrations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                newsletter INTEGER DEFAULT 0,
                source TEXT DEFAULT "beta_landing",
                status TEXT DEFAULT "pending_beta",
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                attempt_count INTEGER DEFAULT 1,
                lead_score INTEGER DEFAULT 0,
                last_contacted TEXT
            )
        ''')
        
        # Create donations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donation_id TEXT UNIQUE NOT NULL,
                amount INTEGER NOT NULL,
                donor_name TEXT NOT NULL,
                donor_email TEXT,
                donor_phone TEXT,
                message TEXT,
                is_anonymous INTEGER DEFAULT 0,
                source TEXT DEFAULT "website",
                status TEXT DEFAULT "pending",
                payment_method TEXT DEFAULT "bit",
                transaction_id TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                ip_address TEXT,
                user_agent TEXT
            )
        ''')
        
        # Create analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                category TEXT NOT NULL,
                action TEXT NOT NULL,
                label TEXT,
                value INTEGER,
                url TEXT,
                user_agent TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create activity log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (lead_id) REFERENCES registrations(id)
            )
        ''')
        
        # Create donation activity table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donation_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donation_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (donation_id) REFERENCES donations(id)
            )
        ''')
        
        # Create communications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS communications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                audience TEXT NOT NULL,
                message TEXT NOT NULL,
                recipients_count INTEGER NOT NULL,
                sent_at TEXT NOT NULL,
                status TEXT DEFAULT "sent"
            )
        ''')
        
        # Create settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        
        print("Creating indexes...")
        
        # Create indexes for better performance
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email)',
            'CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status)',
            'CREATE INDEX IF NOT EXISTS idx_registrations_source ON registrations(source)',
            'CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status)',
            'CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics(category)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)'
        ]
        
        for index in indexes:
            cursor.execute(index)
        
        print("Inserting default settings...")
        
        # Insert default settings
        default_settings = [
            ('whatsapp_link', 'https://chat.whatsapp.com/LNmVCXvv35S9SsbWTol2qW'),
            ('bit_phone', '0502277660'),
            ('admin_email', 'gmarupil@gmail.com'),
            ('site_title', 'גמראפ - לימוד גמרא לכל אחד'),
            ('memorial_counter_start', '2500'),
            ('donations_counter_start', '120000'),
            ('auto_backup_enabled', '1'),
            ('email_notifications', '1'),
            ('analytics_enabled', '1')
        ]
        
        for key, value in default_settings:
            cursor.execute('''
                INSERT OR IGNORE INTO settings (key, value, updated_at)
                VALUES (?, ?, ?)
            ''', (key, value, datetime.now().isoformat()))
        
        print("Inserting sample data...")
        
        # Insert sample registrations
        sample_registrations = [
            ('דוד כהן', 'david@example.com', '050-1234567', 1, 'beta_landing', 'pending_beta'),
            ('משה לוי', 'moshe@example.com', '052-7654321', 1, 'beta_landing', 'pending_beta'),
            ('אברהם גולדברג', 'avraham@example.com', '054-9876543', 0, 'beta_landing', 'pending_beta'),
            ('יוסף שמעון', 'yosef@example.com', '053-1111111', 1, 'beta_landing', 'pending_beta'),
            ('שרה כהן', 'sarah@example.com', '055-2222222', 1, 'beta_landing', 'pending_beta')
        ]
        
        for i, (name, email, phone, newsletter, source, status) in enumerate(sample_registrations):
            created_at = (datetime.now() - timedelta(days=random.randint(1, 7))).isoformat()
            cursor.execute('''
                INSERT OR IGNORE INTO registrations 
                (name, email, phone, newsletter, source, status, created_at, updated_at, ip_address, lead_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (name, email, phone, newsletter, source, status, created_at, datetime.now().isoformat(), '127.0.0.1', random.randint(20, 95)))
        
        # Insert sample donations
        sample_donations = [
            ('DON_2024_000001', 180, 'יוסי ישראלי', 'yossi@example.com', '050-1111111', '', 0, 'website', 'completed'),
            ('DON_2024_000002', 100, 'שרה כהן', 'sarah@example.com', '052-2222222', 'לזכר אור', 0, 'website', 'completed'),
            ('DON_2024_000003', 365, 'רחל לוי', 'rachel@example.com', '054-3333333', 'תרומה חשובה', 0, 'website', 'completed'),
            ('DON_2024_000004', 50, 'אנונימי', '', '', '', 1, 'website', 'pending'),
            ('DON_2024_000005', 250, 'משה דוד', 'moshed@example.com', '055-4444444', 'לזכותו', 0, 'website', 'completed')
        ]
        
        for donation in sample_donations:
            created_at = (datetime.now() - timedelta(days=random.randint(1, 5))).isoformat()
            cursor.execute('''
                INSERT OR IGNORE INTO donations 
                (donation_id, amount, donor_name, donor_email, donor_phone, message, is_anonymous, source, status, created_at, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (*donation, created_at, '127.0.0.1'))
        
        # Insert sample analytics data
        sessions = ['sess_001', 'sess_002', 'sess_003', 'sess_004', 'sess_005']
        analytics_data = []
        
        for session in sessions:
            # Page view
            analytics_data.append((session, 'Page', 'page_view', 'index.html', None))
            
            # Random additional events
            if random.random() > 0.3:
                analytics_data.append((session, 'Scroll', 'depth', '50%', 50))
            
            if random.random() > 0.5:
                analytics_data.append((session, 'Form', 'form_view', 'registration', None))
            
            if random.random() > 0.7:
                analytics_data.append((session, 'Button_Click', 'registration', 'הצטרף עכשיו', None))
        
        for session_id, category, action, label, value in analytics_data:
            created_at = (datetime.now() - timedelta(days=random.randint(1, 3))).isoformat()
            cursor.execute('''
                INSERT INTO analytics (session_id, category, action, label, value, url, created_at, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (session_id, category, action, label, value, 'https://gmarapp.com/', created_at, '127.0.0.1'))
        
        # Create backups directory
        backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        # Commit all changes
        conn.commit()
        
        print("Database initialized successfully!")
        print(f"Database location: {db_path}")
        print("Sample data inserted for testing")
        print("\nYou can now access the admin panel at admin.html")
        print("Default admin password: 0544227754")
        
        # Display summary stats
        cursor.execute('SELECT COUNT(*) FROM registrations')
        reg_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM donations')
        don_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM analytics')
        analytics_count = cursor.fetchone()[0]
        
        print(f"\nDatabase Summary:")
        print(f"- Registrations: {reg_count}")
        print(f"- Donations: {don_count}")
        print(f"- Analytics events: {analytics_count}")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    init_database()