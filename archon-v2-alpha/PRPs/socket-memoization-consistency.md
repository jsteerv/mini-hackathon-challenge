# PRP: Socket & Memoization Consistency for Archon UI

## Goal

**Feature Goal**: Implement consistent socket event handling and proper memoization patterns across the Archon UI to prevent unnecessary re-renders and improve performance

**Deliverable**: A refactored UI with optimized socket handling that eliminates redundant updates while maintaining real-time synchronization

**Success Definition**: Task reordering and other UI operations trigger only one render cycle, with optimistic updates properly reconciled against server responses

## User Persona

UI Developer and End Users experiencing performance issues with real-time updates causing UI flickers and unnecessary refreshes during interactions like task reordering

## Why

- **Performance Impact**: Current implementation causes 2-3x more renders than necessary during common operations
- **User Experience**: UI flickers and jumps during task reordering disrupt workflow
- **Resource Waste**: Excessive re-renders consume CPU and memory unnecessarily
- **Developer Experience**: Inconsistent patterns make it difficult to add new real-time features

## What

### Core Changes

1. **Optimistic Update Reconciliation**: Implement proper state comparison to prevent re-applying updates that match local state
2. **Socket Event Deduplication**: Add middleware to filter out redundant socket events
3. **Component Memoization**: Apply React.memo, useMemo, and useCallback strategically
4. **Unified Socket Management**: Create consistent patterns for all socket-connected components

### Implementation Scope

- Refactor TasksTab socket handlers with proper memoization
- Implement event deduplication in WebSocketService
- Add optimistic update tracking to prevent redundant updates
- Create reusable hooks for common socket patterns
- Update documentation with best practices

## All Needed Context

### Current Architecture

```yaml
socket_services:
  - file: archon-ui-main/src/services/socketIOService.ts
    description: Base WebSocket service with connection management
    patterns:
      - Multiple service instances (taskUpdateSocketIO, projectListSocketIO)
      - Event handlers added/removed in components
      - No built-in deduplication

  - file: archon-ui-main/src/services/socketService.ts
    description: DocumentSyncService with advanced features
    good_patterns:
      - Batching with 500ms window
      - Conflict resolution strategies
      - Optimistic updates with rollback
    missing:
      - Not used by task management components

problematic_components:
  - file: archon-ui-main/src/components/project-tasks/TasksTab.tsx:146-180
    issue: Socket handlers update state without checking if data actually changed
    antipattern: |
      taskUpdateSocketIO.addMessageHandler('task_updated', (message) => {
        const updatedTask = message.data || message;
        // No check if task actually changed
        setTasks(prev => prev.map(task => 
          task.id === updatedTask.id ? mappedTask : task
        ));
      });

  - file: archon-ui-main/src/components/project-tasks/TasksTab.tsx:348-390
    issue: handleTaskReorder updates UI immediately then persists, causing double update
    flow:
      1. User drags task
      2. handleTaskReorder updates local state
      3. debouncedPersistReorder calls API
      4. Server broadcasts task_updated event
      5. Socket handler updates state again (unnecessary)

  - file: archon-ui-main/src/components/project-tasks/DraggableTaskCard.tsx:41-58
    issue: Reorder triggered on hover during drag, causing excessive updates

existing_good_patterns:
  - file: archon-ui-main/src/components/project-tasks/TasksTab.tsx:425-428
    pattern: Uses debounced persistence to batch updates
    
  - file: archon-ui-main/src/components/project-tasks/TaskBoardView.tsx:143-147
    pattern: Uses useCallback for event handlers

library_dependencies:
  react: "^18.3.1"
  socket.io-client: "^4.8.1"
  react-dnd: "^16.0.1"
  
gotchas:
  - React 19 not yet adopted (still on 18.3.1)
  - Multiple socket service instances need coordination
  - Task order updates must maintain consistency across all connected clients
  - Modal open state affects whether updates should be applied
```

### Best Practices Research

```yaml
react_memoization:
  - Use React.memo for components that receive stable props
  - useCallback for event handlers passed to memoized children
  - useMemo for expensive computations and stable references
  - Avoid over-memoization - measure first

socket_io_patterns:
  - Initialize socket connections outside components or in context
  - Clean up listeners properly in useEffect cleanup
  - Use stable references for event handlers
  - Implement optimistic updates with reconciliation

optimistic_updates:
  - Track pending changes with unique IDs
  - Compare incoming updates against pending changes
  - Only apply updates that differ from current state
  - Handle conflicts with clear resolution strategy
```

