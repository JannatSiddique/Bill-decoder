#!/usr/bin/env python3
"""Quick test to see actual Gemini API error."""
from pathlib import Path
import google.genai as genai
from PIL import Image
from config import API_KEY, MODEL_NAME

print(f"Testing Gemini API...")
print(f"Model: {MODEL_NAME}")
print("API Key: loaded")

# Load image
image_path = Path("../train/bills/KESC_0008.png")
if not image_path.exists():
    print(f"ERROR: {image_path} not found")
    exit(1)

img = Image.open(image_path)
print(f"Loaded image: {image_path.name} ({img.size})")

client = genai.Client(api_key=API_KEY)

try:
    # Simple format: [text, PIL Image]
    print("Trying format: [text, image]...")
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=["What is this bill about? Answer in 1 sentence.", img]
    )
    print(f"SUCCESS!")
    print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {str(e)[:200]}")
