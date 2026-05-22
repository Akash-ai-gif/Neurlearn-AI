"""
NeuroLearn — Doubt Solver / Chat API
Universal AI tutor — answers ANY question with full conversation history.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json

from app.core.database import get_supabase
from app.services.llm import answer_question

router = APIRouter()


class DoubtRequest(BaseModel):
    user_id: str
    input_type: str = "text"
    content: str
    context_skill: Optional[str] = None
    conversation_history: Optional[List[dict]] = None
    cognitive_state: Optional[dict] = None


@router.post("/ask")
async def ask_doubt(req: DoubtRequest):
    """Universal AI tutor — answers ANY question in context."""
    db = get_supabase()

    # Call the universal LLM — it handles greetings, technical Q&A, anything
    ai_data = await answer_question(
        question=req.content,
        context_skill=req.context_skill if req.context_skill != "general" else None,
        history=req.conversation_history or [],
        cognitive_state=req.cognitive_state
    )

    response = ai_data.get("response", "I'm here to help! Ask me anything.")
    related = ai_data.get("related_concepts", [])
    practice = ai_data.get("practice_problems", [])

    # Save to DB (best-effort, don't fail if it errors)
    doubt_id = "doubt-temp"
    try:
        insert_result = db.table("doubts").insert({
            "user_id": req.user_id,
            "input_type": req.input_type,
            "content": req.content,
            "context_skill": req.context_skill or "",
            "ai_response": response,
            "related_concepts": related,
            "resolved": True,
            "image_url": ai_data.get("image_url", "")
        }).execute()
        if insert_result.data:
            doubt_id = insert_result.data[0].get("id", "doubt-temp")
    except Exception as e:
        print(f"[Doubt] DB save error (non-fatal): {e}")

    return {
        "doubt_id": doubt_id,
        "agent": "professor",
        "agent_icon": "🎓",
        "response": response,
        "context": req.context_skill or "General",
        "related_concepts": related,
        "practice_problems": practice,
        "image_url": ai_data.get("image_url"),
        "image_prompt": ai_data.get("image_prompt"),
    }


@router.get("/history/{user_id}")
async def get_doubt_history(user_id: str):
    """Get recent doubt history for a user."""
    db = get_supabase()
    try:
        result = db.table("doubts").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        doubts = [
            {
                "id": d["id"],
                "question": d.get("content", ""),
                "skill": d.get("context_skill", ""),
                "resolved": d.get("resolved", False),
                "date": d.get("created_at", ""),
                "ai_response": d.get("ai_response", ""),
                "image_url": d.get("image_url", ""),
            }
            for d in (result.data or [])
        ]
        return {"doubts": doubts}
    except Exception as e:
        print(f"[Doubt] History error: {e}")
        return {"doubts": []}
