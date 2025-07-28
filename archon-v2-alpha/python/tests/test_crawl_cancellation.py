"""
Test Crawl Cancellation

This test suite verifies that crawl operations can be properly cancelled
and that all resources are cleaned up correctly.
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
import uuid

from src.server.fastapi.knowledge_api import (
    stop_crawl_task,
    active_crawl_tasks,
    _perform_crawl_with_progress,
    KnowledgeItemRequest
)
from src.server.services.knowledge.crawl_orchestration_service import (
    CrawlOrchestrationService,
    get_active_orchestration,
    register_orchestration,
    unregister_orchestration,
    _active_orchestrations
)


class TestCrawlCancellation:
    """Test suite for crawl cancellation functionality"""
    
    @pytest.fixture
    def mock_crawler(self):
        """Create a mock Crawl4AI crawler"""
        crawler = Mock()
        crawler.arun = AsyncMock()
        
        # Mock crawl result that simulates a long-running operation
        async def mock_crawl(*args, **kwargs):
            # Simulate a long-running crawl
            await asyncio.sleep(10)
            result = Mock()
            result.success = True
            result.url = "https://example.com"
            result.markdown = "# Test Content"
            return result
        
        crawler.arun.side_effect = mock_crawl
        return crawler
    
    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client"""
        client = Mock()
        client.table = Mock(return_value=Mock(
            insert=Mock(return_value=Mock(
                execute=Mock(return_value=Mock(data=[]))
            ))
        ))
        return client
    
    @pytest.fixture
    def mock_sio(self):
        """Create a mock Socket.IO instance"""
        sio = AsyncMock()
        sio.emit = AsyncMock()
        return sio
    
    @pytest.mark.asyncio
    async def test_stop_endpoint_cancels_orchestration_and_task(self, mock_sio):
        """Test that the stop endpoint cancels both orchestration and asyncio task"""
        progress_id = str(uuid.uuid4())
        
        # Create mock orchestration service
        mock_orchestration = Mock(spec=CrawlOrchestrationService)
        mock_orchestration.cancel = Mock()
        mock_orchestration._cancelled = False
        
        # Register the orchestration
        _active_orchestrations[progress_id] = mock_orchestration
        
        # Create a mock asyncio task
        mock_task = AsyncMock()
        mock_task.done.return_value = False
        mock_task.cancel = Mock()
        active_crawl_tasks[progress_id] = mock_task
        
        # Mock the Socket.IO instance
        with patch('src.server.fastapi.knowledge_api.sio', mock_sio):
            # Call stop endpoint
            result = await stop_crawl_task(progress_id)
        
        # Verify orchestration was cancelled
        mock_orchestration.cancel.assert_called_once()
        
        # Verify asyncio task was cancelled
        mock_task.cancel.assert_called_once()
        
        # Verify task was removed from active_crawl_tasks
        assert progress_id not in active_crawl_tasks
        
        # Verify orchestration was unregistered
        assert progress_id not in _active_orchestrations
        
        # Verify Socket.IO event was emitted
        mock_sio.emit.assert_called_with(
            'crawl:stopped',
            {
                'progressId': progress_id,
                'status': 'cancelled',
                'message': 'Crawl cancelled by user',
                'timestamp': mock_sio.emit.call_args[0][1]['timestamp']
            },
            room=progress_id
        )
        
        # Verify response
        assert result['success'] is True
        assert result['progressId'] == progress_id
    
    @pytest.mark.asyncio
    async def test_perform_crawl_stores_current_task(self, mock_crawler, mock_supabase_client):
        """Test that _perform_crawl_with_progress stores the current task"""
        progress_id = str(uuid.uuid4())
        
        # Create a test request
        request = KnowledgeItemRequest(
            url="https://example.com",
            knowledge_type="technical",
            tags=["test"],
            max_depth=1
        )
        
        # Mock dependencies
        with patch('src.server.fastapi.knowledge_api.get_crawler', AsyncMock(return_value=mock_crawler)):
            with patch('src.server.fastapi.knowledge_api.get_supabase_client', Mock(return_value=mock_supabase_client)):
                with patch('src.server.fastapi.knowledge_api.CrawlOrchestrationService') as MockOrchestrationService:
                    # Create mock orchestration service
                    mock_orchestration = Mock()
                    mock_orchestration.set_progress_id = Mock()
                    mock_orchestration.orchestrate_crawl = AsyncMock(return_value={'task_id': 'test-task'})
                    MockOrchestrationService.return_value = mock_orchestration
                    
                    # Start the crawl in a task
                    crawl_task = asyncio.create_task(_perform_crawl_with_progress(progress_id, request))
                    
                    # Give it a moment to start and store the task
                    await asyncio.sleep(1.5)  # Wait for initial sleep in _perform_crawl_with_progress
                    
                    # Verify task was stored
                    assert progress_id in active_crawl_tasks
                    assert active_crawl_tasks[progress_id] == crawl_task
                    
                    # Cancel the task to clean up
                    crawl_task.cancel()
                    try:
                        await crawl_task
                    except asyncio.CancelledError:
                        pass
    
    @pytest.mark.asyncio
    async def test_orchestration_service_cancellation(self, mock_crawler, mock_supabase_client):
        """Test that CrawlOrchestrationService properly handles cancellation"""
        progress_id = str(uuid.uuid4())
        
        # Create orchestration service
        orchestration = CrawlOrchestrationService(
            crawler=mock_crawler,
            supabase_client=mock_supabase_client,
            progress_id=progress_id
        )
        
        # Register it
        register_orchestration(progress_id, orchestration)
        
        # Verify it's registered
        assert get_active_orchestration(progress_id) == orchestration
        
        # Cancel it
        orchestration.cancel()
        
        # Verify cancellation state
        assert orchestration.is_cancelled() is True
        
        # Test that _check_cancellation raises CancelledError
        with pytest.raises(asyncio.CancelledError):
            orchestration._check_cancellation()
        
        # Unregister
        unregister_orchestration(progress_id)
        assert get_active_orchestration(progress_id) is None
    
    @pytest.mark.asyncio
    async def test_concurrent_cancellations(self, mock_sio):
        """Test handling of multiple simultaneous cancellations"""
        progress_ids = [str(uuid.uuid4()) for _ in range(5)]
        
        # Create multiple active crawls
        for progress_id in progress_ids:
            # Mock orchestration
            mock_orchestration = Mock(spec=CrawlOrchestrationService)
            mock_orchestration.cancel = Mock()
            _active_orchestrations[progress_id] = mock_orchestration
            
            # Mock task
            mock_task = AsyncMock()
            mock_task.done.return_value = False
            mock_task.cancel = Mock()
            active_crawl_tasks[progress_id] = mock_task
        
        # Cancel all crawls concurrently
        with patch('src.server.fastapi.knowledge_api.sio', mock_sio):
            cancel_tasks = [
                stop_crawl_task(progress_id)
                for progress_id in progress_ids
            ]
            results = await asyncio.gather(*cancel_tasks, return_exceptions=True)
        
        # Verify all were successful
        for result in results:
            assert isinstance(result, dict)
            assert result['success'] is True
        
        # Verify all tasks and orchestrations were cleaned up
        for progress_id in progress_ids:
            assert progress_id not in active_crawl_tasks
            assert progress_id not in _active_orchestrations
    
    @pytest.mark.asyncio
    async def test_stop_nonexistent_crawl(self, mock_sio):
        """Test stopping a crawl that doesn't exist"""
        progress_id = str(uuid.uuid4())
        
        # Ensure nothing is registered
        assert progress_id not in _active_orchestrations
        assert progress_id not in active_crawl_tasks
        
        # Try to stop it
        with patch('src.server.fastapi.knowledge_api.sio', mock_sio):
            result = await stop_crawl_task(progress_id)
        
        # Should still succeed (graceful handling)
        assert result['success'] is True
        
        # Socket.IO event should still be emitted
        mock_sio.emit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cancelled_task_cleanup(self, mock_crawler, mock_supabase_client):
        """Test that cancelled tasks are properly cleaned up from active_crawl_tasks"""
        progress_id = str(uuid.uuid4())
        
        # Create a test request
        request = KnowledgeItemRequest(
            url="https://example.com",
            knowledge_type="technical"
        )
        
        # Mock to make orchestrate_crawl raise CancelledError
        with patch('src.server.fastapi.knowledge_api.get_crawler', AsyncMock(return_value=mock_crawler)):
            with patch('src.server.fastapi.knowledge_api.get_supabase_client', Mock(return_value=mock_supabase_client)):
                with patch('src.server.fastapi.knowledge_api.CrawlOrchestrationService') as MockOrchestrationService:
                    mock_orchestration = Mock()
                    mock_orchestration.set_progress_id = Mock()
                    mock_orchestration.orchestrate_crawl = AsyncMock(
                        side_effect=asyncio.CancelledError("Cancelled by test")
                    )
                    MockOrchestrationService.return_value = mock_orchestration
                    
                    # Run the crawl
                    await _perform_crawl_with_progress(progress_id, request)
                    
                    # Verify task was cleaned up
                    assert progress_id not in active_crawl_tasks