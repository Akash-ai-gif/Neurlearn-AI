"""
NeuroLearn — Learning API (Real Supabase)
Handles learning paths, lessons, skill graphs, code execution, communication.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from app.core.database import get_supabase

router = APIRouter()


from app.services.llm import generate_custom_path, generate_custom_lesson

@router.get("/path/{user_id}")
async def get_learning_path(user_id: str):
    """Get the adaptive learning path for a user from DB or generate via LLM."""
    db = get_supabase()

    # Get current career goal — wrapped in try/catch to handle UUID format issues
    current_career = "Software Engineer"
    try:
        profile = db.table("profiles").select("career_goal").eq("id", user_id).execute()
        if profile.data and profile.data[0].get("career_goal"):
            current_career = profile.data[0]["career_goal"]
    except Exception as e:
        print(f"Profile lookup error (non-fatal): {e}")

    # Try to get existing path
    try:
        path_result = db.table("learning_paths").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    except Exception as e:
        print(f"Path lookup error: {e}")
        path_result = type('obj', (object,), {'data': []})()

    if path_result.data and len(path_result.data) > 0:
        p = path_result.data[0]
        stored_career = p.get("career_goal", "")
        
        # If career goal matches (or we couldn't fetch profile), return existing path
        if stored_career == current_career or current_career == "Software Engineer":
            nodes = p.get("nodes", [])
            if isinstance(nodes, str):
                try:
                    nodes = json.loads(nodes)
                except:
                    nodes = []
            # Unwrap nested structures
            if isinstance(nodes, dict):
                nodes = nodes.get("nodes", nodes.get("skills", []))
            if not isinstance(nodes, list):
                nodes = []
            
            if nodes:
                return {
                    "id": p["id"],
                    "user_id": user_id,
                    "career_goal": stored_career or current_career,
                    "completion_percent": p.get("completion_percent", 0),
                    "nodes": nodes,
                    "adaptations": [],
                }

    # No matching path exists — generate a dynamic one via LLM
    print(f"[LLM] Generating curriculum for: {current_career}")
    nodes = await generate_custom_path(current_career)

    # Save this generated path to DB
    path_id = "generated"
    try:
        path_data = {
            "user_id": user_id,
            "career_goal": current_career,
            "nodes": json.dumps(nodes),
            "completion_percent": 0,
            "current_node_index": 0,
        }
        insert_result = db.table("learning_paths").insert(path_data).execute()
        path_id = insert_result.data[0]["id"] if insert_result.data else "generated"

        # SYNC: Also seed the skills and user_skills tables so the graph and sidebar are populated
        for node in nodes:
            skill_id = node.get("id")
            skill_name = node.get("skill")
            if not skill_id or not skill_name:
                continue
            try:
                db.table("skills").upsert({
                    "id": skill_id,
                    "name": skill_name,
                    "domain": current_career,
                    "level": node.get("level", "Beginner"),
                    "objectives": node.get("objectives", [])
                }).execute()

                db.table("user_skills").upsert({
                    "user_id": user_id,
                    "skill_id": skill_id,
                    "status": node.get("status", "locked"),
                    "score": 0
                }).execute()
            except Exception as skill_err:
                print(f"Skill sync error for {skill_id}: {skill_err}")

    except Exception as e:
        print(f"Path Save/Sync Error: {e}")

    return {
        "id": path_id,
        "user_id": user_id,
        "career_goal": current_career,
        "completion_percent": 0,
        "nodes": nodes,
        "adaptations": [],
    }


class GeneratePathRequest(BaseModel):
    user_id: str
    career_goal: str

@router.post("/path/generate")
async def force_generate_path(req: GeneratePathRequest):
    """Force generate a new curriculum path via LLM."""
    db = get_supabase()
    nodes = await generate_custom_path(req.career_goal)
    
    try:
        path_data = {
            "user_id": req.user_id,
            "career_goal": req.career_goal,
            "nodes": json.dumps(nodes),
            "completion_percent": 0,
            "current_node_index": 0,
        }
        insert_result = db.table("learning_paths").insert(path_data).execute()
        path_id = insert_result.data[0]["id"] if insert_result.data else "generated"
    except Exception as e:
        print(f"Path Save Error: {e}")
        path_id = "generated"

    return {
        "id": path_id,
        "user_id": req.user_id,
        "career_goal": req.career_goal,
        "nodes": nodes,
    }


class GenerateLessonRequest(BaseModel):
    skill_id: str
    user_id: str
    cognitive_state: Optional[dict] = None


@router.post("/generate-lesson")
async def generate_lesson(req: GenerateLessonRequest):
    """Generate a real AI lesson based on skill and cognitive state via LLM."""
    lesson = await generate_custom_lesson(req.skill_id, req.cognitive_state)
    return {
        "skill_id": req.skill_id,
        "title": lesson.get("title", f"Lesson: {req.skill_id}"),
        "agent": "professor",
        "content_blocks": lesson.get("content_blocks", []),
        "estimated_duration": 15,
        "difficulty": "intermediate",
    }


from app.services.code_exec import CodeExecutionService


class ExecuteRequest(BaseModel):
    type: str  # sql or python
    code: str


@router.post("/execute")
async def execute_code(req: ExecuteRequest):
    """Execute code snippets in the Virtual Labs."""
    if req.type == "sql":
        result = CodeExecutionService.execute_sql(req.code)
        return result
    elif req.type == "python":
        result = CodeExecutionService.execute_python(req.code)
        return result
    return {"error": "Unsupported language", "success": False}


from app.services.communication import CommunicationService


class CommAnalysisRequest(BaseModel):
    text: str
    scenario_id: str


@router.post("/analyze-comm")
async def analyze_comm(req: CommAnalysisRequest):
    """Analyze communication responses."""
    result = await CommunicationService.analyze_response(req.text, req.scenario_id)
    return result


@router.get("/skill-graph/{user_id}")
async def get_skill_graph(user_id: str):
    """Get the full knowledge graph for a user from DB."""
    db = get_supabase()

    # Get user skills from DB
    user_skills = db.table("user_skills").select("*, skills(*)").eq("user_id", user_id).execute()

    if user_skills.data and len(user_skills.data) > 0:
        nodes = []
        for us in user_skills.data:
            skill = us.get("skills", {}) or {}
            nodes.append({
                "id": us.get("skill_id", ""),
                "name": skill.get("name", us.get("skill_id", "")),
                "domain": skill.get("domain", "core"),
                "status": us.get("status", "locked"),
                "score": us.get("score", 0),
                "explanation": skill.get("description") or f"Neural node representing mastery in {skill.get('name') or 'this module'}.",
            })

        # Generate links from prerequisites
        links = []
        for i in range(len(nodes) - 1):
            links.append({
                "source": nodes[i]["id"],
                "target": nodes[i + 1]["id"],
                "type": "prerequisite",
            })

        return {"nodes": nodes, "links": links}

    # Fallback: generate from learning path
    path_result = db.table("learning_paths").select("nodes").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    if path_result.data:
        nodes_raw = path_result.data[0].get("nodes", [])
        if isinstance(nodes_raw, str):
            nodes_raw = json.loads(nodes_raw)
        nodes = [
            {
                "id": n["id"], 
                "name": n["skill"], 
                "domain": "core", 
                "status": n["status"], 
                "score": n["score"],
                "explanation": n.get("explanation") or f"Module focused on mastering {n['skill']}. Covers fundamental concepts and practical applications."
            }
            for n in nodes_raw
        ]
        links = [
            {"source": nodes_raw[i]["id"], "target": nodes_raw[i + 1]["id"], "type": "prerequisite"}
            for i in range(len(nodes_raw) - 1)
        ]
        return {"nodes": nodes, "links": links}

    # Empty graph
    return {"nodes": [], "links": []}

from app.services.llm import review_code, generate_visual_diagram, generate_quiz, generate_summary, generate_video_queries

class ReviewRequest(BaseModel):
    code: str
    language: str
    task: str

@router.post("/review-code")
async def ai_review_code(req: ReviewRequest):
    """Review code via LLM."""
    review = await review_code(req.code, req.language, req.task)
    return {"review": review}


class VisualDiagramRequest(BaseModel):
    topic: str
    context: Optional[str] = ""

@router.post("/visual-diagram")
async def get_visual_diagram(req: VisualDiagramRequest):
    """Generate a visual concept map/diagram for a topic."""
    diagram = await generate_visual_diagram(req.topic, req.context)
    return diagram


# ─── New: Video Resources ─────────────────────────────────────────────────────
@router.get("/videos/{skill_name}")
async def get_video_resources(skill_name: str):
    """Get curated YouTube video links and search queries for a skill topic."""
    import urllib.parse
    
    videos = await generate_video_queries(skill_name)
    
    # Build YouTube search URLs for each suggestion
    enriched = []
    for v in videos:
        query = v.get("query", skill_name)
        enriched.append({
            "title": v.get("title", query),
            "channel": v.get("channel_hint", ""),
            "duration": v.get("duration_hint", ""),
            "search_url": f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}",
            "embed_search": f"https://www.youtube.com/embed?listType=search&list={urllib.parse.quote(query)}",
        })
    
    # Also add a direct search link for the skill
    direct_query = f"{skill_name} tutorial for beginners"
    enriched.append({
        "title": f"{skill_name} — Full Tutorial",
        "channel": "Search All",
        "duration": "Various",
        "search_url": f"https://www.youtube.com/results?search_query={urllib.parse.quote(direct_query)}",
        "embed_search": "",
    })
    
    return {"skill": skill_name, "videos": enriched}



# ─── New: Concept Summary ─────────────────────────────────────────────────────
class SummaryRequest(BaseModel):
    skill_name: str
    lesson_content: Optional[str] = ""

@router.post("/summary/generate")
async def generate_concept_summary(req: SummaryRequest):
    """Generate an AI-powered concept summary for a completed lesson."""
    summary_data = await generate_summary(req.skill_name, req.lesson_content or "")
    return {"skill": req.skill_name, **summary_data}
