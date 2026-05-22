"""
NeuroLearn — Progress Tracking API
Tracks lesson views, completions, and builds the Learner Journey.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime, timezone

from app.core.database import get_supabase

router = APIRouter()


class LessonStartRequest(BaseModel):
    user_id: str
    skill_id: str
    skill_name: str


class LessonCompleteRequest(BaseModel):
    user_id: str
    skill_id: str
    skill_name: str
    score: Optional[int] = 80
    time_spent_minutes: Optional[int] = 10


class SkillUnlockRequest(BaseModel):
    user_id: str
    completed_skill_id: str
    path_id: Optional[str] = None


@router.post("/lesson/start")
async def start_lesson(req: LessonStartRequest):
    """Record when a user starts a lesson. Non-fatal if table missing."""
    db = get_supabase()
    try:
        db.table("learner_journey").insert({
            "user_id": req.user_id,
            "event_type": "lesson_started",
            "skill_id": req.skill_id,
            "skill_name": req.skill_name,
            "metadata": json.dumps({"ts": datetime.now(timezone.utc).isoformat()}),
        }).execute()
    except Exception as e:
        print(f"[Progress] start_lesson DB error (non-fatal): {e}")
    return {"status": "ok"}


@router.post("/lesson/complete")
async def complete_lesson(req: LessonCompleteRequest):
    """Mark a lesson as complete and unlock the next skill."""
    db = get_supabase()

    # 1. Record event (non-fatal)
    try:
        db.table("learner_journey").insert({
            "user_id": req.user_id,
            "event_type": "lesson_completed",
            "skill_id": req.skill_id,
            "skill_name": req.skill_name,
            "score": req.score,
            "time_spent_minutes": req.time_spent_minutes,
        }).execute()
    except Exception as e:
        print(f"[Progress] journey insert error (non-fatal): {e}")

    # 2. Update learning path — mark completed and unlock next
    try:
        path_result = db.table("learning_paths").select("*").eq("user_id", req.user_id).order("created_at", desc=True).limit(1).execute()
        if path_result.data:
            path = path_result.data[0]
            nodes = path.get("nodes", [])
            if isinstance(nodes, str):
                nodes = json.loads(nodes)

            unlock_next = False
            for i, node in enumerate(nodes):
                if node["id"] == req.skill_id:
                    node["status"] = "completed"
                    node["score"] = req.score
                    unlock_next = True
                elif unlock_next and node["status"] == "locked":
                    node["status"] = "available"
                    unlock_next = False

            completed_count = sum(1 for n in nodes if n["status"] == "completed")
            completion_pct = int((completed_count / len(nodes)) * 100) if nodes else 0

            db.table("learning_paths").update({
                "nodes": json.dumps(nodes),
                "completion_percent": completion_pct,
            }).eq("id", path["id"]).execute()

            return {
                "status": "completed",
                "nodes": nodes,
                "completion_percent": completion_pct,
                "message": f"🎉 '{req.skill_name}' completed! Next skill unlocked.",
            }
    except Exception as e:
        print(f"[Progress] path update error: {e}")

    return {"status": "completed", "message": f"'{req.skill_name}' marked complete!"}


@router.get("/journey/{user_id}")
async def get_learner_journey(user_id: str):
    """Get learner journey history. Returns empty gracefully if table missing."""
    db = get_supabase()

    events = []
    try:
        result = db.table("learner_journey").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
        events = result.data or []
    except Exception as e:
        print(f"[Progress] journey fetch error (table may not exist yet): {e}")
        # Table doesn't exist — return empty, app shows empty state

    stats = {"completion_percent": 0, "skills_completed": 0, "total_skills": 0, "career_goal": ""}
    try:
        path_result = db.table("learning_paths").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        if path_result.data:
            p = path_result.data[0]
            nodes = p.get("nodes", [])
            if isinstance(nodes, str):
                nodes = json.loads(nodes)
            stats = {
                "completion_percent": p.get("completion_percent", 0),
                "skills_completed": sum(1 for n in nodes if n["status"] == "completed"),
                "total_skills": len(nodes),
                "career_goal": p.get("career_goal", ""),
            }
    except Exception as e:
        print(f"[Progress] stats error: {e}")

    return {"events": events, "stats": stats}


@router.get("/streak/{user_id}")
async def get_streak(user_id: str):
    """Streak calculation. Safe if table missing."""
    db = get_supabase()
    try:
        result = db.table("learner_journey").select("created_at").eq("user_id", user_id).eq("event_type", "lesson_completed").order("created_at", desc=True).limit(30).execute()
        if not result.data:
            return {"streak": 0, "total_completed": 0}
        dates = {e["created_at"][:10] for e in result.data}
        streak = 0
        from datetime import timedelta
        check = datetime.now(timezone.utc)
        while check.strftime("%Y-%m-%d") in dates:
            streak += 1
            check -= timedelta(days=1)
        return {"streak": streak, "total_completed": len(result.data)}
    except Exception as e:
        print(f"[Progress] streak error (non-fatal): {e}")
        return {"streak": 0, "total_completed": 0}
