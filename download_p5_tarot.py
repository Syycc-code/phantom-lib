import requests
import time
import os

# Persona 5 Arcana URLs
TAROT_URLS = {
    "0": "https://static.wikia.nocookie.net/megamitensei/images/d/d4/P5_Fool_Arcana_Card.png",
    "I": "https://static.wikia.nocookie.net/megamitensei/images/5/50/P5_Magician_Arcana_Card.png",
    "II": "https://static.wikia.nocookie.net/megamitensei/images/4/48/P5_Priestess_Arcana_Card.png",
    "III": "https://static.wikia.nocookie.net/megamitensei/images/2/2c/P5_Empress_Arcana_Card.png",
    "IV": "https://static.wikia.nocookie.net/megamitensei/images/b/b0/P5_Emperor_Arcana_Card.png",
    "V": "https://static.wikia.nocookie.net/megamitensei/images/e/ef/P5_Hierophant_Arcana_Card.png",
    "VI": "https://static.wikia.nocookie.net/megamitensei/images/3/3f/P5_Lovers_Arcana_Card.png",
    "VII": "https://static.wikia.nocookie.net/megamitensei/images/5/5f/P5_Chariot_Arcana_Card.png",
    "VIII": "https://static.wikia.nocookie.net/megamitensei/images/f/f0/P5_Justice_Arcana_Card.png",
    "IX": "https://static.wikia.nocookie.net/megamitensei/images/a/a7/P5_Hermit_Arcana_Card.png",
    "X": "https://static.wikia.nocookie.net/megamitensei/images/8/85/P5_Fortune_Arcana_Card.png",
    "XI": "https://static.wikia.nocookie.net/megamitensei/images/c/ca/P5_Strength_Arcana_Card.png",
    "XII": "https://static.wikia.nocookie.net/megamitensei/images/3/39/P5_Hanged_Man_Arcana_Card.png",
    "XIII": "https://static.wikia.nocookie.net/megamitensei/images/a/a2/P5_Death_Arcana_Card.png",
    "XIV": "https://static.wikia.nocookie.net/megamitensei/images/5/5e/P5_Temperance_Arcana_Card.png",
    "XV": "https://static.wikia.nocookie.net/megamitensei/images/5/5a/P5_Devil_Arcana_Card.png",
    "XVI": "https://static.wikia.nocookie.net/megamitensei/images/8/81/P5_Tower_Arcana_Card.png",
    "XVII": "https://static.wikia.nocookie.net/megamitensei/images/3/3f/P5_Star_Arcana_Card.png",
    "XVIII": "https://static.wikia.nocookie.net/megamitensei/images/b/b7/P5_Moon_Arcana_Card.png",
    "XIX": "https://static.wikia.nocookie.net/megamitensei/images/e/e3/P5_Sun_Arcana_Card.png",
    "XX": "https://static.wikia.nocookie.net/megamitensei/images/7/70/P5_Judgement_Arcana_Card.png",
    "XXI": "https://static.wikia.nocookie.net/megamitensei/images/0/0f/P5_World_Arcana_Card.png"
}

output_dir = "public/tarot"
os.makedirs(output_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://megamitensei.fandom.com/'
}

success = 0
failed = 0

for arcana, url in TAROT_URLS.items():
    filename = f"{output_dir}/arcana_{arcana}.png"
    
    try:
        print(f"Downloading {arcana}... ", end='', flush=True)
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"OK ({len(response.content)} bytes)")
            success += 1
        else:
            print(f"Failed (HTTP {response.status_code})")
            failed += 1
            
        time.sleep(1)  # Be nice to the server
        
    except Exception as e:
        print(f"Error: {e}")
        failed += 1

print(f"\n{'='*50}")
print(f"Success: {success}/{len(TAROT_URLS)}")
print(f"Failed: {failed}/{len(TAROT_URLS)}")
print(f"{'='*50}")
