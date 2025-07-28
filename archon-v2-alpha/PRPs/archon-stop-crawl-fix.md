# PRP: Fix Stop Crawl Feature in KnowledgeItem Card

## Goal
Fix the "Stop crawl" button in the KnowledgeItem Card to properly cancel ongoing crawl operations and prevent them from restarting after being stopped.

## Why
- **User Experience**: Users expect the stop button to immediately and permanently halt crawl operations
- **Resource Management**: Continuing crawls waste server resources and may accumulate unnecessary data
- **Trust**: When UI controls don't work as expected, it undermines user confidence in the system
- **Background Task Control**: Proper cancellation is essential for managing long-running background operations

## What
Implement a comprehensive fix for the stop crawl feature that ensures:
1. Immediate UI feedback when stop is clicked
2. Proper cancellation of backend crawl tasks
3. Prevention of crawl restart after cancellation
4. State synchronization across all connected clients
5. Graceful cleanup of resources

## All Needed Context

### Current Issue Analysis
The stop crawl feature appears to work momentarily (UI shows "stopped") but then the crawl restarts. This indicates:
- The UI optimistically updates but the backend task continues
- The server's `stop_crawl_task` endpoint only cancels the orchestration service, not the actual asyncio task
- The UI maintains crawl state in localStorage (not database) which can cause "zombie" crawls to restart
- Socket.IO continues sending progress updates after stop request
- The asyncio task in `active_crawl_tasks` dictionary is never cancelled

### Existing Code Patterns

#### UI Components
- `KnowledgeItemCard.tsx`: Contains the stop button and progress display
- `CrawlingProgressCard.tsx`: Manages crawl progress visualization
- `KnowledgeBasePage.tsx`: Parent component managing progress items state
- Uses ShadCN UI components (Button, Badge, Progress)
- Socket.IO integration via `CrawlProgressService`

#### Server Architecture
- `knowledge_api.py`: API endpoints including `/knowledge-items/stop/{progress_id}`
- `CrawlOrchestrationService`: Manages crawl operations with cancellation support
- `active_crawl_tasks`: Dictionary tracking asyncio tasks
- Supabase for persistent storage
- FastAPI for API framework

#### Socket.IO Events
- Current events: `crawl_progress`, `error`
- Missing: Dedicated stop/cancellation events
- Room-based broadcasting for progress updates

### Key Integration Points
1. **UI → Server**: HTTP POST to `/api/knowledge-items/stop/{progress_id}`
2. **Server → UI**: Socket.IO progress events
3. **localStorage**: Active crawls and progress data persistence
   - `active_crawls`: Array of active progress IDs
   - `crawl_progress_{progressId}`: Individual crawl data with timestamps
4. **Background Tasks**: Asyncio task management in `active_crawl_tasks` dictionary

## Implementation Blueprint

### Phase 1: Server Implementation (Priority: Critical)

#### 1.1 Enhanced Stop Endpoint (`knowledge_api.py`)
```python
@router.post("/knowledge-items/stop/{progress_id}")
async def stop_crawl_task(progress_id: str):
    try:
        # Step 1: Cancel the orchestration service
        orchestration = get_active_orchestration(progress_id)
        if orchestration:
            orchestration.cancel()
        
        # Step 2: Cancel the asyncio task
        if progress_id in active_crawl_tasks:
            task = active_crawl_tasks[progress_id]
            if not task.done():
                task.cancel()
                try:
                    await asyncio.wait_for(task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass
            del active_crawl_tasks[progress_id]
        
        # Step 3: Remove from active orchestrations registry
        if progress_id in _active_orchestrations:
            del _active_orchestrations[progress_id]
        
        # Step 4: Send Socket.IO event
        await sio.emit('crawl:stopped', {
            'progressId': progress_id,
            'status': 'cancelled',
            'message': 'Crawl cancelled by user',
            'timestamp': datetime.utcnow().isoformat()
        }, room=progress_id)
        
        return {
            'success': True,
            'message': 'Crawl task stopped successfully',
            'progressId': progress_id
        }
```

