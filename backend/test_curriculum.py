import asyncio
import os
import sys
import json

# Add current directory to path so we can import app
sys.path.append(os.path.abspath(os.curdir))

from app.services.llm import generate_custom_path

async def test_curriculum():
    domain = "Data Analyst"
    print(f"--- Generating Curriculum for: {domain} ---")
    
    try:
        nodes = await generate_custom_path(domain)
        print("\n[SUCCESS] Generated Curriculum Nodes:")
        print(json.dumps(nodes, indent=2))
        
        if not nodes:
            print("\n[WARNING] Nodes array is empty. Check OpenRouter connection.")
        elif len(nodes) >= 3 and nodes[0].get('id') == 'data_analyst_basics':
             print("\n[NOTE] Using Fallback curriculum (ID matched fallback pattern).")
        else:
            print("\n[VERIFIED] Successfully generated a unique LLM curriculum!")
            
    except Exception as e:
        print(f"\n[ERROR] Generation failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_curriculum())
