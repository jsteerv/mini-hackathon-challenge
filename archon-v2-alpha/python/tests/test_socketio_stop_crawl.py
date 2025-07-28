"""Test Socket.IO stop crawl events."""
import pytest
from unittest.mock import Mock, patch, AsyncMock

from src.server.fastapi.socketio_handlers import (
    sio,
    crawl_stop
)

@pytest.mark.asyncio
class TestSocketIOStopCrawl:
    """Test Socket.IO stop crawl functionality."""
    
    async def test_crawl_stop_event_emits_stopping_status(self):
        """Test that crawl_stop event immediately emits crawl:stopping."""
        # Mock Socket.IO emit
        with patch.object(sio, 'emit', new_callable=AsyncMock) as mock_emit:
            # Mock orchestration
            with patch('src.server.fastapi.socketio_handlers.get_active_orchestration') as mock_get_orch:
                mock_orch = Mock()
                mock_get_orch.return_value = mock_orch
                
                # Call crawl_stop
                result = await crawl_stop('test-sid', {'progress_id': 'test-progress-123'})
                
                # Verify crawl:stopping was emitted
                calls = mock_emit.call_args_list
                assert len(calls) >= 1
                
                # Check first call is crawl:stopping
                first_call = calls[0]
                assert first_call[0][0] == 'crawl:stopping'
                assert first_call[0][1]['progressId'] == 'test-progress-123'
                assert first_call[0][1]['message'] == 'Stopping crawl operation...'
                assert 'timestamp' in first_call[0][1]
                assert first_call[1]['room'] == 'test-progress-123'
                
                # Verify orchestration was cancelled
                mock_orch.cancel.assert_called_once()
                
                # Verify success response
                assert result['success'] is True
                assert result['progressId'] == 'test-progress-123'
    
    async def test_crawl_stop_event_emits_stopped_after_cancellation(self):
        """Test that crawl_stop event emits crawl:stopped after cancellation."""
        # Mock Socket.IO emit
        with patch.object(sio, 'emit', new_callable=AsyncMock) as mock_emit:
            # Mock orchestration
            with patch('src.server.fastapi.socketio_handlers.get_active_orchestration') as mock_get_orch:
                mock_orch = Mock()
                mock_get_orch.return_value = mock_orch
                
                # Call crawl_stop
                await crawl_stop('test-sid', {'progress_id': 'test-progress-123'})
                
                # Verify both events were emitted
                calls = mock_emit.call_args_list
                assert len(calls) >= 2
                
                # Check second call is crawl:stopped
                second_call = calls[1]
                assert second_call[0][0] == 'crawl:stopped'
                assert second_call[0][1]['progressId'] == 'test-progress-123'
                assert second_call[0][1]['status'] == 'cancelled'
                assert second_call[0][1]['message'] == 'Crawl operation cancelled'
                assert 'timestamp' in second_call[0][1]
                assert second_call[1]['room'] == 'test-progress-123'
    
    async def test_crawl_stop_handles_missing_progress_id(self):
        """Test that crawl_stop handles missing progress_id."""
        # Mock Socket.IO emit
        with patch.object(sio, 'emit', new_callable=AsyncMock) as mock_emit:
            # Call without progress_id
            result = await crawl_stop('test-sid', {})
            
            # Verify error was emitted
            mock_emit.assert_called_once_with(
                'error',
                {'message': 'progress_id required'},
                to='test-sid'
            )
            
            # Verify failure response
            assert result['success'] is False
            assert result['error'] == 'progress_id required'
    
    async def test_crawl_stop_handles_orchestration_not_found(self):
        """Test that crawl_stop handles when orchestration is not found."""
        # Mock Socket.IO emit
        with patch.object(sio, 'emit', new_callable=AsyncMock) as mock_emit:
            # Mock orchestration not found
            with patch('src.server.fastapi.socketio_handlers.get_active_orchestration') as mock_get_orch:
                mock_get_orch.return_value = None
                
                # Call crawl_stop
                result = await crawl_stop('test-sid', {'progress_id': 'test-progress-123'})
                
                # Should still emit events
                calls = mock_emit.call_args_list
                assert len(calls) >= 2
                
                # Verify success (graceful handling)
                assert result['success'] is True
    
    async def test_crawl_stop_handles_cancellation_error(self):
        """Test that crawl_stop handles errors during cancellation."""
        # Mock Socket.IO emit
        with patch.object(sio, 'emit', new_callable=AsyncMock) as mock_emit:
            # Mock orchestration that raises error
            with patch('src.server.fastapi.socketio_handlers.get_active_orchestration') as mock_get_orch:
                mock_orch = Mock()
                mock_orch.cancel.side_effect = Exception("Cancellation failed")
                mock_get_orch.return_value = mock_orch
                
                # Call crawl_stop
                result = await crawl_stop('test-sid', {'progress_id': 'test-progress-123'})
                
                # Verify error event was emitted
                error_call = None
                for call in mock_emit.call_args_list:
                    if call[0][0] == 'crawl:error':
                        error_call = call
                        break
                
                assert error_call is not None
                assert error_call[0][1]['progressId'] == 'test-progress-123'
                assert 'Cancellation failed' in error_call[0][1]['error']
                assert error_call[1]['room'] == 'test-progress-123'
                
                # Verify failure response
                assert result['success'] is False
                assert 'Cancellation failed' in result['error']
    
    async def test_stop_crawl_api_endpoint_integration(self):
        """Test the full stop crawl flow via API endpoint."""
        from src.server.fastapi.knowledge_api import stop_crawl_task, active_crawl_tasks
        
        # Mock dependencies
        with patch('src.server.fastapi.knowledge_api.sio') as mock_sio:
            mock_sio.emit = AsyncMock()
            
            with patch('src.server.fastapi.knowledge_api.get_active_orchestration') as mock_get_orch:
                with patch('src.server.fastapi.knowledge_api.unregister_orchestration') as mock_unreg:
                    # Create a mock task
                    mock_task = AsyncMock()
                    mock_task.done.return_value = False
                    mock_task.cancel = Mock()
                    
                    # Add task to active_crawl_tasks
                    test_progress_id = 'test-progress-456'
                    active_crawl_tasks[test_progress_id] = mock_task
                    
                    # Mock orchestration
                    mock_orch = Mock()
                    mock_get_orch.return_value = mock_orch
                    
                    # Call API endpoint
                    result = await stop_crawl_task(test_progress_id)
                    
                    # Verify all steps executed
                    assert mock_sio.emit.call_count >= 2  # crawl:stopping and crawl:stopped
                    
                    # Check crawl:stopping was emitted first
                    first_emit = mock_sio.emit.call_args_list[0]
                    assert first_emit[0][0] == 'crawl:stopping'
                    
                    # Check crawl:stopped was emitted last
                    last_emit = mock_sio.emit.call_args_list[-1]
                    assert last_emit[0][0] == 'crawl:stopped'
                    
                    # Verify orchestration was cancelled
                    mock_orch.cancel.assert_called_once()
                    
                    # Verify task was cancelled
                    mock_task.cancel.assert_called_once()
                    
                    # Verify task was removed from active_crawl_tasks
                    assert test_progress_id not in active_crawl_tasks
                    
                    # Verify unregister was called
                    mock_unreg.assert_called_once_with(test_progress_id)
                    
                    # Verify response
                    assert result['success'] is True
                    assert result['progressId'] == test_progress_id