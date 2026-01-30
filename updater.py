import requests
import json
import zipfile
import os
import shutil
import sys
import io

# --- CONFIGURATION ---
GITHUB_REPO = "Syycc-code/phantom-lib"
# Check version from main branch (raw)
VERSION_URL = f"https://raw.githubusercontent.com/{GITHUB_REPO}/main/version.json"
# Download zip from latest release
UPDATE_ZIP_URL = f"https://github.com/{GITHUB_REPO}/releases/latest/download/update.zip"

# Files/Folders to NEVER overwrite
PROTECTED_PATHS = [
    ".env",
    "backend/phantom_database.db",
    "backend/uploads",
    "phantom_database.db" # Just in case it's in root
]

def get_local_version():
    """Read version from package.json"""
    try:
        with open("package.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("version", "0.0.0")
    except FileNotFoundError:
        print("[!] package.json not found. Assuming version 0.0.0")
        return "0.0.0"

def is_protected(filepath):
    """Check if file path is in protected list"""
    # Normalize path separators
    filepath = filepath.replace("\\", "/")
    for protected in PROTECTED_PATHS:
        if filepath == protected or filepath.startswith(protected + "/"):
            return True
    return False

def check_update():
    print(f"[*] Checking for updates from {GITHUB_REPO}...")
    
    current_version = get_local_version()
    print(f"[*] Current Version: {current_version}")

    try:
        # 1. Fetch remote version info
        response = requests.get(VERSION_URL, timeout=5)
        if response.status_code != 200:
            print(f"[!] Failed to fetch version info (HTTP {response.status_code}). Skipping update.")
            return

        remote_data = response.json()
        remote_version = remote_data.get("version")
        
        if not remote_version:
            print("[!] Invalid remote version data. Skipping.")
            return

        # Simple string comparison (for semantic versioning, ideally use pkg_resources.parse_version)
        # Assuming format "1.0.0"
        if remote_version == current_version:
             print("[*] You are up to date.")
             return

        # Check if remote is actually newer (naive string compare works for simple cases like 1.0.0 vs 1.0.1)
        # Use a simple tuple comparison for better accuracy
        cur_tuple = tuple(map(int, current_version.split('.')))
        rem_tuple = tuple(map(int, remote_version.split('.')))
        
        if rem_tuple <= cur_tuple:
            print("[*] You are up to date.")
            return

        print(f"\n[!!!] NEW VERSION AVAILABLE: {remote_version}")
        print(f"[!!!] Changelog: {remote_data.get('changelog', 'No details provided.')}")
        
        choice = input(f"\nDo you want to update now? This will overwrite system files but keep your data. (y/n): ").strip().lower()
        
        if choice != 'y':
            print("[*] Update cancelled.")
            return

        print(f"[*] Downloading update from {UPDATE_ZIP_URL}...")
        
        # 2. Download Zip
        zip_resp = requests.get(UPDATE_ZIP_URL, stream=True)
        if zip_resp.status_code != 200:
            print(f"[!] Failed to download update file (HTTP {zip_resp.status_code}).")
            return

        # 3. Extract carefully
        print("[*] Installing update...")
        try:
            with zipfile.ZipFile(io.BytesIO(zip_resp.content)) as z:
                # Get list of files in zip
                files = z.namelist()
                for file in files:
                    if is_protected(file):
                        print(f"    [SKIP] Protected file: {file}")
                        continue
                    
                    # Check if it exists locally to see if we are overwriting
                    if os.path.exists(file):
                        # print(f"    [OVERWRITE] {file}")
                        pass
                    
                    # Extract single file
                    z.extract(file, path=".")
            
            print(f"\n[SUCCESS] Updated to version {remote_version}!")
            print("[*] Dependencies might have changed. The startup script will continue shortly.\n")
            
        except zipfile.BadZipFile:
            print("[!] Error: Downloaded file is not a valid zip archive.")
        except Exception as e:
            print(f"[!] Error during installation: {e}")

    except requests.exceptions.RequestException as e:
        print(f"[!] Network error checking updates: {e}")
    except Exception as e:
        print(f"[!] Unexpected error: {e}")

if __name__ == "__main__":
    check_update()
