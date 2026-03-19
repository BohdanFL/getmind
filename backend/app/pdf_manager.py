import os
import time
import hashlib
from google import genai
from google.genai import types
from dotenv import load_dotenv
from .analytics import analytics

load_dotenv()

class PDFManager:
    def __init__(self):
        # The new Google GenAI SDK automatically uses GOOGLE_API_KEY from the environment.
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY is not set.")
        self.client = genai.Client(api_key=api_key)
        # Use a stable model for token counting
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")

    def _get_file_hash(self, file_path: str) -> str:
        """Generates a SHA-256 hash of the file content for deduplication."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _find_existing_file(self, display_name: str):
        """Checks if a file with the given display_name already exists on Google GenAI."""
        try:
            # List files and look for a match
            # Note: We only check the most recent files for efficiency
            for file in self.client.files.list(config={'page_size': 50}):
                if file.display_name == display_name and file.state.name == "ACTIVE":
                    return file
            return None
        except Exception as e:
            print(f"Error listing files from Google: {e}")
            return None

    def upload_pdf(self, file_path: str, display_name: str = None) -> str:
        """
        Uploads a PDF file to Google's servers, checking for duplicates first.
        Uses the file content hash as the display_name to ensure uniqueness.
        """
        try:
            start_time = time.time()
            file_hash = self._get_file_hash(file_path)
            # Use hash as display_name for deduplication
            unique_display_name = f"pdf_hash_{file_hash}"
            
            # 1. Check if file already exists
            existing_file = self._find_existing_file(unique_display_name)
            if existing_file:
                print(f"File already exists on Google: {existing_file.name} (reusing)")
                return existing_file.name

            print(f"Uploading new file {file_path} to Google GenAI...")
            
            # 2. Read file data once for both counting and uploading
            with open(file_path, 'rb') as f:
                file_data = f.read()

            # 3. Count tokens
            token_count_resp = self.client.models.count_tokens(
                model=self.model_id,
                contents=[types.Part.from_bytes(data=file_data, mime_type='application/pdf')]
            )
            input_tokens = token_count_resp.total_tokens

            # 4. Perform the upload with a simple retry
            max_retries = 2
            uploaded_file = None
            for attempt in range(max_retries + 1):
                try:
                    uploaded_file = self.client.files.upload(
                        file=file_path,
                        config=types.UploadFileConfig(
                            display_name=unique_display_name
                        )
                    )

                    break 
                except Exception as upload_err:
                    if attempt < max_retries:
                        print(f"Upload attempt {attempt + 1} failed: {upload_err}. Retrying...")
                        time.sleep(2)
                    else:
                        raise upload_err
            
            end_time = time.time()
            latency_ms = int((end_time - start_time) * 1000)
            
            if uploaded_file:
                print(f"Successfully uploaded: {uploaded_file.name}")
                
                # 5. Log the usage
                analytics.log_usage(
                    operation_type="file_upload",
                    model_id=self.model_id,
                    input_tokens=input_tokens,
                    latency_ms=latency_ms,
                    extra_metadata={
                        "file_name": os.path.basename(file_path),
                        "google_file_id": uploaded_file.name,
                        "hash": file_hash
                    }
                )
                return uploaded_file.name
            
            return None
            
        except Exception as e:
            print(f"Error in upload_pdf: {e}")
            return None
