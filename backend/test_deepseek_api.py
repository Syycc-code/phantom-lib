import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pathlib import Path

print("="*50)
print("DEEPSEEK API TEST")
print("="*50)

# 1. Load Env
env_path = Path(__file__).parent.parent / ".env"
print(f"Loading .env from: {env_path}")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    print("ERROR: DEEPSEEK_API_KEY not found in .env")
    exit(1)

masked_key = f"{api_key[:5]}...{api_key[-3:]}"
print(f"API Key loaded: {masked_key}")

# 2. Setup Client
print("Connecting to DeepSeek API...")
client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://api.deepseek.com"
)

# 3. Make Request
async def test_chat():
    print("Sending test request...")
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "user", "content": "Hello! Reply with 'ONLINE' only."}
            ],
            stream=False
        )
        print(f"SUCCESS! Response: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"REQUEST FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(test_chat())
    print("="*50)
