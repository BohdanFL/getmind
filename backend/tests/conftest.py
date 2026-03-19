import pytest
from httpx import AsyncClient, ASGITransport
from main import app # Correct based on file structure

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
