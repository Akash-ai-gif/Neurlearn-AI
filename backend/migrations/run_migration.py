"""Run DB migrations against Supabase."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS learner_journey (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL,
    skill_id TEXT,
    skill_name TEXT,
    score INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

def run():
    client = create_client(url, key)
    try:
        # Use rpc to run raw SQL — works with Supabase
        client.rpc("exec_sql", {"sql": MIGRATION_SQL}).execute()
        print("✅ Migration successful")
    except Exception as e:
        print(f"Migration via RPC failed (expected if RPC not enabled): {e}")
        print("Please run the following SQL in Supabase Dashboard → SQL Editor:")
        print(MIGRATION_SQL)

if __name__ == "__main__":
    run()
