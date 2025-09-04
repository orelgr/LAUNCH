#!/usr/bin/env python3

import subprocess
import sys
import os

def main():
    print("GmarUp Server Launcher")
    print("🚀 Starting Flask server...")
    
    # החלף לתיקיית הפרויקט
    os.chdir(os.path.dirname(__file__))
    
    try:
        # הפעל את השרת החדש
        subprocess.run([sys.executable, 'server.py'])
    except KeyboardInterrupt:
        print("\n✅ Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")
        print("💡 Try running: python server.py")

if __name__ == '__main__':
    main()