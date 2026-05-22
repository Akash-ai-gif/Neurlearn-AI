"""
NeuroLearn — Supabase Database Client
Provides a real connection to Supabase for all CRUD operations.
"""
import os
from supabase import create_client, Client
from app.core.config import settings

_client: Client | None = None

def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _client
    if _client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set in backend/.env"
            )
        _client = create_client(url, key)
    return _client
