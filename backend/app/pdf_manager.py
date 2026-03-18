import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class PDFManager:
    def __init__(self):
        # The new Google GenAI SDK automatically uses GOOGLE_API_KEY from the environment.
        # Ensure it's set in your .env file.
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY is not set.")
        self.client = genai.Client(api_key=api_key)

    def upload_pdf(self, file_path: str, display_name: str = None) -> str:
        """
        Uploads a PDF file directly to Google's servers for Native Context Caching.
        Instead of chunking and vectorizing locally, we rely on Gemini's 1M+ multimodal context window.
        Returns the unique file.name string (e.g., 'files/abc123xyz') which can be passed to the chat model.
        """
        try:
            print(f"Uploading {file_path} to Google GenAI Files API...")
            
            # The Files API handles PDF documents natively
            uploaded_file = self.client.files.upload(
                file=file_path,
                config=types.UploadFileConfig(
                    display_name=display_name
                )
            )
            
            print(f"Successfully uploaded as: {uploaded_file.name}")
            return uploaded_file.name
            
        except Exception as e:
            print(f"Error uploading PDF to Google: {e}")
            return None
