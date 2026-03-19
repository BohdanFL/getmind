import pytest
from app.tutor import SocraticTutor

def test_parse_quota_error():
    tutor = SocraticTutor()
    
    # Test case 1: Standard JSON error with retryDelay
    error_msg = '{"error": {"details": [{"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "45s"}]}}'
    assert tutor._parse_quota_error(error_msg) == "45s"
    
    # Test case 2: Python-style dictionary representation (SDK legacy)
    error_msg = "429 Too Many Requests. {'message': '{\"error\": {\"message\": \"retry in 15.5s\"}}'}"
    assert tutor._parse_quota_error(error_msg) == "15.5s"

    # Test case 3: Raw string fallback
    error_msg = "Random error retry in 10s message"
    assert tutor._parse_quota_error(error_msg) == "10s"

    # Test case 4: Default fallback
    assert tutor._parse_quota_error("something went wrong") == "60s"

def test_classify_error():
    tutor = SocraticTutor()
    
    # 429 Error
    action, message = tutor._classify_error(Exception("429 RESOURCE_EXHAUSTED"), 0, 0, 3)
    assert action == "stop"
    assert "Ліміт запитів вичерпано" in message

    # Connection issue (Retryable)
    action, message = tutor._classify_error(Exception("Connection reset by peer"), 0, 0, 3)
    assert action == "retry"

    # Connection issue (Last attempt)
    action, message = tutor._classify_error(Exception("Connection reset by peer"), 0, 2, 3)
    assert action == "fail" # Last attempt failed

    # Interrupted stream
    action, message = tutor._classify_error(Exception("Reset"), 5, 0, 3)
    assert action == "stop"
    assert "Зв'язок перервано" in message

@pytest.mark.asyncio
async def test_get_streaming_response_success(mocker):
    tutor = SocraticTutor()
    
    # Mocking the genai client response
    mock_response = mocker.AsyncMock()
    mock_chunk_1 = mocker.Mock(text="Привіт", usage_metadata=None, candidates=[mocker.Mock(finish_reason=None)])
    mock_chunk_2 = mocker.Mock(text=", як справи?", usage_metadata=mocker.Mock(prompt_token_count=10, candidates_token_count=5), candidates=[mocker.Mock(finish_reason="STOP")])
    
    # Async iterator mock
    mock_response.__aiter__.return_value = [mock_chunk_1, mock_chunk_2]
    
    mocker.patch.object(tutor.client.aio.models, 'generate_content_stream', return_value=mock_response)
    # Mock analytics to avoid DB calls
    mocker.patch('app.analytics.analytics.log_usage_async', return_value=None)
    
    # Run the generator
    results = []
    async for chunk in tutor.get_streaming_response([], None, "Хеллоу"):
        results.append(chunk)

    assert "".join(results) == "Привіт, як справи?"
