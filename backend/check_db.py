import os
from dotenv import load_dotenv
from supabase import create_client, Client

def check_tables():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY") # Use anon key from .env
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
        return

    supabase: Client = create_client(url, key)
    
    tables = [
        "profiles", 
        "learning_paths", 
        "user_skills", 
        "credentials", 
        "doubts", 
        "assessments",
        "career_recommendations"
    ]
    
    print("--- Database Health Check ---")
    for table in tables:
        try:
            # Try to fetch 0 rows to check existence
            res = supabase.table(table).select("count", count="exact").limit(0).execute()
            print(f"OK: Table '{table}' exists.")
        except Exception as e:
            print(f"FAIL: Table '{table}' NOT FOUND or error: {str(e)}")

if __name__ == "__main__":
    check_tables()
