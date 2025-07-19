#!/usr/bin/env python3
import os
import subprocess
import sys

# Override the problematic DATABASE_URL
correct_db_url = "postgresql://postgres.jkvdwxwwafrscenjgkck:U6w$UE_X-F$B7hC@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
os.environ['DATABASE_URL'] = correct_db_url

# Test the connection first
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    conn = psycopg2.connect(correct_db_url, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    cursor.execute('SELECT 1')
    cursor.close()
    conn.close()
    print("✓ Database connection verified")
    
    # Start the FastAPI service
    print("Starting Python Database Service...")
    os.chdir('python-db-service')
    subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])
    
except Exception as e:
    print(f"✗ Failed to start service: {e}")
    sys.exit(1)