#### 1.2 Socket.IO Handler (`socketio_handlers.py`)
```python
@sio.event
async def crawl_stop(sid, data):
    """Handle crawl stop request via Socket.IO."""
    progress_id = data.get('progress_id')
    
    # Emit stopping status immediately
    await sio.emit('crawl:stopping', {
        'progressId': progress_id,
        'message': 'Stopping crawl operation...'
    }, room=progress_id)
    
    # Cancel orchestration
    orchestration = get_active_orchestration(progress_id)
    if orchestration:
        orchestration.cancel()
    
    # Broadcast cancellation
    await sio.emit('crawl:stopped', {
        'progressId': progress_id,
        'status': 'cancelled',
        'message': 'Crawl operation cancelled'
    }, room=progress_id)
```

#### 1.3 Fix asyncio Task Creation in knowledge_api.py
```python
async def _perform_crawl_with_progress(progress_id: str, request: KnowledgeItemRequest):
    """Fixed crawl with proper task tracking."""
    try:
        # Create orchestration service
        orchestration_service = CrawlOrchestrationService(
            crawler, 
            supabase_client,
            progress_id
        )
        
        # Store the task in active_crawl_tasks for cancellation support
        current_task = asyncio.current_task()
        if current_task:
            active_crawl_tasks[progress_id] = current_task
        
        # Orchestrate crawl
        result = await orchestration_service.orchestrate_crawl(request_dict)
        
    except asyncio.CancelledError:
        safe_logfire_info(f"Crawl cancelled | progress_id={progress_id}")
        await update_crawl_progress(progress_id, {
            'status': 'cancelled',
            'percentage': -1,
            'message': 'Crawl cancelled by user'
        })
        raise
    finally:
        # Cleanup
        if progress_id in active_crawl_tasks:
            del active_crawl_tasks[progress_id]
```

### Phase 2: UI Implementation (Priority: Critical)

#### 2.1 Enhanced localStorage Cancellation State
```typescript
// KnowledgeBasePage.tsx - Update handleStopCrawl to mark as cancelled in localStorage
const handleStopCrawl = async (progressId: string) => {
  try {
    // Mark as cancelled in localStorage immediately
    const crawlDataStr = localStorage.getItem(`crawl_progress_${progressId}`);
    if (crawlDataStr) {
      const crawlData = JSON.parse(crawlDataStr);
      crawlData.status = 'cancelled';
      crawlData.cancelledAt = Date.now();
      localStorage.setItem(`crawl_progress_${progressId}`, JSON.stringify(crawlData));
    }
    
    // Call stop endpoint
    await knowledgeBaseService.stopCrawl(progressId);
    
    // Update UI state
    setProgressItems(prev => prev.map(item => 
      item.progressId === progressId 
        ? { ...item, status: 'cancelled', percentage: -1 }
        : item
    ));
    
    // Clean up from active crawls
    const activeCrawls = JSON.parse(localStorage.getItem('active_crawls') || '[]');
    const updated = activeCrawls.filter((id: string) => id !== progressId);
    localStorage.setItem('active_crawls', JSON.stringify(updated));
    
  } catch (error) {
    console.error('Failed to stop crawl:', error);
    showToast('Failed to stop crawl', 'error');
  }
};
```

#### 2.2 Enhanced Progress Service (`crawlProgressService.ts`)
```typescript
async streamProgress(
  progressId: string,
  onMessage: ProgressCallback,
  options: StreamProgressOptions = {}
): Promise<void> {
  // Add stop event handlers
  this.wsService.addMessageHandler('crawl:stopping', (message) => {
    if (message.data?.progressId === progressId) {
      onMessage({
        progressId,
        status: 'stopping',
        percentage: message.data.percentage || 0,
        log: message.data.message
      });
    }
  });
  
  this.wsService.addMessageHandler('crawl:stopped', (message) => {
    if (message.data?.progressId === progressId) {
      onMessage({
        progressId,
        status: 'cancelled',
        percentage: 100,
        completed: true,
        log: message.data.message
      });
      
      // Auto-cleanup
      setTimeout(() => this.stopStreaming(progressId), 1000);
    }
  });
}
```

