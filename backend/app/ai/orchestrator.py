"""
NeuroLearn — Multi-Agent AI Orchestrator (Server-Side)
Selects the optimal teaching agent based on cognitive state and context.
"""
from typing import Optional

AGENT_PERSONAS = {
    "professor": {
        "name": "Professor",
        "icon": "🎓",
        "color": "#00D1FF",
        "system_prompt": """You are Professor, a patient and clear teacher for NeuroLearn. 
You explain concepts using structured, step-by-step explanations with real-world examples. 
Use analogies from everyday life. Format with markdown. Include code blocks when relevant.
Always end with a thought-provoking question to check understanding.""",
    },
    "socrates": {
        "name": "Socrates",
        "icon": "🤔",
        "color": "#7C3AED",
        "system_prompt": """You are Socrates, a guide who teaches through questions.
Never give direct answers. Instead, ask thought-provoking questions.
Use the Socratic method to lead learners to discover answers themselves.
Start with what they know and build toward new understanding.""",
    },
    "visualizer": {
        "name": "Visualizer",
        "icon": "🎨",
        "color": "#00F5A0",
        "system_prompt": """You are Visualizer. Explain concepts using diagrams, tables, and visual metaphors.
Always include at least one mermaid diagram or ASCII art visualization.
Make abstract concepts concrete through spatial and visual thinking.""",
    },
    "coach": {
        "name": "Coach",
        "icon": "💪",
        "color": "#FFB800",
        "system_prompt": """You are Coach, a motivational learning partner.
Celebrate progress, encourage persistence, and help learners see growth.
Use encouraging language and growth mindset principles.
When they struggle, remind them how far they've come.""",
    },
}


def select_agent(cognitive_state: dict, context: Optional[str] = None) -> str:
    """Select the best agent based on cognitive state."""
    confusion = cognitive_state.get("confusion", 0)
    fatigue = cognitive_state.get("fatigue", 0)
    engagement = cognitive_state.get("engagement", 50)
    flow = cognitive_state.get("flow", 50)
    frustration = cognitive_state.get("frustration", 0)

    if confusion > 60:
        return "professor"
    if fatigue > 70 or engagement < 30:
        return "coach"
    if frustration > 50:
        return "professor"
    if flow > 70 and engagement > 60:
        return "socrates"
    if context and ("visual" in context or "diagram" in context):
        return "visualizer"
    return "professor"


def get_agent_prompt(persona: str, skill_context: str = "", user_level: str = "intermediate") -> str:
    """Build the full system prompt for an agent."""
    agent = AGENT_PERSONAS.get(persona, AGENT_PERSONAS["professor"])
    base_prompt = agent["system_prompt"]
    context = f"\n\nCurrent topic: {skill_context}\nLearner level: {user_level}"
    return base_prompt + context
