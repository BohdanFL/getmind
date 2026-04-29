import pytest
from unittest.mock import patch, MagicMock
from app.extraction import ExtractionService
from app.schemas import KnowledgeGraph, ConceptNode, GraphEdge
from langchain_core.documents import Document

@pytest.fixture
def dummy_chunks():
    return [
        Document(page_content="Machine learning is a field of AI.", metadata={"Header 1": "Introduction"}),
        Document(page_content="Neural networks are used in deep learning.", metadata={"Header 1": "Deep Learning"})
    ]

@pytest.fixture
def mock_knowledge_graph():
    return KnowledgeGraph(
        nodes=[
            ConceptNode(id="machine_learning", label="Machine Learning", summary="A field of AI.", page_anchor=1, hl_text="Machine learning is a field of AI.", level="fundamental", cluster="Introduction"),
            ConceptNode(id="neural_networks", label="Neural Networks", summary="Used in deep learning.", page_anchor=1, hl_text="Neural networks are used in deep learning.", level="intermediate", cluster="Deep Learning")
        ],
        edges=[
            GraphEdge(source="machine_learning", target="neural_networks", relationship="parent_child", strength=0.8)
        ]
    )

@pytest.mark.asyncio
async def test_extract_skeleton(dummy_chunks, mock_knowledge_graph):
    service = ExtractionService()
    
    with patch("app.extraction.genai.Client") as MockClient:
        # Setup mock GenAI client
        mock_client_instance = MagicMock()
        MockClient.return_value = mock_client_instance
        
        # Mock the async generate_content
        mock_response = MagicMock()
        mock_response.text = mock_knowledge_graph.model_dump_json()
        
        # In the real SDK, generate_content is async if accessed via aio
        # mock_client_instance.aio.models.generate_content.return_value = mock_response
        
        # We need an AsyncMock for aio.models.generate_content
        from unittest.mock import AsyncMock
        mock_client_instance.aio.models.generate_content = AsyncMock(return_value=mock_response)
        
        # Replace the client in our service with the mock
        service.client = mock_client_instance

        # Execute
        result = await service.extract_skeleton(dummy_chunks)

        # Assertions
        assert isinstance(result, KnowledgeGraph)
        assert len(result.nodes) == 2
        assert len(result.edges) == 1
        assert result.nodes[0].id == "machine_learning"
        
        # Check if generate_content was called with correct parameters
        mock_client_instance.aio.models.generate_content.assert_called_once()
        call_args = mock_client_instance.aio.models.generate_content.call_args
        
        assert "machine learning" in call_args.kwargs['contents'].lower()

@pytest.mark.asyncio
async def test_extract_skeleton_filters_invalid_edges(dummy_chunks, mock_knowledge_graph):
    # Setup graph with an invalid edge
    invalid_graph = mock_knowledge_graph.model_copy()
    invalid_graph.edges.append(GraphEdge(source="machine_learning", target="non_existent_node", relationship="relates_to", strength=0.5))
    
    service = ExtractionService()
    
    with patch("app.extraction.genai.Client") as MockClient:
        mock_client_instance = MagicMock()
        MockClient.return_value = mock_client_instance
        
        mock_response = MagicMock()
        mock_response.text = invalid_graph.model_dump_json()
        
        from unittest.mock import AsyncMock
        mock_client_instance.aio.models.generate_content = AsyncMock(return_value=mock_response)
        service.client = mock_client_instance

        # Execute
        result = await service.extract_skeleton(dummy_chunks)

        # Here we check if our service handled the invalid edge.
        assert len(result.edges) == 1
        assert result.edges[0].target == "neural_networks"