#### 2.3 Update CrawlingProgressCard Component
```typescript
const handleStopCrawl = async () => {
  if (!progressData.progressId || isStopping) return;
  
  try {
    setIsStopping(true);
    
    // Optimistic UI update
    setProgressData(prev => ({
      ...prev,
      status: 'stopping',
      percentage: prev.percentage
    }));
    
    await knowledgeBaseService.stopCrawl(progressData.progressId);
  } catch (error) {
    console.error('Failed to stop crawl:', error);
    showToast('Failed to stop crawl', 'error');
    
    // Revert optimistic update
    setProgressData(prev => ({
      ...prev,
      status: prev.status === 'stopping' ? 'processing' : prev.status
    }));
  } finally {
    setIsStopping(false);
  }
};
```

### Phase 3: State Management Updates (Priority: High)

#### 3.1 Check Cancelled State on Reconnection
```typescript
// In KnowledgeBasePage.tsx - Update loadActiveCrawls to check for cancelled state
const loadActiveCrawls = async () => {
  try {
    const activeCrawls = JSON.parse(localStorage.getItem('active_crawls') || '[]');
    const validCrawls = [];
    
    for (const progressId of activeCrawls) {
      const crawlDataStr = localStorage.getItem(`crawl_progress_${progressId}`);
      if (crawlDataStr) {
        const crawlData = JSON.parse(crawlDataStr);
        
        // Skip cancelled crawls
        if (crawlData.status === 'cancelled' || crawlData.cancelledAt) {
          localStorage.removeItem(`crawl_progress_${progressId}`);
          continue;
        }
        
        // Only reconnect to non-cancelled crawls
        if (crawlData.status !== 'completed' && crawlData.status !== 'error') {
          validCrawls.push(progressId);
          // Reconnect to the crawl...
        }
      }
    }
    
    // Update active crawls list
    localStorage.setItem('active_crawls', JSON.stringify(validCrawls));
  } catch (error) {
    console.error('Failed to load active crawls:', error);
  }
};
```

## Validation Loop

### Level 1: Unit Tests
- Test cancellation flow in orchestration service
- Test Socket.IO event handlers
- Test UI state management

### Level 2: Integration Tests
```bash
# Server tests
uv run pytest tests/test_crawl_cancellation.py -v

# UI tests
npm run test:crawl-stop
```

### Level 3: End-to-End Tests
1. Start a crawl operation
2. Click stop button
3. Verify:
   - UI shows "Stopping..." immediately
   - Progress updates cease within 5 seconds
   - Final status is "cancelled"
   - Crawl cannot be restarted without new request

### Level 4: Performance Tests
- Test concurrent cancellations (10+ simultaneous)
- Verify no memory leaks from cancelled tasks
- Check Socket.IO connection cleanup

## Implementation Order

1. **Server Enhancements** (1.5 hours)
   - Update stop endpoint to cancel asyncio tasks
   - Add Socket.IO stop event handlers
   - Fix task tracking in knowledge_api.py

2. **UI Updates** (1.5 hours)
   - Add localStorage cancellation state
   - Update progress service for stop events
   - Fix reconnection logic to skip cancelled crawls

3. **Integration Testing** (1 hour)
   - Test full cancellation flow
   - Verify no zombie crawls on reconnection
   - Ensure proper cleanup

## Success Criteria

1. **Immediate Response**: Stop button provides instant visual feedback
2. **Permanent Cancellation**: Crawl does not restart after being stopped
3. **State Consistency**: All clients see the same crawl status
4. **Resource Cleanup**: No orphaned tasks or connections
5. **Error Recovery**: Graceful handling of cancellation failures

## Risk Mitigation

1. **Race Conditions**: Use database as source of truth for cancellation state
2. **Network Failures**: Implement both Socket.IO and HTTP fallbacks
3. **Orphaned Tasks**: Add periodic cleanup of stale tasks
4. **UI Inconsistency**: Use optimistic updates with proper rollback

## Monitoring & Observability

Add metrics for:
- Cancellation success rate
- Time to cancellation
- Failed cancellation attempts
- Orphaned task count

## Future Enhancements

1. **Pause/Resume**: Allow pausing crawls instead of only stopping
2. **Batch Operations**: Stop multiple crawls at once
3. **Scheduled Stops**: Set time limits for crawls
4. **Partial Results**: Save progress before cancellation