import os
import json
import httpx
import urllib.parse
import asyncio
import time
from typing import List, Dict, Any, Optional
from app.core.config import settings

# ─── OpenRouter Configuration ────────────────────────────────────────────────
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Use an extremely stable model ID that is guaranteed to exist on OpenRouter
MODEL = "openai/gpt-4o-mini" 

async def _call_openrouter(messages: List[Dict[str, str]], json_mode: bool = False) -> str:
    """Call OpenRouter API with robust error handling and retries.
    Retries up to 3 times on network errors or non‑200 responses.
    Returns the content string on success, or empty string on failure.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://neurolearn.ai",
        "X-Title": "NeuroLearn AI",
    }

    if not OPENROUTER_API_KEY:
        with open("openrouter_debug.txt", "w") as f:
            f.write("CRITICAL ERROR: OPENROUTER_API_KEY is empty! Please restart backend.")
        return ""

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.7,
    }
    # Optional: enforce JSON response if needed
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            # Log attempt
            error_msg = f"[OpenRouter] Attempt {attempt} failed: {e}"
            print(error_msg)
            # Write detailed error for debugging
            with open("openrouter_debug.txt", "a") as f:
                f.write(error_msg + "\n")
            if attempt < max_retries:
                # exponential backoff
                await asyncio.sleep(2 ** attempt)
            else:
                # final failure, return empty string
                return ""


def _parse_json(raw: str) -> Any:
    """Extract JSON from raw text."""
    try:
        # Try direct parse
        return json.loads(raw)
    except:
        # Try finding JSON block
        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start != -1 and end != 0:
                return json.loads(raw[start:end])
        except:
            pass
    return {}

async def _generate_image_url(prompt: str) -> str:
    """Create a quick image URL using the Pollinations service.
    The URL returns a generated image without needing to store the file.
    """
    # Enhance the prompt to ensure a detailed, high-quality educational image
    enhanced_prompt = f"Highly detailed educational diagram, clear explanation, infographic style, {prompt}"
    # Increase character limit to allow for detailed prompts
    safe_prompt = urllib.parse.quote(enhanced_prompt[:400])
    # Width/height increased for better quality and detail visibility
    return f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1024&height=768&nologo=true"

async def answer_question(question: str, context_skill: str = None, history: List[dict] = [], cognitive_state: dict = None) -> Dict[str, Any]:
    """Universal answer function using OpenRouter.
    Returns a concise response and optionally an image URL when the user asks for a visual.
    """
    # Detect visual request keywords
    visual_keywords = ["draw", "illustrate", "show me", "picture", "image", "diagram", "visual", "graph"]
    is_visual = any(kw in question.lower() for kw in visual_keywords) or "[VISUAL MODE]" in question.upper()

    system = """You are Professor AI, a world‑class tutor on NeuroLearn.
    Provide clear, concise answers (short to medium length). Use plain language.
    If the user explicitly asks for a visual explanation, OR if the concept is complex and a visual aid would help them understand, include an "image_prompt" describing the desired picture. The image_prompt MUST be a highly detailed visual description of an educational diagram or infographic to explain the topic. Return ONLY a JSON object with the fields:
    {
      \"response\": \"Your answer (Markdown)\",
      \"agent\": \"Professor AI\",
      \"agent_icon\": \"🎓\",
      \"related_concepts\": [],
      \"practice_problems\": [],
      \"image_prompt\": \"A highly detailed description for an educational diagram (optional)\"
    }
    """
    
    # Build messages
    messages = [{"role": "system", "content": system}]
    for msg in history[-5:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": f"Topic: {context_skill or 'general'}\nQuestion: {question}"})

    raw = await _call_openrouter(messages, json_mode=True)
    result = _parse_json(raw)
    if not result:
        result = {"response": "I’m having trouble connecting to the AI service. Please try again in a moment.", "agent": "Professor AI", "agent_icon": "🎓", "related_concepts": [], "practice_problems": []}

    # If visual needed or AI decided to generate an image
    img_prompt = result.get("image_prompt")
    if is_visual or img_prompt:
        final_prompt = img_prompt if img_prompt else question
        result["image_url"] = await _generate_image_url(final_prompt)
    else:
        # Ensure key exists but may be empty
        result.setdefault("image_url", "")
    return result


async def generate_custom_path(career_goal: str) -> List[Dict[str, Any]]:
    """Return skill path via OpenRouter."""
    prompt = f"""You are a world-class curriculum architect at a top-tier university. 
Design a deep, technically accurate, industry-standard learning path for the domain: "{career_goal}"

The curriculum must cover:
1. Foundational principles specific to {career_goal}.
2. Essential tools, languages, or frameworks used by professionals in this field.
3. Advanced specialized topics that distinguish an expert from a beginner.
4. Practical application scenarios.

