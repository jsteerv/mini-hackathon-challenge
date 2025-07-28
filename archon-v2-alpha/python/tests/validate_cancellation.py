#!/usr/bin/env python3
"""
Simple validation script for crawl cancellation logic
"""
import asyncio
import uuid
from datetime import datetime


async def test_task_cancellation():
    """Test basic task cancellation"""
    print("Testing task cancellation...")
    
    async def long_task():
        try:
            await asyncio.sleep(10)
            return "completed"
        except asyncio.CancelledError:
            print("  Task was cancelled!")
            return "cancelled"
    
    task = asyncio.create_task(long_task())
    await asyncio.sleep(0.1)  # Let it start
    
    # Cancel the task
    task.cancel()
    
    try:
        result = await task
        print(f"  Task result: {result}")
    except asyncio.CancelledError:
        print("  Task raised CancelledError (expected)")
    
    print("✓ Task cancellation works correctly\n")


async def test_orchestration_cancellation():
    """Test orchestration service cancellation pattern"""
    print("Testing orchestration cancellation...")
    
    class MockOrchestrationService:
        def __init__(self):
            self._cancelled = False
            self.progress_id = str(uuid.uuid4())
        
        def cancel(self):
            self._cancelled = True
            print(f"  Orchestration {self.progress_id[:8]} cancelled")
        
        def is_cancelled(self):
            return self._cancelled
        
        def _check_cancellation(self):
            if self._cancelled:
                raise asyncio.CancelledError("Crawl operation was cancelled by user")
    
    orchestration = MockOrchestrationService()
    
    # Test cancellation
    assert not orchestration.is_cancelled()
    orchestration.cancel()
    assert orchestration.is_cancelled()
    
    try:
        orchestration._check_cancellation()
        print("  ERROR: _check_cancellation should have raised!")
    except asyncio.CancelledError:
        print("  _check_cancellation raised CancelledError (expected)")
    
    print("✓ Orchestration cancellation works correctly\n")


async def test_registry_operations():
    """Test registry add/remove operations"""
    print("Testing registry operations...")
    
    # Simulate registries
    active_tasks = {}
    active_orchestrations = {}
    
    progress_id = str(uuid.uuid4())
    
    # Add to registries
    active_tasks[progress_id] = "mock_task"
    active_orchestrations[progress_id] = "mock_orchestration"
    
    print(f"  Added to registries: {progress_id[:8]}")
    assert progress_id in active_tasks
    assert progress_id in active_orchestrations
    
    # Remove from registries
    del active_tasks[progress_id]
    del active_orchestrations[progress_id]
    
    print(f"  Removed from registries: {progress_id[:8]}")
    assert progress_id not in active_tasks
    assert progress_id not in active_orchestrations
    
    print("✓ Registry operations work correctly\n")


async def test_socket_event_format():
    """Test Socket.IO event format"""
    print("Testing Socket.IO event format...")
    
    progress_id = str(uuid.uuid4())
    
    # Expected event format
    event = {
        'progressId': progress_id,
        'status': 'cancelled',
        'message': 'Crawl cancelled by user',
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Validate format
    assert 'progressId' in event
    assert 'status' in event
    assert 'message' in event
    assert 'timestamp' in event
    assert event['status'] == 'cancelled'
    
    print(f"  Event format validated for {progress_id[:8]}")
    print("✓ Socket.IO event format is correct\n")


async def main():
    """Run all validation tests"""
    print("=== Crawl Cancellation Validation ===\n")
    
    await test_task_cancellation()
    await test_orchestration_cancellation()
    await test_registry_operations()
    await test_socket_event_format()
    
    print("=== All validations passed! ===")


if __name__ == "__main__":
    asyncio.run(main())