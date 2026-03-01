import sqlite3

conn = sqlite3.connect('database/leads.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM registrations')
print('Total registrations:', cursor.fetchone()[0])

cursor.execute('SELECT name, email, created_at FROM registrations ORDER BY created_at DESC LIMIT 3')
print('Latest registrations:')
for row in cursor.fetchall():
    print(f'  {row[0]} - {row[1]} - {row[2]}')

conn.close()