import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from .analytics import analytics
import time

load_dotenv()

class PDFManager:
    def __init__(self):
        # The new Google GenAI SDK automatically uses GOOGLE_API_KEY from the environment.
        # Ensure it's set in your .env file.
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY is not set.")
        self.client = genai.Client(api_key=api_key)
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-1.5-flash") # Use standard model for counting

    def upload_pdf(self, file_path: str, display_name: str = None) -> str:
        """
        Uploads a PDF file directly to Google's servers for Native Context Caching.
        Instead of chunking and vectorizing locally, we rely on Gemini's 1M+ multimodal context window.
        Returns the unique file.name string (e.g., 'files/abc123xyz') which can be passed to the chat model.
        """
        try:
            start_time = time.time()
            print(f"Uploading {file_path} to Google GenAI Files API...")
            
            # 1. Count tokens first to know the cost/size
            # We use the Gemini 1.5 Flash model as a reference for counting
            token_count_resp = self.client.models.count_tokens(
                model=self.model_id,
                contents=[types.Part.from_bytes(data=open(file_path, 'rb').read(), mime_type='application/pdf')]
            )
            input_tokens = token_count_resp.total_tokens
            
            # 2. Perform the upload
            uploaded_file = self.client.files.upload(
                file=file_path,
                config=types.UploadFileConfig(
                    display_name=display_name
                )
            )
            
            end_time = time.time()
            latency_ms = int((end_time - start_time) * 1000)
            
            print(f"Successfully uploaded as: {uploaded_file.name}")
            
            # 3. Log the usage
            analytics.log_usage(
                operation_type="file_upload",
                model_id=self.model_id,
                input_tokens=input_tokens,
                latency_ms=latency_ms,
                extra_metadata={
                    "file_name": os.path.basename(file_path),
                    "google_file_id": uploaded_file.name,
                    "mime_type": "application/pdf"
                }
            )
            
            return uploaded_file.name
            
        except Exception as e:
            print(f"Error uploading PDF to Google: {e}")
            return None
