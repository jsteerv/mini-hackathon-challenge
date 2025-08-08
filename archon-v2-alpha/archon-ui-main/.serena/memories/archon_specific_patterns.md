# Archon-Specific Patterns

## Project Structure
```
archon-ui-main/
├── src/services/socketIOService.ts  # Base WebSocket service
├── src/services/mcpService.ts       # MCP server communication
├── src/services/projectService.ts   # Project management
├── src/components/project-tasks/    # Task management components
└── src/pages/ProjectPage.tsx        # Main project interface
```

## Socket.IO Architecture
- **WebSocketService**: Base class for Socket.IO connections
- **Room-based**: Uses session/project IDs for room identification
- **Auto-reconnection**: Built-in exponential backoff
- **Message Types**: Typed message handlers with wildcards
- **State Management**: Connection state tracking

## Real-time Features
- **Task Updates**: Live task status changes
- **Document Sync**: Real-time document editing
- **Project Progress**: Live project creation progress
- **Crawl Progress**: Real-time web crawling updates

## Service Patterns
- Promise-based connection establishment
- Event handler registration/cleanup
- Error boundary handling
- Singleton instances for different features

## Component Integration
- Services inject into React contexts
- Hook-based state management
- Cleanup on component unmount
- Toast notifications for user feedback