"""
NeuroLearn — Assessment API (Real Supabase)
Handles quiz questions, submissions, and history.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from app.services.llm import generate_quiz

from app.core.database import get_supabase

router = APIRouter()


class AssessmentSubmission(BaseModel):
    user_id: str
    skill_id: str
    skill_name: str
    answers: List[int]
    questions: List[Dict[str, Any]]

class QuizGenerateRequest(BaseModel):
    skill_name: str
    lesson_content: Optional[str] = ""


@router.post("/quiz/generate")
async def generate_skill_quiz(req: QuizGenerateRequest):
    """Generate AI-powered quiz questions for a given skill."""
    questions = await generate_quiz(req.skill_name, req.lesson_content or "")
    return {"skill": req.skill_name, "questions": questions}


@router.post("/submit")
async def submit_assessment(submission: AssessmentSubmission):
    """Score a quiz submission and return results."""
    correct = 0
    results = []
    
    # Calculate score based on provided questions/answers
    for i, q in enumerate(submission.questions):
        user_ans = submission.answers[i] if i < len(submission.answers) else -1
        correct_idx = q.get("correct", -1)
        is_correct = user_ans == correct_idx
        
        if is_correct:
            correct += 1
            
        results.append({
            "question": q.get("question", ""),
            "user_answer": user_ans,
            "correct_answer": correct_idx,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })
    
    score = int((correct / max(len(submission.questions), 1)) * 100)
    passed = score >= 60
    
    evaluation = {
        "overall_score": score,
        "correct": correct,
        "total": len(submission.questions),
        "passed": passed,
        "results": results,
        "message": "Great job! You passed the quiz." if passed else "Keep studying and try again. You need 60% to pass.",
        "feedback": f"You scored {score}%. {'Great job!' if score >= 70 else 'Keep practicing!'}",
    }

    # Save to DB
    db = get_supabase()
    try:
        db.table("assessments").insert({
            "user_id": submission.user_id,
            "skill_id": submission.skill_id,
            "type": "module_quiz",
            "questions": json.dumps({"count": len(submission.questions)}),
            "answers": json.dumps(submission.answers),
            "score": score,
            "ai_evaluation": json.dumps(evaluation),
        }).execute()

        # Update user_skills status if passed
        if passed:
            db.table("user_skills").update({
                "score": score, 
                "status": "mastered" if score >= 80 else "available"
            }).eq("user_id", submission.user_id).eq("skill_id", submission.skill_id).execute()
            
    except Exception as e:
        print(f"Assessment save error: {e}")

    return evaluation


@router.get("/questions/{skill_id}")
async def get_assessment_questions(skill_id: str):
    """Get assessment questions for a skill (Static Legacy Fallback)."""
    # For module-based learning, use /quiz/generate instead.
    return {"message": "Please use /api/v1/assessment/quiz/generate for AI-powered questions."}


@router.get("/history/{user_id}")
async def get_assessment_history(user_id: str):
    """Get assessment history for a user from DB."""
    db = get_supabase()

    result = db.table("assessments").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()

    assessments = []
    for a in (result.data or []):
        assessments.append({
            "id": a["id"],
            "skill": a.get("skill_id", ""),
            "score": a.get("score", 0),
            "type": a.get("type", "mcq"),
            "date": a.get("created_at", ""),
        })

    return {"assessments": assessments}
