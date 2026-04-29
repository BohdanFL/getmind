import pytest
from unittest.mock import patch, MagicMock
from app.ingestion.pdf_parser import DocumentIngestor

@pytest.fixture
def mock_datalab_submit_response():
    return {
        "success": True,
        "request_id": "test_request_123",
        "request_check_url": "https://www.datalab.to/api/v1/convert/test_request_123"
    }

@pytest.fixture
def mock_datalab_result_response():
    return {
        "status": "complete",
        "success": True,
        "markdown": "# Header 1\n\nSome introductory text.\n\n## Subheader 1.1\n\nMore details here.\n\n# Header 2\n\nAnother main section."
    }

@pytest.mark.asyncio
async def test_convert_pdf_to_markdown_success(mock_datalab_submit_response, mock_datalab_result_response):
    ingestor = DocumentIngestor(api_key="test_key")
    
    # Mock both POST and GET
    with patch("httpx.AsyncClient.post") as mock_post, \
         patch("httpx.AsyncClient.get") as mock_get, \
         patch("builtins.open", MagicMock()):
        
        # 1. Mock Submission POST
        mock_submit_res = MagicMock()
        mock_submit_res.status_code = 200
        mock_submit_res.json.return_value = mock_datalab_submit_response
        mock_post.return_value = mock_submit_res

        # 2. Mock Result GET (polling)
        mock_result_res = MagicMock()
        mock_result_res.status_code = 200
        mock_result_res.json.return_value = mock_datalab_result_response
        mock_get.return_value = mock_result_res

        # Execute
        result = await ingestor.convert_pdf_to_markdown("dummy/path/test.pdf")

        # Assertions
        assert result == mock_datalab_result_response["markdown"]
        mock_post.assert_called_once()
        mock_get.assert_called_once() # Called once because status is "complete" immediately in our mock
        assert "v1/convert" in mock_post.call_args[0][0]
        assert "test_request_123" in mock_get.call_args[0][0]

@pytest.mark.asyncio
async def test_convert_pdf_to_markdown_error():
    ingestor = DocumentIngestor(api_key="test_key")
    
    with patch("httpx.AsyncClient.post") as mock_post, patch("builtins.open", MagicMock()) as mock_open:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        
        # Here we mock httpx.HTTPStatusError
        import httpx
        mock_request = httpx.Request("POST", "https://datalab.to/api/v1/marker")
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Internal Server Error", request=mock_request, response=mock_response
        )
        
        mock_post.return_value = mock_response

        # We expect an exception or a specific error handling behavior
        with pytest.raises(Exception, match="Datalab API error"):
            await ingestor.convert_pdf_to_markdown("dummy/path/test.pdf")

def test_split_markdown():
    ingestor = DocumentIngestor(api_key="test_key")
    markdown_text = """# Header 1
Some text under header 1.

## Subheader 1.1
Details.

# Header 2
Text under header 2.
"""
    
    # Execute
    chunks = ingestor.split_markdown(markdown_text)
    
    # Assertions
    assert len(chunks) == 3
    
    # Check if metadata is preserved correctly
    assert "Header 1" in chunks[0].metadata
    assert chunks[0].metadata["Header 1"] == "Header 1"
    assert chunks[0].page_content.strip() == "Some text under header 1."
    
    assert "Header 1" in chunks[1].metadata
    assert "Header 2" in chunks[1].metadata
    assert chunks[1].metadata["Header 2"] == "Subheader 1.1"
    assert chunks[1].page_content.strip() == "Details."
    
    assert "Header 1" in chunks[2].metadata
    assert chunks[2].metadata["Header 1"] == "Header 2"
    assert chunks[2].page_content.strip() == "Text under header 2."
