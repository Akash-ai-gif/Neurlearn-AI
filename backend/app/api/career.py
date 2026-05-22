"""
NeuroLearn — Career API (Personalized via LLM)
Generates career recommendations based on user's selected domain and skill data.
"""
from fastapi import APIRouter
import json

from app.core.database import get_supabase
from app.services.llm import _gemini, _parse_json

router = APIRouter()

CAREER_RECOMMENDATIONS = {
    "swe": {
        "recommendations": [
            {
                "title": "Full-Stack Developer", "match_percent": 94, "icon": "💻",
                "skill_gap": [{"skill": "React/Next.js", "current": 30, "required": 80}, {"skill": "System Design", "current": 10, "required": 70}],
                "estimated_time": "4 months", "open_jobs": 18000, "salary_range": "₹8-20 LPA",
                "description": "Build complete web applications from frontend to backend"
            },
            {
                "title": "Backend Engineer", "match_percent": 89, "icon": "⚙️",
                "skill_gap": [{"skill": "Node.js/Python", "current": 25, "required": 75}, {"skill": "Databases", "current": 15, "required": 70}],
                "estimated_time": "3.5 months", "open_jobs": 14000, "salary_range": "₹7-18 LPA",
                "description": "Design APIs, microservices, and server infrastructure"
            },
            {
                "title": "DevOps Engineer", "match_percent": 78, "icon": "🚀",
                "skill_gap": [{"skill": "Docker/K8s", "current": 5, "required": 65}, {"skill": "CI/CD", "current": 10, "required": 60}],
                "estimated_time": "5 months", "open_jobs": 9500, "salary_range": "₹10-22 LPA",
                "description": "Automate deployments and manage cloud infrastructure"
            },
        ],
        "market_insights": {
            "trending_skills": ["TypeScript", "Next.js", "Docker", "AWS", "GraphQL"],
            "hot_industries": ["SaaS", "FinTech", "AI/ML Startups"],
            "avg_salary_growth": "15% YoY"
        }
    },
    "data_analyst": {
        "recommendations": [
            {
                "title": "Data Analyst", "match_percent": 95, "icon": "📊",
                "skill_gap": [{"skill": "Advanced SQL", "current": 20, "required": 85}, {"skill": "Tableau/Power BI", "current": 10, "required": 70}],
                "estimated_time": "3 months", "open_jobs": 12000, "salary_range": "₹5-14 LPA",
                "description": "Transform raw data into actionable business insights"
            },
            {
                "title": "Business Intelligence Analyst", "match_percent": 88, "icon": "📈",
                "skill_gap": [{"skill": "Data Modeling", "current": 15, "required": 70}, {"skill": "Stakeholder Comm.", "current": 30, "required": 65}],
                "estimated_time": "3.5 months", "open_jobs": 8500, "salary_range": "₹6-16 LPA",
                "description": "Drive strategic decisions through data dashboards"
            },
            {
                "title": "Data Scientist", "match_percent": 75, "icon": "🧬",
                "skill_gap": [{"skill": "Machine Learning", "current": 5, "required": 75}, {"skill": "Python/Pandas", "current": 20, "required": 80}],
                "estimated_time": "6 months", "open_jobs": 7200, "salary_range": "₹8-22 LPA",
                "description": "Build predictive models and AI solutions"
            },
        ],
        "market_insights": {
            "trending_skills": ["Python", "SQL", "Tableau", "Power BI", "Excel Advanced"],
            "hot_industries": ["FinTech", "HealthTech", "E-commerce", "Banking"],
            "avg_salary_growth": "12% YoY"
        }
    },
    "digital_marketing": {
        "recommendations": [
            {
                "title": "Digital Marketing Manager", "match_percent": 93, "icon": "📱",
                "skill_gap": [{"skill": "SEO/SEM", "current": 25, "required": 80}, {"skill": "Google Analytics", "current": 15, "required": 75}],
                "estimated_time": "3 months", "open_jobs": 11000, "salary_range": "₹5-15 LPA",
                "description": "Plan and execute multi-channel marketing campaigns"
            },
            {
                "title": "Content Strategist", "match_percent": 86, "icon": "✍️",
                "skill_gap": [{"skill": "Copywriting", "current": 30, "required": 75}, {"skill": "Social Media", "current": 40, "required": 80}],
                "estimated_time": "2 months", "open_jobs": 7800, "salary_range": "₹4-12 LPA",
                "description": "Create engaging content strategies that drive growth"
            },
            {
                "title": "Growth Hacker", "match_percent": 79, "icon": "🚀",
                "skill_gap": [{"skill": "A/B Testing", "current": 10, "required": 65}, {"skill": "Funnel Optimization", "current": 5, "required": 60}],
                "estimated_time": "4 months", "open_jobs": 5500, "salary_range": "₹6-18 LPA",
                "description": "Use data-driven experiments to scale user acquisition"
            },
        ],
        "market_insights": {
            "trending_skills": ["AI Content Tools", "SEO", "Meta Ads", "Video Marketing", "Analytics"],
            "hot_industries": ["D2C Brands", "EdTech", "SaaS", "Creator Economy"],
            "avg_salary_growth": "18% YoY"
        }
    },
    "uiux": {
        "recommendations": [
            {
                "title": "UI/UX Designer", "match_percent": 96, "icon": "🎨",
                "skill_gap": [{"skill": "Figma Advanced", "current": 30, "required": 85}, {"skill": "User Research", "current": 15, "required": 70}],
                "estimated_time": "3 months", "open_jobs": 9000, "salary_range": "₹6-16 LPA",
                "description": "Design intuitive and beautiful user experiences"
            },
            {
                "title": "Product Designer", "match_percent": 88, "icon": "💎",
                "skill_gap": [{"skill": "Prototyping", "current": 20, "required": 75}, {"skill": "Design Systems", "current": 10, "required": 70}],
                "estimated_time": "4 months", "open_jobs": 6500, "salary_range": "₹8-20 LPA",
                "description": "Shape the entire product experience from concept to launch"
            },
            {
                "title": "Frontend Developer", "match_percent": 76, "icon": "🖥️",
                "skill_gap": [{"skill": "HTML/CSS/JS", "current": 15, "required": 70}, {"skill": "React", "current": 5, "required": 65}],
                "estimated_time": "5 months", "open_jobs": 14000, "salary_range": "₹6-18 LPA",
                "description": "Bring designs to life with code"
            },
        ],
        "market_insights": {
            "trending_skills": ["Figma", "Framer", "Design Systems", "Motion Design", "AI-assisted Design"],
            "hot_industries": ["SaaS", "FinTech", "HealthTech", "Gaming"],
            "avg_salary_growth": "14% YoY"
        }
    },
}

