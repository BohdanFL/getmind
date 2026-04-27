import pytest
import json
from app.tutor import SocraticTutor
from app.schemas import SocraticResponse

@pytest.mark.asyncio
async def test_get_structured_response_success(mocker):
    tutor = SocraticTutor()
    
    # Mock response
    mock_response = mocker.Mock()
    mock_response.text = json.dumps({
        "thought_process": "Studying the request",
        "response_text": "How do you think it works?",
        "hints": [{"hint": "Look at the source", "reasoning": "Standard approach"}],
        "is_discovered": False
    })
    
    mocker.patch.object(tutor.client.aio.models, 'generate_content', return_value=mock_response)
    mocker.patch('app.analytics.analytics.log_usage_async', return_value=None)
    
    response = await tutor.get_structured_response(
        prompt="Tell me about gravity", 
        response_schema=SocraticResponse
    )
    
    assert isinstance(response, SocraticResponse)
    assert response.response_text == "How do you think it works?"
    assert len(response.hints) == 1

@pytest.mark.asyncio
async def test_get_streaming_structured_response_success(mocker):
    tutor = SocraticTutor()
    
    # Chunks are partial JSON
    chunk1 = '{"thought_process": "thinking", '
    chunk2 = '"response_text": "Hello", '
    chunk3 = '"hints": [], "is_discovered": false}'
    
    mock_stream = mocker.AsyncMock()
    mock_chunk_1 = mocker.Mock(text=chunk1, usage_metadata=None, candidates=[mocker.Mock(finish_reason=None)])
    mock_chunk_2 = mocker.Mock(text=chunk2, usage_metadata=None, candidates=[mocker.Mock(finish_reason=None)])
    mock_chunk_3 = mocker.Mock(text=chunk3, usage_metadata=mocker.Mock(prompt_token_count=10, candidates_token_count=5), candidates=[mocker.Mock(finish_reason="STOP")])
    
    mock_stream.__aiter__.return_value = [mock_chunk_1, mock_chunk_2, mock_chunk_3]
    
    mocker.patch.object(tutor.client.aio.models, 'generate_content_stream', return_value=mock_stream)
    mocker.patch('app.analytics.analytics.log_usage_async', return_value=None)
    
    # Collect chunks
    received_chunks = []
    async for chunk in tutor.get_streaming_structured_response("Hello", SocraticResponse):
        received_chunks.append(chunk)
    
    # The tutor should probably yield strings (partial JSON or full JSON) 
    # but the final result should be valid JSON
    full_json = "".join(received_chunks)
    data = json.loads(full_json)
    assert data["response_text"] == "Hello"
    assert data["is_discovered"] is False