## Implementation Blueprint

### Phase 1: Create Optimistic Update Tracking System

```typescript
// archon-ui-main/src/hooks/useOptimisticUpdates.ts
interface PendingUpdate<T> {
  id: string;
  timestamp: number;
  data: T;
  operation: 'create' | 'update' | 'delete' | 'reorder';
}

export function useOptimisticUpdates<T extends { id: string }>() {
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate<T>>>(new Map());
  
  const addPendingUpdate = useCallback((update: PendingUpdate<T>) => {
    pendingUpdatesRef.current.set(update.id, update);
    // Auto-cleanup after 5 seconds
    setTimeout(() => {
      pendingUpdatesRef.current.delete(update.id);
    }, 5000);
  }, []);
  
  const isPendingUpdate = useCallback((id: string, data: T): boolean => {
    const pending = pendingUpdatesRef.current.get(id);
    if (!pending) return false;
    
    // Compare relevant fields based on operation type
    return JSON.stringify(pending.data) === JSON.stringify(data);
  }, []);
  
  const removePendingUpdate = useCallback((id: string) => {
    pendingUpdatesRef.current.delete(id);
  }, []);
  
  return { addPendingUpdate, isPendingUpdate, removePendingUpdate };
}
```

### Phase 2: Enhance WebSocketService with Deduplication

```typescript
// archon-ui-main/src/services/socketIOService.ts
// Add to WebSocketService class:

private lastMessages: Map<string, { data: any; timestamp: number }> = new Map();
private deduplicationWindow = 100; // 100ms window

private isDuplicateMessage(type: string, data: any): boolean {
  const lastMessage = this.lastMessages.get(type);
  if (!lastMessage) return false;
  
  const now = Date.now();
  const timeDiff = now - lastMessage.timestamp;
  
  // If message arrived within deduplication window and data is identical
  if (timeDiff < this.deduplicationWindow) {
    const isDupe = JSON.stringify(lastMessage.data) === JSON.stringify(data);
    if (isDupe) {
      console.log(`[Socket] Duplicate ${type} message filtered`);
      return true;
    }
  }
  
  return false;
}

private handleMessage(message: WebSocketMessage): void {
  // Add deduplication check
  if (this.isDuplicateMessage(message.type, message.data)) {
    return;
  }
  
  // Store message for deduplication
  this.lastMessages.set(message.type, {
    data: message.data,
    timestamp: Date.now()
  });
  
  // Clean old messages periodically
  if (this.lastMessages.size > 100) {
    const cutoff = Date.now() - 5000;
    for (const [key, value] of this.lastMessages.entries()) {
      if (value.timestamp < cutoff) {
        this.lastMessages.delete(key);
      }
    }
  }
  
  // Continue with existing handler logic...
}
```

### Phase 3: Refactor TasksTab with Proper Memoization

```typescript
// archon-ui-main/src/components/project-tasks/TasksTab.tsx

// Import the new hook
import { useOptimisticUpdates } from '../../hooks/useOptimisticUpdates';

// Inside component:
const { addPendingUpdate, isPendingUpdate } = useOptimisticUpdates<Task>();

// Memoize socket handlers
const handleTaskUpdated = useCallback((message: any) => {
  const updatedTask = message.data || message;
  const mappedTask = mapDatabaseTaskToUITask(updatedTask);
  
  // Skip if this is our own optimistic update
  if (isPendingUpdate(updatedTask.id, mappedTask)) {
    console.log('[Socket] Skipping own optimistic update for task:', updatedTask.id);
    return;
  }
  
  setTasks(prev => {
    // Check if task actually changed
    const existingTask = prev.find(task => task.id === updatedTask.id);
    if (existingTask && JSON.stringify(existingTask) === JSON.stringify(mappedTask)) {
      console.log('[Socket] No actual changes in task, skipping update');
      return prev;
    }
    
    const updated = prev.map(task => 
      task.id === updatedTask.id ? mappedTask : task
    );
    
    // Notify parent after state settles
    setTimeout(() => onTasksChange(updated), 0);
    return updated;
  });
}, [isPendingUpdate, onTasksChange]);

// Update handleTaskReorder to track optimistic updates
const handleTaskReorder = useCallback((taskId: string, targetIndex: number, status: Task['status']) => {
  // ... existing reorder logic ...
  
  // Track this as an optimistic update
  const reorderedTask = renumberedTasks.find(t => t.id === taskId);
  if (reorderedTask) {
    addPendingUpdate({
      id: taskId,
      timestamp: Date.now(),
      data: reorderedTask,
      operation: 'reorder'
    });
  }
  
  // Update UI immediately
  updateTasks(allUpdatedTasks);
  
  // Persist to backend
  debouncedPersistReorder(renumberedTasks);
}, [addPendingUpdate, tasks, updateTasks, debouncedPersistReorder]);

// Memoize the debounced function properly
const debouncedPersistReorder = useMemo(
  () => debounce(async (tasksToUpdate: Task[]) => {
    // ... existing persist logic ...
  }, 500),
  [projectId]
);
```

