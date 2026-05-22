import asyncio
from app.services.llm import answer_question

async def test():
    print("Testing OpenRouter...")
    res = await answer_question("hi", context_skill="general")
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test())