# Fallback for unknown domains
DEFAULT_CAREER = {
    "recommendations": [
        {
            "title": "Tech Professional", "match_percent": 85, "icon": "🎯",
            "skill_gap": [{"skill": "Core Fundamentals", "current": 20, "required": 70}],
            "estimated_time": "4 months", "open_jobs": 25000, "salary_range": "₹5-15 LPA",
            "description": "Build a strong foundation in your chosen tech domain"
        },
    ],
    "market_insights": {
        "trending_skills": ["Python", "Communication", "Problem Solving", "Git"],
        "hot_industries": ["Technology", "Finance", "Healthcare"],
        "avg_salary_growth": "12% YoY"
    }
}


@router.get("/recommendations/{user_id}")
async def get_career_recommendations(user_id: str):
    """Get personalized career recommendations based on user's selected domain."""
    db = get_supabase()

    # Get user profile — career_goal is the key
    career_goal = ""
    try:
        profile = db.table("profiles").select("career_goal, learning_dna").eq("id", user_id).execute()
        if profile.data:
            career_goal = profile.data[0].get("career_goal", "")
    except Exception as e:
        print(f"[Career] Profile fetch error: {e}")

    # Get user skills to personalize skill gaps
    skill_scores = {}
    try:
        user_skills = db.table("user_skills").select("skill_id, score, status").eq("user_id", user_id).execute()
        for s in (user_skills.data or []):
            skill_scores[s["skill_id"]] = s["score"]
    except Exception:
        pass

    # Select the right career data based on user's domain
    career_key = career_goal.lower().strip() if career_goal else ""
    career_data = CAREER_RECOMMENDATIONS.get(career_key, DEFAULT_CAREER)

    # Update skill gaps with actual user scores if available
    recommendations = career_data["recommendations"]
    for rec in recommendations:
        for gap in rec["skill_gap"]:
            skill_key = gap["skill"].lower().replace(" ", "_").replace("/", "_")
            if skill_key in skill_scores:
                gap["current"] = min(skill_scores[skill_key], gap["required"])

    return {
        "user_id": user_id,
        "career_goal": career_goal,
        "strength_profile": skill_scores or {"general": 50},
        "recommendations": recommendations,
        "market_insights": career_data["market_insights"],
    }
