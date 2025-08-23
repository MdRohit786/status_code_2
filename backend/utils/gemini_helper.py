import os
import base64
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_tags(text=None, photo=None):
    prompt = "Generate only 1 or 2 word tags (comma separated, no sentences)."

    if text and not photo:
        response = genai.GenerativeModel("gemini-1.5-flash").generate_content(
            [text, prompt]
        )
        return [tag.strip() for tag in response.text.split(",") if tag.strip()]

    elif photo:
        image_b64 = base64.b64encode(photo.read()).decode("utf-8")
        photo.seek(0)  

        parts = []
        parts.append({"mime_type": "image/jpeg", "data": image_b64})
        if text:
            parts.append({"text": text})
        parts.append({"text": prompt})

        response = genai.GenerativeModel("gemini-1.5-flash").generate_content(parts)

        return [tag.strip() for tag in response.text.split(",") if tag.strip()]

    return []
