print("DEBUG: Starting script")
import sys
import os
print(f"DEBUG: Python version: {sys.version}")
print(f"DEBUG: CWD: {os.getcwd()}")
try:
    import google.genai
    print("DEBUG: google.genai imported")
    from dotenv import load_dotenv
    load_dotenv()
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    print(f"DEBUG: API Key present: {bool(key)}")
except Exception as e:
    print(f"DEBUG: Import error: {e}")

print("DEBUG: End of script")
