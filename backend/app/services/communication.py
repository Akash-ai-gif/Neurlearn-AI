from typing import Dict, Any, List
import random

from app.services.llm import analyze_communication

class CommunicationService:
    @staticmethod
    async def analyze_response(text: str, scenario: str = "general interview") -> Dict[str, Any]:
        """
        Analyze a spoken/typed response for clarity, confidence, and structure via LLM.
        """
        return await analyze_communication(text, scenario)

    @staticmethod
    def get_interview_scenarios() -> List[Dict[str, Any]]:
        return [
            {"id": "swe", "title": "Software Engineer", "company": "Google", "difficulty": "Hard"},
            {"id": "da", "title": "Data Analyst", "company": "Microsoft", "difficulty": "Medium"},
            {"id": "pm", "title": "Product Manager", "company": "Amazon", "difficulty": "Hard"},
        ]