### Phase 4: Create Reusable Socket Hook

```typescript
// archon-ui-main/src/hooks/useSocketSubscription.ts
export function useSocketSubscription<T>(
  socket: WebSocketService,
  eventName: string,
  handler: (data: T) => void,
  deps: DependencyList = []
) {
  // Memoize the handler
  const stableHandler = useCallback(handler, deps);
  
  useEffect(() => {
    const messageHandler = (message: WebSocketMessage) => {
      stableHandler(message.data || message);
    };
    
    socket.addMessageHandler(eventName, messageHandler);
    
    return () => {
      socket.removeMessageHandler(eventName, messageHandler);
    };
  }, [socket, eventName, stableHandler]);
}
```

### Phase 5: Update Documentation

```markdown
// archon-ui-main/docs/socket-memoization-patterns.md

# Socket & Memoization Patterns

## Quick Reference

### DO:
- ✅ Track optimistic updates to prevent double-renders
- ✅ Memoize socket event handlers with useCallback
- ✅ Check if incoming data actually differs from current state
- ✅ Use debouncing for rapid UI updates (drag & drop)
- ✅ Clean up socket listeners in useEffect cleanup

### DON'T:
- ❌ Update state without checking if data changed
- ❌ Create new handler functions on every render
- ❌ Apply server updates that match pending optimistic updates
- ❌ Forget to handle the "modal open" edge case

## Pattern Examples

### Optimistic Update Pattern
// See implementation examples above

### Socket Handler Pattern
// See implementation examples above
```

## Validation Loop

### Level 1: Syntax & Linting
```bash
cd archon-ui-main
npm run lint
npm run type-check
```

### Level 2: Unit Tests
```bash
# Test the new hooks
npm test -- useOptimisticUpdates.test.tsx
npm test -- useSocketSubscription.test.tsx

# Test socket deduplication
npm test -- socketIOService.test.ts
```

### Level 3: Integration Tests
```bash
# Manual testing checklist:
# 1. Open two browser tabs with same project
# 2. Drag and drop tasks rapidly
# 3. Verify no UI flickers or double updates
# 4. Check React DevTools Profiler for unnecessary renders
# 5. Monitor Network tab for redundant API calls
```

### Level 4: Performance Validation
```bash
# Use React DevTools Profiler:
# 1. Start profiling
# 2. Perform 10 rapid task reorders
# 3. Stop profiling
# 4. Verify render count reduced by >50%
# 5. Check no components render more than once per action
```

## Anti-Patterns to Avoid

1. **Creating handlers inside render**
   ```typescript
   // ❌ BAD - Creates new function every render
   socket.on('update', (data) => setState(data));
   
   // ✅ GOOD - Stable reference
   const handler = useCallback((data) => setState(data), []);
   ```

2. **Not checking state equality**
   ```typescript
   // ❌ BAD - Always triggers re-render
   setTasks(prev => prev.map(t => t.id === id ? newTask : t));
   
   // ✅ GOOD - Only updates if changed
   setTasks(prev => {
     const existing = prev.find(t => t.id === id);
     if (existing && deepEqual(existing, newTask)) return prev;
     return prev.map(t => t.id === id ? newTask : t);
   });
   ```

3. **Forgetting optimistic reconciliation**
   ```typescript
   // ❌ BAD - Server echo causes double update
   updateLocal(task);
   await api.update(task);
   // Server broadcasts update, UI updates again
   
   // ✅ GOOD - Track and skip own updates
   trackOptimisticUpdate(task);
   updateLocal(task);
   await api.update(task);
   // Server broadcast ignored if matches optimistic update
   ```

## Final Validation Checklist

- [ ] Task reordering shows no UI flicker
- [ ] React DevTools shows minimal re-renders
- [ ] Network tab shows debounced API calls
- [ ] Multi-tab sync still works correctly
- [ ] No memory leaks from event listeners
- [ ] Documentation updated with patterns
- [ ] Team trained on new patterns