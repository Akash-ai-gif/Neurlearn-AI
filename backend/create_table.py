"""
Create the learner_journey table in Supabase using the management API.
"""
import os, sys, requests
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # anon key

# Use PostgREST's admin endpoint with service key, OR use Supabase SDK with raw query
# Since we only have anon key, we'll use the Supabase client with a workaround

from supabase import create_client
db = create_client(SUPABASE_URL, SUPABASE_KEY)

# Try to create via raw POST to the SQL endpoint
project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

SQL = """
CREATE TABLE IF NOT EXISTS learner_journey (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL,
    skill_id TEXT DEFAULT '',
    skill_name TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE learner_journey DISABLE ROW LEVEL SECURITY;
"""

# Try using Supabase management API
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

try:
    # Try the SQL endpoint directly
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec",
        headers=headers,
        json={"query": SQL}
    )
    print(f"RPC response: {resp.status_code} {resp.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*60)
print("MANUAL STEP REQUIRED:")
print("Go to: https://supabase.com/dashboard/project/efhcqihcpmajhpeimlse/sql/new")
print("Run this SQL:")
print("="*60)
print(SQL)
