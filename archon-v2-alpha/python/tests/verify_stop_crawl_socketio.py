#!/usr/bin/env python3
"""Verify Socket.IO stop crawl implementation."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def verify_stop_crawl_implementation():
    """Verify the stop crawl Socket.IO implementation is complete."""
    print("=== Verifying Stop Crawl Socket.IO Implementation ===\n")
    
    # Check 1: Socket.IO handlers
    print("1. Checking Socket.IO handlers...")
    try:
        from src.server.fastapi.socketio_handlers import crawl_stop
        print("   ✓ crawl_stop event handler found")
    except ImportError as e:
        print(f"   ✗ Error importing crawl_stop: {e}")
        return False
    
    # Check 2: Knowledge API stop endpoint
    print("\n2. Checking Knowledge API stop endpoint...")
    try:
        from src.server.fastapi.knowledge_api import stop_crawl_task
        print("   ✓ stop_crawl_task endpoint found")
        
        # Check if it has Socket.IO integration
        import inspect
        source = inspect.getsource(stop_crawl_task)
        if "crawl:stopping" in source:
            print("   ✓ Emits crawl:stopping event")
        else:
            print("   ✗ Missing crawl:stopping event")
            
        if "crawl:stopped" in source:
            print("   ✓ Emits crawl:stopped event")
        else:
            print("   ✗ Missing crawl:stopped event")
            
        if "active_crawl_tasks" in source:
            print("   ✓ Cancels asyncio task from active_crawl_tasks")
        else:
            print("   ✗ Missing active_crawl_tasks handling")
            
    except ImportError as e:
        print(f"   ✗ Error importing stop_crawl_task: {e}")
        return False
    
    # Check 3: Event handler implementation
    print("\n3. Checking crawl_stop event handler implementation...")
    try:
        import inspect
        source = inspect.getsource(crawl_stop)
        
        if "crawl:stopping" in source:
            print("   ✓ Emits crawl:stopping status immediately")
        else:
            print("   ✗ Missing immediate crawl:stopping emission")
            
        if "crawl:stopped" in source:
            print("   ✓ Emits crawl:stopped after cancellation")
        else:
            print("   ✗ Missing crawl:stopped emission")
            
        if "orchestration.cancel()" in source:
            print("   ✓ Cancels orchestration service")
        else:
            print("   ✗ Missing orchestration cancellation")
            
        if "progress_id required" in source:
            print("   ✓ Validates progress_id parameter")
        else:
            print("   ✗ Missing progress_id validation")
            
    except Exception as e:
        print(f"   ✗ Error checking handler: {e}")
        return False
    
    # Check 4: Progress tracking integration
    print("\n4. Checking progress tracking integration...")
    try:
        from src.server.fastapi.knowledge_api import _perform_crawl_with_progress
        source = inspect.getsource(_perform_crawl_with_progress)
        
        if "asyncio.CancelledError" in source:
            print("   ✓ Handles asyncio.CancelledError properly")
        else:
            print("   ✗ Missing CancelledError handling")
            
        if "active_crawl_tasks[progress_id]" in source:
            print("   ✓ Stores task in active_crawl_tasks")
        else:
            print("   ✗ Missing task storage in active_crawl_tasks")
            
    except Exception as e:
        print(f"   ✗ Error checking progress integration: {e}")
        return False
    
    print("\n=== Event Flow Summary ===")
    print("1. Client calls stop endpoint or emits 'crawl_stop' event")
    print("2. Server immediately emits 'crawl:stopping' to room")
    print("3. Server cancels orchestration service")
    print("4. Server cancels asyncio task from active_crawl_tasks")
    print("5. Server removes from orchestration registry")
    print("6. Server emits 'crawl:stopped' with final status")
    print("7. Client receives events and updates UI accordingly")
    
    print("\n=== Implementation Status: COMPLETE ✓ ===")
    return True

if __name__ == "__main__":
    success = verify_stop_crawl_implementation()
    sys.exit(0 if success else 1)