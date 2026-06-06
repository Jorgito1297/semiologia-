import os
import requests

def load_env_file(filepath=".env"):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()

load_env_file(".env")
supabase_url = os.environ.get("SUPABASE_URL")
supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_anon_key:
    print("Error: Supabase config not found in .env")
else:
    headers = {
        "apikey": supabase_anon_key,
        "Authorization": f"Bearer {supabase_anon_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{supabase_url}/rest/v1/profiles?select=*"
    response = requests.get(url, headers=headers)
    
    print("Status code:", response.status_code)
    print("Response text:", response.text)
