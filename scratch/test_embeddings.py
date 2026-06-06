import os
from google import genai
from google.genai import types

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
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found.")
else:
    client = genai.Client(api_key=api_key)
    for model_name in ["models/gemini-embedding-001", "models/gemini-embedding-2"]:
        try:
            print(f"Testing {model_name} with output_dimensionality=1536...")
            # Wait, let's see if google-genai SDK uses output_dimensionality in embed_content
            # We can check using config object
            config = types.EmbedContentConfig(output_dimensionality=1536)
            response = client.models.embed_content(
                model=model_name,
                contents="Hola Mundo de la Semiología Médica",
                config=config
            )
            emb_list = response.embeddings
            first_val = emb_list[0].values
            print(f"  Success! Dimension: {len(first_val)}")
            print(f"  First 3 values: {first_val[:3]}")
        except Exception as e:
            print(f"  Error: {e}")
