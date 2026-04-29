import os
import httpx
from typing import List
from langchain_text_splitters import MarkdownHeaderTextSplitter

class DocumentIngestor:
    """
    Handles the ingestion of PDF documents, converting them to Markdown 
    using the Datalab API (Marker), and splitting them into structural chunks.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("DATALAB_API_KEY")
        self.datalab_url = "https://www.datalab.to/api/v1/convert"
        
        # Configure LangChain splitter
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        self.markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on,
            strip_headers=True
        )

    async def convert_pdf_to_markdown(self, file_path: str) -> str:
        """
        Sends a PDF file to the Datalab API, polls for completion, 
        and returns the extracted Markdown.
        """
        if not self.api_key:
            raise ValueError("DATALAB_API_KEY is not set.")

        headers = {"X-API-Key": self.api_key}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Submit the conversion request
                with open(file_path, "rb") as f:
                    files = {"file": (os.path.basename(file_path), f, "application/pdf")}
                    # Documentation says we use 'data' for payload, but multipart/form-data handles files
                    # We'll stick to a simple accurate mode for better results
                    data = {"mode": "accurate", "output_format": "markdown"}
                    
                    response = await client.post(
                        self.datalab_url,
                        headers=headers,
                        files=files,
                        data=data
                    )
                
                response.raise_for_status()
                submit_data = response.json()
                
                if not submit_data.get("success"):
                    raise Exception(f"Datalab API submission failed: {submit_data.get('error')}")
                
                request_id = submit_data.get("request_id")
                check_url = f"https://www.datalab.to/api/v1/convert/{request_id}"
                
                # 2. Polling for the result
                import asyncio
                max_retries = 60 # 5 minutes max (5s * 60)
                for _ in range(max_retries):
                    status_response = await client.get(check_url, headers=headers)
                    status_response.raise_for_status()
                    result_data = status_response.json()
                    
                    status = result_data.get("status")
                    if status == "complete":
                        if not result_data.get("success"):
                            raise Exception(f"Datalab conversion failed: {result_data.get('error')}")
                        return result_data.get("markdown", "")
                    elif status == "error":
                        raise Exception(f"Datalab conversion error: {result_data.get('error')}")
                    
                    # Wait 5 seconds before next poll
                    await asyncio.sleep(5)
                
                raise Exception("Datalab API conversion timed out.")
                
        except httpx.HTTPStatusError as e:
            raise Exception(f"Datalab API error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise Exception(f"Failed to convert PDF: {e}")

    def split_markdown(self, markdown_text: str) -> List[any]:
        """
        Splits Markdown text into chunks based on headers.
        Returns a list of LangChain Document objects.
        """
        return self.markdown_splitter.split_text(markdown_text)
