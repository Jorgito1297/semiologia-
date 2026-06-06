import os
import requests

SUPABASE_URL = "https://xbtrryflwesqdwqfbqtr.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_SqVtyvgm3npF4jldXXB7CQ_v44V9B8N" # From .env file

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
}

def check_chunks():
    print("--- CONTENT CHUNKS ANALYSIS ---")
    url = f"{SUPABASE_URL}/rest/v1/content_chunks?select=block,is_active,cg_competencies"
    try:
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"Total chunks retrieved: {len(data)}")
            
            cgs = set()
            blocks = {}
            for item in data:
                # CGs
                item_cgs = item.get("cg_competencies")
                if isinstance(item_cgs, list):
                    for cg in item_cgs:
                        cgs.add(cg)
                elif isinstance(item_cgs, str):
                    # In case it's string format like '{CG6,CG2}'
                    clean = item_cgs.replace("{", "").replace("}", "").split(",")
                    for cg in clean:
                        cgs.add(cg.strip())
                
                # Blocks
                b = item.get("block")
                act = item.get("is_active")
                if act:
                    blocks[b] = blocks.get(b, 0) + 1
            
            print(f"Unique Genic Competencies (CGs) in DB: {sorted(list(cgs))}")
            print(f"Active chunks by block: {blocks}")
        else:
            print(f"Failed to fetch content_chunks: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Exception checking chunks: {e}")

def check_students():
    print("\n--- STUDENTS ANALYSIS ---")
    url = f"{SUPABASE_URL}/rest/v1/students?select=id"
    try:
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"Total students registered: {len(data)}")
        else:
            print(f"Failed to fetch students: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Exception checking students: {e}")

if __name__ == "__main__":
    check_chunks()
    check_students()
