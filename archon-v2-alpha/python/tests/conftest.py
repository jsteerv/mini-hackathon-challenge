import sys
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import Mock, AsyncMock, patch

# Add src folder to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, 'src')
sys.path.insert(0, SRC_DIR)

# Import in-memory Supabase mock BEFORE importing the server modules
from tests.mocks.in_memory_supabase import (
    get_in_memory_supabase_client, 
    reset_in_memory_supabase
)

# Import the FastAPI application from the server module
from src.server.main import app

@pytest_asyncio.fixture
async def async_client():
    """Async client for testing FastAPI endpoints"""
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

@pytest.fixture 
def sync_client():
    """Sync client for testing non-async endpoints"""
    from fastapi.testclient import TestClient
    with TestClient(app) as tc:
        yield tc

@pytest.fixture
def mock_progress_mapper():
    """Mock ProgressMapper for testing progress tracking"""
    from src.server.services.knowledge.progress_mapper import ProgressMapper
    mapper = Mock(spec=ProgressMapper)
    mapper.map_progress = Mock(side_effect=lambda stage, progress: min(100, max(0, progress)))
    mapper.last_overall_progress = 0
    mapper.current_stage = 'starting'
    return mapper

@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing - DEPRECATED: Use in_memory_supabase_client instead"""
    client = Mock()
    client.table = Mock(return_value=Mock(
        insert=Mock(return_value=Mock(
            execute=Mock(return_value=Mock(data=[]))
        )),
        delete=Mock(return_value=Mock(
            in_=Mock(return_value=Mock(
                execute=Mock(return_value=Mock(data=[]))
            )),
            eq=Mock(return_value=Mock(
                execute=Mock(return_value=Mock(data=[]))
            ))
        )),
        select=Mock(return_value=Mock(
            execute=Mock(return_value=Mock(data=[]))
        ))
    ))
    return client

@pytest.fixture(autouse=True)
def in_memory_supabase_client():
    """
    Automatically patch all Supabase client usage with in-memory mock.
    This fixture runs automatically for all tests to prevent production DB contamination.
    """
    # Reset the in-memory client before each test
    reset_in_memory_supabase()
    
    # Create a comprehensive mock for supabase.create_client to prevent any real connections
    def mock_create_client(*args, **kwargs):
        return get_in_memory_supabase_client()
    
    # Patch all possible ways to get a Supabase client
    with patch('src.server.services.client_manager.get_supabase_client', 
               return_value=get_in_memory_supabase_client()), \
         patch('src.server.utils.get_supabase_client', 
               return_value=get_in_memory_supabase_client()), \
         patch('supabase.create_client', side_effect=mock_create_client), \
         patch('src.server.services.client_manager.create_client', side_effect=mock_create_client):
        
        client = get_in_memory_supabase_client()
        yield client
        
        # Optional: Verify no data is left after test completion
        # Uncomment the next line if you want strict cleanup verification
        # verify_no_production_data()

@pytest.fixture
def mock_crawler():
    """Mock Crawl4AI crawler for testing"""
    crawler = Mock()
    crawler.arun = AsyncMock()
    
    # Mock successful crawl result
    mock_result = Mock()
    mock_result.success = True
    mock_result.url = "https://example.com"
    mock_result.markdown = "# Example Content\n\nThis is test content."
    mock_result.html = "<h1>Example Content</h1><p>This is test content.</p>"
    mock_result.metadata = {"title": "Example Page", "description": "Test page"}
    mock_result.error_message = None
    
    crawler.arun.return_value = mock_result
    return crawler

@pytest.fixture
def mock_socketio():
    """Mock Socket.IO for testing"""
    sio = Mock()
    sio.emit = AsyncMock()
    sio.enter_room = AsyncMock()
    sio.leave_room = AsyncMock()
    return sio
