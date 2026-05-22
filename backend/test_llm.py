import asyncio
import os
from app.core.config import settings
from app.services.llm import answer_question

async def test_llm():
    print(f"API KEY length: {len(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else 0}")
    try:
        response = await answer_question("Hello, how are you?", "general", [], {})
        print("Success:", response)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_llm())
