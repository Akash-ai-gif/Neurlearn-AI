import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.llm import answer_question

async def test():
    load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))
    print("Testing Professor AI Understanding...")
    
    # Test 1: Technical question
    q1 = "How does a transformer neural network handle long-range dependencies?"
    print(f"\n[Q1]: {q1}")
    res1 = await answer_question(q1)
    print(f"[A1 Response]: {res1.get('response')[:200]}...")
    print(f"[A1 Image URL]: {res1.get('image_url')}")
    
    # Test 2: Contextual follow-up
    history = [
        {"role": "user", "content": "What is React?"},
        {"role": "assistant", "content": "React is a JavaScript library for building user interfaces."}
    ]
    q2 = "Who created it?"
    print(f"\n[Q2]: {q2} (with history)")
    res2 = await answer_question(q2, conversation_history=history)
    print(f"[A2 Response]: {res2.get('response')}")

if __name__ == "__main__":
    asyncio.run(test())
