"""
NeuroLearn — Authentication API (Real Supabase)
Handles signup, login, profile CRUD against the real database.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
import json

from app.core.database import get_supabase

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    language: str = "en"
    career_goal: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    career_goal: Optional[str] = None
    language: Optional[str] = None
    learning_dna: Optional[dict] = None
    accessibility: Optional[dict] = None


@router.post("/signup")
async def signup(req: SignupRequest):
    """Register a new user and create their profile in the DB."""
    db = get_supabase()

    # Generate a deterministic user_id from email (so we can look them up)
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, req.email.lower().strip()))
    print(f"[Auth] Signing up user: {req.name} ({req.email}) -> ID: {user_id}")

    # Check if user already exists
    existing = db.table("profiles").select("id").eq("id", user_id).execute()
    if existing.data and len(existing.data) > 0:
        # User already exists, just return their info
        profile = db.table("profiles").select("*").eq("id", user_id).execute()
        p = profile.data[0]
        return {
            "user_id": p["id"],
            "email": p.get("email", req.email),
            "name": p["name"],
            "career_goal": p.get("career_goal", ""),
            "message": "Welcome back! Account already exists.",
        }

    # Create new profile
    profile_data = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "language": req.language,
        "career_goal": req.career_goal,
        "learning_dna": json.dumps({
            "visual": 50, "auditory": 50, "kinesthetic": 50, "reading_writing": 50,
            "peak_hours": ["10:00", "11:00", "14:00"],
            "optimal_session_length": 30,
            "learning_speed": "moderate",
            "preferred_modality": "interactive"
        }),
        "accessibility": json.dumps({
            "dyslexia_mode": False,
            "high_contrast": False,
            "reduce_motion": False,
            "font_size": "normal"
        }),
    }

    try:
        result = db.table("profiles").insert(profile_data).execute()
        if result.data:
            return {
                "user_id": user_id,
                "email": req.email,
                "name": req.name,
                "career_goal": req.career_goal,
                "message": "Account created successfully",
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create profile")
    except Exception as e:
        # If insert fails (e.g. RLS), return a graceful fallback
        raise HTTPException(status_code=500, detail=f"Signup error: {str(e)}")


@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate user by email and return their profile."""
    db = get_supabase()
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, req.email))

    result = db.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="User not found. Please sign up first.")

    profile = result.data[0]
    return {
        "user_id": profile["id"],
        "name": profile["name"],
        "email": profile.get("email", req.email),
        "career_goal": profile.get("career_goal", ""),
        "token": f"session-{user_id[:8]}",
        "message": "Login successful",
    }


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get user profile from the database."""
    db = get_supabase()

    result = db.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")

    p = result.data[0]

    # Parse JSON fields safely
    learning_dna = p.get("learning_dna", {})
    if isinstance(learning_dna, str):
        learning_dna = json.loads(learning_dna)
    accessibility = p.get("accessibility", {})
    if isinstance(accessibility, str):
        accessibility = json.loads(accessibility)

    return {
        "id": p["id"],
        "name": p["name"],
        "email": p.get("email", ""),
        "language": p.get("language", "en"),
        "career_goal": p.get("career_goal", ""),
        "learning_dna": learning_dna,
        "accessibility": accessibility,
    }


@router.put("/profile/{user_id}")
async def update_profile(user_id: str, req: UpdateProfileRequest):
    """Update user profile in the database."""
    db = get_supabase()

    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.career_goal is not None:
        update_data["career_goal"] = req.career_goal
    if req.language is not None:
        update_data["language"] = req.language
    if req.learning_dna is not None:
        update_data["learning_dna"] = json.dumps(req.learning_dna)
    if req.accessibility is not None:
        update_data["accessibility"] = json.dumps(req.accessibility)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    if result.data:
        return {"message": "Profile updated", "updated_fields": list(update_data.keys())}
    else:
        raise HTTPException(status_code=404, detail="Profile not found")
