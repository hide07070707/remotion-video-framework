import google.generativeai as genai
import os
from dotenv import load_dotenv
load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-1.5-flash')
try:
    response = model.generate_content("Draw a cute cat", generation_config={"response_mime_type": "image/jpeg"}) # Fake config to see if it triggers image gen or fails
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
