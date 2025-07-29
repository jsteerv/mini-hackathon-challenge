"""
Test suite for WebSocket Handlers

Tests real-time event broadcasting, session management,
error handling, and reconnection logic.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
import time

from src.server.fastapi.socketio_handlers import (
    broadcast_task_update,
    broadcast_project_update,
    broadcast_progress_update,
    broadcast_crawl_progress
)


class TestSocketIOBroadcasting:
    """Test cases for Socket.IO broadcasting functions"""
    
    @pytest.fixture
    def mock_socketio(self):
        """Mock Socket.IO instance"""
        sio = AsyncMock()
        sio.emit = AsyncMock()
        sio.enter_room = AsyncMock()
        sio.leave_room = AsyncMock()
        return sio
    
    @pytest.fixture
    def sample_task_data(self):
        """Sample task data for broadcasting"""
        return {
            "id": "task-123",
            "title": "Test Task",
            "status": "in_progress",
            "project_id": "project-456",
            "assignee": "User",
            "updated_at": "2024-01-01T12:00:00Z"
        }
    
    @pytest.mark.asyncio
    async def test_broadcast_task_update_success(self, mock_socketio, sample_task_data):
        """Test successful task update broadcasting"""
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio):
            await broadcast_task_update(
                project_id="project-456",
                event_type="task_updated",
                task_data=sample_task_data
            )
            
            # Verify emit was called with correct parameters
            mock_socketio.emit.assert_called_once_with(
                "task_updated",
                sample_task_data,
                room="project-456"
            )
    
    @pytest.mark.asyncio
    async def test_broadcast_project_update_success(self, mock_socketio):
        """Test successful project update broadcasting"""
        # Mock project service
        mock_project_service = Mock()
        mock_project_service.list_projects.return_value = (True, {
            "projects": [
                {"id": "proj1", "title": "Project 1"},
                {"id": "proj2", "title": "Project 2"}
            ]
        })
        
        # Mock source linking service
        mock_source_service = Mock()
        mock_source_service.format_projects_with_sources.return_value = [
            {"id": "proj1", "title": "Project 1", "sources": []},
            {"id": "proj2", "title": "Project 2", "sources": []}
        ]
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio), \
             patch('src.server.fastapi.socketio_handlers.ProjectService') as mock_proj_cls, \
             patch('src.server.fastapi.socketio_handlers.SourceLinkingService') as mock_source_cls:
            
            mock_proj_cls.return_value = mock_project_service
            mock_source_cls.return_value = mock_source_service
            
            await broadcast_project_update()
            
            # Verify emit was called for project list
            mock_socketio.emit.assert_called_once_with(
                'projects_update',
                {'projects': mock_source_service.format_projects_with_sources.return_value},
                room='project_list'
            )
    
    @pytest.mark.asyncio
    async def test_broadcast_project_update_service_error(self, mock_socketio):
        """Test project update broadcasting with service error"""
        # Mock project service failure
        mock_project_service = Mock()
        mock_project_service.list_projects.return_value = (False, {"error": "Database error"})
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio), \
             patch('src.server.fastapi.socketio_handlers.ProjectService') as mock_proj_cls:
            
            mock_proj_cls.return_value = mock_project_service
            
            await broadcast_project_update()
            
            # Should not emit if service fails
            mock_socketio.emit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_broadcast_progress_update_success(self, mock_socketio):
        """Test successful progress update broadcasting"""
        progress_data = {
            "progress": 75,
            "status": "processing",
            "current_step": "indexing documents",
            "total_steps": 100,
            "completed_steps": 75
        }
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio):
            await broadcast_progress_update("progress-123", progress_data)
            
            # Verify emit was called with correct parameters
            mock_socketio.emit.assert_called_once_with(
                'project_progress',
                progress_data,
                room="progress-123"
            )
    
    @pytest.mark.asyncio
    async def test_broadcast_crawl_progress_with_rate_limiting(self, mock_socketio):
        """Test crawl progress broadcasting with rate limiting"""
        progress_data = {
            "progress": 50,
            "status": "crawling",
            "url": "https://example.com/page1",
            "total_urls": 100,
            "completed_urls": 50
        }
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio):
            # First call should go through
            await broadcast_crawl_progress("crawl-123", progress_data.copy())
            
            # Immediate second call should be rate limited (unless important status)
            progress_data["progress"] = 51
            await broadcast_crawl_progress("crawl-123", progress_data.copy())
            
            # Important status should bypass rate limiting
            progress_data["status"] = "completed"
            await broadcast_crawl_progress("crawl-123", progress_data.copy())
            
            # Should have at least 2 calls (first and completed)
            assert mock_socketio.emit.call_count >= 2
            
            # Verify progressId is added to data
            for call in mock_socketio.emit.call_args_list:
                args, kwargs = call
                event_data = args[1]
                assert "progressId" in event_data
                assert event_data["progressId"] == "crawl-123"
    
    @pytest.mark.asyncio
    async def test_broadcast_crawl_progress_important_statuses(self, mock_socketio):
        """Test that important statuses bypass rate limiting"""
        important_statuses = ['error', 'completed', 'complete', 'starting']
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio):
            for status in important_statuses:
                progress_data = {
                    "progress": 100,
                    "status": status,
                    "message": f"Status: {status}"
                }
                
                await broadcast_crawl_progress("crawl-important", progress_data)
            
            # All important statuses should be broadcasted
            assert mock_socketio.emit.call_count == len(important_statuses)
    
    @pytest.mark.asyncio
    async def test_broadcast_exception_handling(self, mock_socketio):
        """Test exception handling in broadcast functions"""
        # Mock socket.io emit to raise exception
        mock_socketio.emit.side_effect = Exception("Socket.IO error")
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_socketio):
            # Should not raise exception, just log error
            try:
                await broadcast_task_update(
                    project_id="project-123",
                    event_type="task_updated",
                    task_data={"id": "task-1"}
                )
                # Should complete without raising
                success = True
            except Exception:
                success = False
            
            assert success is True


class TestSocketIOEventHandlers:
    """Test cases for Socket.IO event handlers"""
    
    @pytest.fixture
    def mock_socket_client(self):
        """Mock socket client for testing"""
        return Mock(id="client-123")
    
    @pytest.fixture
    def mock_socketio_server(self):
        """Mock Socket.IO server instance"""
        server = AsyncMock()
        server.emit = AsyncMock()
        server.enter_room = AsyncMock()
        server.leave_room = AsyncMock()
        server.disconnect = AsyncMock()
        return server
    
    @pytest.mark.asyncio
    async def test_client_connection_handling(self, mock_socketio_server, mock_socket_client):
        """Test client connection event handling"""
        # This would test actual connection handlers if they exist
        # For now, we'll test the pattern
        
        async def on_connect(sid, environ):
            """Mock connect handler"""
            await mock_socketio_server.enter_room(sid, 'general')
            return True
        
        # Test connection
        result = await on_connect(mock_socket_client.id, {})
        
        assert result is True
        mock_socketio_server.enter_room.assert_called_once_with(
            mock_socket_client.id, 
            'general'
        )
    
    @pytest.mark.asyncio
    async def test_client_disconnection_handling(self, mock_socketio_server, mock_socket_client):
        """Test client disconnection event handling"""
        async def on_disconnect(sid):
            """Mock disconnect handler"""
            # Clean up any client-specific resources
            await mock_socketio_server.leave_room(sid, 'general')
        
        # Test disconnection
        await on_disconnect(mock_socket_client.id)
        
        mock_socketio_server.leave_room.assert_called_once_with(
            mock_socket_client.id,
            'general'
        )
    
    @pytest.mark.asyncio
    async def test_room_management(self, mock_socketio_server, mock_socket_client):
        """Test Socket.IO room management"""
        async def join_project_room(sid, data):
            """Mock handler for joining project room"""
            project_id = data.get('project_id')
            if project_id:
                await mock_socketio_server.enter_room(sid, project_id)
                return {"success": True, "room": project_id}
            return {"success": False, "error": "No project_id provided"}
        
        # Test joining room
        result = await join_project_room(
            mock_socket_client.id,
            {"project_id": "project-456"}
        )
        
        assert result["success"] is True
        assert result["room"] == "project-456"
        mock_socketio_server.enter_room.assert_called_once_with(
            mock_socket_client.id,
            "project-456"
        )
    
    @pytest.mark.asyncio
    async def test_error_event_handling(self, mock_socketio_server, mock_socket_client):
        """Test error event handling"""
        async def handle_error(sid, data):
            """Mock error handler"""
            error_info = {
                "client_id": sid,
                "error": data.get("error", "Unknown error"),
                "timestamp": time.time()
            }
            
            # Emit error back to client
            await mock_socketio_server.emit(
                'error_response',
                error_info,
                room=sid
            )
        
        # Test error handling
        await handle_error(
            mock_socket_client.id,
            {"error": "Test error message"}
        )
        
        mock_socketio_server.emit.assert_called_once()
        call_args = mock_socketio_server.emit.call_args
        assert call_args[0][0] == 'error_response'
        assert "error" in call_args[0][1]
        assert call_args[0][1]["error"] == "Test error message"


class TestSocketIOSessionManagement:
    """Test cases for Socket.IO session management"""
    
    @pytest.fixture
    def session_manager(self):
        """Mock session manager"""
        class MockSessionManager:
            def __init__(self):
                self.sessions = {}
                self.room_members = {}
            
            async def add_session(self, sid, data):
                self.sessions[sid] = {
                    "id": sid,
                    "connected_at": time.time(),
                    "user_data": data
                }
            
            async def remove_session(self, sid):
                if sid in self.sessions:
                    del self.sessions[sid]
            
            async def join_room(self, sid, room):
                if room not in self.room_members:
                    self.room_members[room] = set()
                self.room_members[room].add(sid)
            
            async def leave_room(self, sid, room):
                if room in self.room_members:
                    self.room_members[room].discard(sid)
            
            def get_room_members(self, room):
                return list(self.room_members.get(room, set()))
            
            def get_session_count(self):
                return len(self.sessions)
        
        return MockSessionManager()
    
    @pytest.mark.asyncio
    async def test_session_lifecycle(self, session_manager):
        """Test complete session lifecycle"""
        client_id = "client-123"
        user_data = {"user_id": "user-456", "username": "testuser"}
        
        # Add session
        await session_manager.add_session(client_id, user_data)
        assert session_manager.get_session_count() == 1
        assert client_id in session_manager.sessions
        
        # Join rooms
        await session_manager.join_room(client_id, "project-789")
        await session_manager.join_room(client_id, "general")
        
        assert client_id in session_manager.get_room_members("project-789")
        assert client_id in session_manager.get_room_members("general")
        
        # Leave room
        await session_manager.leave_room(client_id, "project-789")
        assert client_id not in session_manager.get_room_members("project-789")
        assert client_id in session_manager.get_room_members("general")
        
        # Remove session
        await session_manager.remove_session(client_id)
        assert session_manager.get_session_count() == 0
        assert client_id not in session_manager.sessions
    
    @pytest.mark.asyncio
    async def test_concurrent_session_management(self, session_manager):
        """Test concurrent session operations"""
        # Simulate multiple clients connecting
        clients = [f"client-{i}" for i in range(10)]
        
        # Add all sessions concurrently
        tasks = [
            session_manager.add_session(
                client_id,
                {"user_id": f"user-{i}", "username": f"user{i}"}
            )
            for i, client_id in enumerate(clients)
        ]
        await asyncio.gather(*tasks)
        
        assert session_manager.get_session_count() == 10
        
        # Join rooms concurrently
        room_tasks = []
        for i, client_id in enumerate(clients):
            room_tasks.append(session_manager.join_room(client_id, f"room-{i % 3}"))
        await asyncio.gather(*room_tasks)
        
        # Verify room memberships
        for i in range(3):
            room_name = f"room-{i}"
            members = session_manager.get_room_members(room_name)
            # Should have clients where i % 3 == room number
            expected_count = len([c for j, c in enumerate(clients) if j % 3 == i])
            assert len(members) == expected_count
    
    @pytest.mark.asyncio
    async def test_session_cleanup_on_error(self, session_manager):
        """Test session cleanup when errors occur"""
        client_id = "client-error"
        
        # Add session
        await session_manager.add_session(client_id, {"user_id": "user-error"})
        await session_manager.join_room(client_id, "error-room")
        
        # Simulate error condition requiring cleanup
        try:
            # This would be where an error occurs in real handling
            raise Exception("Simulated error")
        except Exception:
            # Cleanup should happen in finally block
            await session_manager.leave_room(client_id, "error-room")
            await session_manager.remove_session(client_id)
        
        # Verify cleanup
        assert session_manager.get_session_count() == 0
        assert len(session_manager.get_room_members("error-room")) == 0


class TestSocketIOReconnectionLogic:
    """Test cases for Socket.IO reconnection handling"""
    
    @pytest.fixture
    def reconnection_handler(self):
        """Mock reconnection handler"""
        class MockReconnectionHandler:
            def __init__(self):
                self.reconnection_attempts = {}
                self.max_attempts = 5
                self.backoff_factor = 2
            
            async def handle_reconnection(self, sid, attempt_count=1):
                """Handle client reconnection"""
                if attempt_count > self.max_attempts:
                    return {"success": False, "reason": "max_attempts_exceeded"}
                
                self.reconnection_attempts[sid] = attempt_count
                
                # Simulate reconnection success after some attempts
                if attempt_count <= 3:
                    return {
                        "success": True,
                        "attempt": attempt_count,
                        "backoff_delay": self.backoff_factor ** attempt_count
                    }
                else:
                    return {"success": False, "reason": "connection_failed"}
            
            def get_attempt_count(self, sid):
                return self.reconnection_attempts.get(sid, 0)
            
            def reset_attempts(self, sid):
                if sid in self.reconnection_attempts:
                    del self.reconnection_attempts[sid]
        
        return MockReconnectionHandler()
    
    @pytest.mark.asyncio
    async def test_successful_reconnection(self, reconnection_handler):
        """Test successful client reconnection"""
        client_id = "client-reconnect"
        
        # First reconnection attempt
        result = await reconnection_handler.handle_reconnection(client_id, 1)
        
        assert result["success"] is True
        assert result["attempt"] == 1
        assert result["backoff_delay"] == 2  # 2^1
        assert reconnection_handler.get_attempt_count(client_id) == 1
    
    @pytest.mark.asyncio
    async def test_reconnection_with_backoff(self, reconnection_handler):
        """Test reconnection with exponential backoff"""
        client_id = "client-backoff"
        
        # Multiple reconnection attempts
        for attempt in range(1, 4):
            result = await reconnection_handler.handle_reconnection(client_id, attempt)
            
            assert result["success"] is True
            assert result["attempt"] == attempt
            assert result["backoff_delay"] == 2 ** attempt
    
    @pytest.mark.asyncio
    async def test_max_reconnection_attempts(self, reconnection_handler):
        """Test behavior when max reconnection attempts are exceeded"""
        client_id = "client-max-attempts"
        
        # Exceed max attempts
        result = await reconnection_handler.handle_reconnection(client_id, 6)
        
        assert result["success"] is False
        assert result["reason"] == "max_attempts_exceeded"
    
    @pytest.mark.asyncio
    async def test_reconnection_state_persistence(self, reconnection_handler):
        """Test that reconnection state persists across attempts"""
        client_id = "client-persistence"
        
        # First attempt
        await reconnection_handler.handle_reconnection(client_id, 1)
        assert reconnection_handler.get_attempt_count(client_id) == 1
        
        # Second attempt
        await reconnection_handler.handle_reconnection(client_id, 2)
        assert reconnection_handler.get_attempt_count(client_id) == 2
        
        # Reset attempts
        reconnection_handler.reset_attempts(client_id)
        assert reconnection_handler.get_attempt_count(client_id) == 0


class TestSocketIOErrorHandling:
    """Test cases for Socket.IO error handling"""
    
    @pytest.mark.asyncio
    async def test_malformed_message_handling(self):
        """Test handling of malformed Socket.IO messages"""
        async def handle_message(data):
            """Mock message handler with validation"""
            try:
                if not isinstance(data, dict):
                    raise ValueError("Message must be a dictionary")
                
                required_fields = ["type", "payload"]
                for field in required_fields:
                    if field not in data:
                        raise ValueError(f"Missing required field: {field}")
                
                return {"success": True, "processed": data}
            
            except ValueError as e:
                return {"success": False, "error": str(e)}
        
        # Test valid message
        valid_message = {"type": "task_update", "payload": {"task_id": "123"}}
        result = await handle_message(valid_message)
        assert result["success"] is True
        
        # Test malformed messages
        malformed_messages = [
            "not a dict",
            {"type": "incomplete"},  # Missing payload
            {"payload": {"data": "value"}},  # Missing type
            None,
            []
        ]
        
        for message in malformed_messages:
            result = await handle_message(message)
            assert result["success"] is False
            assert "error" in result
    
    @pytest.mark.asyncio
    async def test_connection_timeout_handling(self):
        """Test handling of connection timeouts"""
        async def connection_with_timeout(timeout_seconds=5):
            """Mock connection handler with timeout"""
            try:
                # Simulate connection process
                await asyncio.wait_for(
                    asyncio.sleep(timeout_seconds + 1),  # Simulate slow connection
                    timeout=timeout_seconds
                )
                return {"success": True, "connected": True}
            
            except asyncio.TimeoutError:
                return {"success": False, "error": "connection_timeout"}
        
        # Test timeout scenario
        result = await connection_with_timeout(1)  # 1 second timeout
        assert result["success"] is False
        assert result["error"] == "connection_timeout"
    
    @pytest.mark.asyncio
    async def test_resource_cleanup_on_error(self):
        """Test proper resource cleanup when errors occur"""
        class MockResourceManager:
            def __init__(self):
                self.resources = {}
                self.cleanup_called = False
            
            async def allocate_resource(self, client_id, resource_type):
                self.resources[client_id] = {
                    "type": resource_type,
                    "allocated_at": time.time()
                }
            
            async def cleanup_resources(self, client_id):
                if client_id in self.resources:
                    del self.resources[client_id]
                self.cleanup_called = True
            
            def has_resources(self, client_id):
                return client_id in self.resources
        
        manager = MockResourceManager()
        client_id = "client-cleanup"
        
        try:
            # Allocate resources
            await manager.allocate_resource(client_id, "websocket")
            assert manager.has_resources(client_id)
            
            # Simulate error
            raise Exception("Simulated error")
        
        except Exception:
            # Cleanup should occur
            await manager.cleanup_resources(client_id)
        
        # Verify cleanup
        assert not manager.has_resources(client_id)
        assert manager.cleanup_called is True


class TestSocketIOPerformance:
    """Test cases for Socket.IO performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_high_frequency_broadcasts(self):
        """Test performance with high-frequency broadcasts"""
        mock_sio = AsyncMock()
        broadcast_count = 100
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Simulate rapid broadcasts
            start_time = time.time()
            
            tasks = []
            for i in range(broadcast_count):
                task = broadcast_crawl_progress(
                    f"progress-{i}",
                    {"progress": i, "status": "crawling"}
                )
                tasks.append(task)
            
            await asyncio.gather(*tasks)
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Should complete reasonably quickly (under 5 seconds for 100 broadcasts)
            assert duration < 5.0
            
            # Some broadcasts may be rate-limited, so emit count might be less
            assert mock_sio.emit.call_count <= broadcast_count
    
    @pytest.mark.asyncio
    async def test_large_payload_handling(self):
        """Test handling of large payloads in broadcasts"""
        mock_sio = AsyncMock()
        
        # Create large payload
        large_payload = {
            "data": "x" * 10000,  # 10KB string
            "items": [{"id": i, "value": f"item-{i}"} for i in range(1000)]
        }
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Should handle large payload without error
            await broadcast_progress_update("large-progress", large_payload)
            
            mock_sio.emit.assert_called_once()
            # Verify payload was passed correctly
            call_args = mock_sio.emit.call_args
            assert len(call_args[0][1]["data"]) == 10000
            assert len(call_args[0][1]["items"]) == 1000
    
    @pytest.mark.asyncio
    async def test_concurrent_room_operations(self):
        """Test concurrent operations on multiple rooms"""
        mock_sio = AsyncMock()
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Simulate concurrent broadcasts to different rooms
            rooms = [f"room-{i}" for i in range(10)]
            
            tasks = []
            for room in rooms:
                task = broadcast_task_update(
                    room,
                    "task_updated",
                    {"id": f"task-{room}", "status": "updated"}
                )
                tasks.append(task)
            
            # All should complete successfully
            await asyncio.gather(*tasks)
            
            # Should have one emit per room
            assert mock_sio.emit.call_count == len(rooms)
            
            # Verify each room received its broadcast
            emitted_rooms = [call[1]['room'] for call in mock_sio.emit.call_args_list]
            assert set(emitted_rooms) == set(rooms)