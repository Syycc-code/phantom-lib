from openai import AsyncOpenAI
import json
from app.core.config import settings

client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY, 
    base_url=settings.DEEPSEEK_BASE_URL,
    timeout=settings.DEEPSEEK_TIMEOUT
)

async def analyze_paper_content(abstract: str, full_text: str = ""):
    """
    Uses DeepSeek to analyze the paper and extract:
    1. Core tags (Domain, Tech, Problem)
    2. Shadow Problem (The issue being solved)
    3. Persona Solution (The proposed method)
    4. Weakness/Flaw (Limitations)
    """
    if not settings.DEEPSEEK_API_KEY or settings.DEEPSEEK_API_KEY == "mock-key":
        return {
            "tags": ["Analysis Failed", "No Key"],
            "shadow_problem": "Unknown",
            "persona_solution": "Unknown",
            "weakness_flaw": "Unknown"
        }

    prompt = f"""
    You are a Phantom Thief analyzing a Target (Academic Paper).
    Extract the "Treasure" (Core Insight) from this abstract:
    
    "{abstract}"
    
    Return a JSON object with these exact keys:
    - tags: [List of 3-5 short technical tags, e.g. "CV", "Transformer"]
    - shadow_problem: "What is the distorted desire or problem this paper fights?" (1 sentence)
    - persona_solution: "What is the Persona or Method used to solve it?" (1 sentence)
    - weakness_flaw: "What is the limitation or flaw?" (1 sentence)
    """
    
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"[ANALYSIS ERROR] {e}")
        return {
            "tags": ["Error"],
            "shadow_problem": "Analysis Failed",
            "persona_solution": "Check Logs",
            "weakness_flaw": str(e)
        }
