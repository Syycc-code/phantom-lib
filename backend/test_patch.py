import httpx
import asyncio

async def test_patch():
    url = "http://127.0.0.1:8000/api/papers/6"
    print(f"Testing PATCH {url}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.patch(url, json={"tags": "TEST_TAG_PERSISTENCE"})
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            
            if resp.status_code == 200:
                print("[SUCCESS] PATCH Endpoint Works!")
            else:
                print("[FAILURE] PATCH Endpoint Failed.")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_patch())
