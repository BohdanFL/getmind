import pytest
from httpx import AsyncClient
import os
import io

@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to GetMind API"}

@pytest.mark.asyncio
async def test_upload_pdf_invalid_type(async_client: AsyncClient):
    # Try uploading a text file
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    response = await async_client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_pdf_success(async_client: AsyncClient, mocker):
    # Mock the background task logic to avoid actual Google GenAI calls
    mocker.patch("main.pdf_manager.upload_pdf", return_value="mock_google_file_name")
    
    pdf_content = b"%PDF-1.4 test content"
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}
    
    response = await async_client.post("/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "file_id" in data
    assert data["message"] == "Processing started"
    
    file_id = data["file_id"]
    # Check status
    response = await async_client.get(f"/upload/status/{file_id}")
    assert response.status_code == 200
    # Status might be "started" or "completed" depending on how fast the task runs 
    # (though in tests it's usually synchronous or we mock it)
    assert response.json()["status"] in ["started", "completed", "loading"]

@pytest.mark.asyncio
async def test_chat_endpoint_basic(async_client: AsyncClient, mocker):
    # Mock tutor's streaming response
    async def mock_streaming_gen(*args, **kwargs):
        yield "Привіт"
        yield "!"
        
    mocker.patch("main.tutor.get_streaming_response", side_effect=mock_streaming_gen)
    
    chat_data = {
        "message": "Привіт",
        "history": [],
        "file_id": "test_id"
    }
    
    response = await async_client.post("/chat", json=chat_data)
    assert response.status_code == 200
    assert response.text == "Привіт!"