Create 8-10 specific modules (skills) in logical progression from foundations to advanced mastery.
Return ONLY a JSON object with a single key "nodes" which contains an array of objects. 
Each object must have: {{"id", "skill", "status": "available" (first 2 nodes) or "locked" (others), "score": 0, "order", "level": "Beginner"|"Intermediate"|"Advanced", "objectives": ["detailed objective 1", "detailed objective 2"]}}"""
    
    messages = [{"role": "system", "content": "You return ONLY raw JSON objects."}, {"role": "user", "content": prompt}]
    raw = await _call_openrouter(messages, json_mode=True)
    
    parsed = _parse_json(raw)
    
    if isinstance(parsed, dict) and "nodes" in parsed:
        nodes = parsed["nodes"]
    elif isinstance(parsed, dict) and "skills" in parsed:
        nodes = parsed["skills"]
    elif isinstance(parsed, list):
        nodes = parsed
    else:
        nodes = []
        
    if not nodes:
        # Fallback to a default curriculum if LLM fails
        nodes = [
            {"id": f"{career_goal.lower().replace(' ', '_')}_basics", "skill": f"{career_goal} Fundamentals", "status": "available", "score": 0, "order": 1, "level": "Beginner", "objectives": ["Understand core concepts"]},
            {"id": "tools_frameworks", "skill": "Essential Tools & Frameworks", "status": "locked", "score": 0, "order": 2, "level": "Intermediate", "objectives": ["Master industry tools"]},
            {"id": "advanced_topics", "skill": "Advanced Mastery", "status": "locked", "score": 0, "order": 3, "level": "Advanced", "objectives": ["Solve complex real-world problems"]},
        ]
        
    return nodes


async def generate_custom_lesson(skill_id: str, cognitive_state: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate a DEEP comprehensive personalized lesson."""
    prompt = f"Create a rich, 10-block lesson for skill: {skill_id}. Include 'Introduction', 'Core Concepts', 'Deep Dive', and 'Interactive Quiz' blocks."
    messages = [{"role": "system", "content": "You return ONLY raw JSON objects."}, {"role": "user", "content": prompt}]
    raw = await _call_openrouter(messages, json_mode=True)
    return _parse_json(raw) or {"title": "Adaptive Lesson", "content_blocks": []}

async def review_code(code: str, language: str, task: str) -> str:
    messages = [{"role": "user", "content": f"Review this {language} code for the task {task}:\n\n{code}"}]
    return await _call_openrouter(messages)

async def generate_visual_diagram(topic: str, context: str = "") -> Dict[str, Any]:
    prompt = f"Create a concept map for {topic}. Return JSON with 'nodes' and 'links'."
    messages = [{"role": "system", "content": "You return ONLY raw JSON for D3.js."}, {"role": "user", "content": prompt}]
    raw = await _call_openrouter(messages, json_mode=True)
    return _parse_json(raw) or {"nodes": [], "links": []}

async def analyze_communication(text: str, scenario: str) -> Dict[str, Any]:
    """Analyze communication skills."""
    prompt = f"Analyze this response for a '{scenario}' scenario: {text}. Return JSON with 'confidence', 'clarity', 'feedback', and 'score'."
    messages = [{"role": "system", "content": "You are a communication coach. Return ONLY JSON."}, {"role": "user", "content": prompt}]
    raw = await _call_openrouter(messages, json_mode=True)
    return _parse_json(raw) or {"confidence": 50, "clarity": 50, "feedback": "Keep practicing!", "score": 50}

async def generate_quiz(skill_name: str, lesson_content: str = "") -> List[Dict[str, Any]]:
    """Generate 5 MCQ quiz questions for a given skill using AI."""
    prompt = f"""Create exactly 5 multiple-choice quiz questions for the topic: "{skill_name}".
{f'Based on this lesson content: {lesson_content[:1000]}' if lesson_content else ''}

Return ONLY a JSON array of objects. Each object must have:
- "question": the question text
- "options": array of exactly 4 option strings
- "correct": index (0-3) of the correct answer
- "explanation": brief explanation of why that answer is correct

Example: [{{"question":"What is X?","options":["A","B","C","D"],"correct":1,"explanation":"B because..."}}]"""

    messages = [
        {"role": "system", "content": "You return ONLY raw JSON arrays. No markdown, no code fences."},
        {"role": "user", "content": prompt}
    ]
    raw = await _call_openrouter(messages, json_mode=True)
    parsed = _parse_json(raw)
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict) and "questions" in parsed:
        return parsed["questions"]
    return []


async def generate_summary(skill_name: str, lesson_content: str = "") -> str:
    """Generate a concise concept summary for a completed lesson."""
    prompt = f"""Summarize the key concepts of "{skill_name}" in a clear, structured format.
{f'Based on this lesson content: {lesson_content[:1500]}' if lesson_content else ''}

Return ONLY a JSON object with:
- "summary": a 3-5 paragraph markdown summary covering key takeaways
- "key_points": array of 4-6 one-line bullet points
- "real_world": a short paragraph on real-world applications

Keep it educational and practical."""

    messages = [
        {"role": "system", "content": "You return ONLY raw JSON objects."},
        {"role": "user", "content": prompt}
    ]
    raw = await _call_openrouter(messages, json_mode=True)
    return _parse_json(raw) or {"summary": "", "key_points": [], "real_world": ""}


async def generate_video_queries(skill_name: str) -> List[Dict[str, str]]:
    """Generate YouTube search queries and curated video suggestions for a topic."""
    prompt = f"""For the learning topic "{skill_name}", suggest 4 YouTube search queries that would find the best educational videos.

Return ONLY a JSON array of objects, each with:
- "title": a human-friendly video title suggestion (e.g. "Python Lists Explained in 10 Minutes")
- "query": the YouTube search query string
- "channel_hint": a well-known educational channel that likely has this content (e.g. "freeCodeCamp", "Traversy Media", "3Blue1Brown", "Fireship", "CS Dojo", "Corey Schafer", "The Coding Train", "Khan Academy", "Simplilearn", etc.)
- "duration_hint": estimated video length like "10 min" or "25 min"

Focus on tutorials, crash courses, and visual explanations. Return 4 items."""

    messages = [
        {"role": "system", "content": "You return ONLY raw JSON arrays."},
        {"role": "user", "content": prompt}
    ]
    raw = await _call_openrouter(messages, json_mode=True)
    parsed = _parse_json(raw)
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict) and "videos" in parsed:
        return parsed["videos"]
    return []


# Aliases for compatibility
_gemini = _call_openrouter
