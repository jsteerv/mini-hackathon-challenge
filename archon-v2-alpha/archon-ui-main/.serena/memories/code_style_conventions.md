# Code Style and Conventions

## TypeScript Configuration
- Strict type checking enabled
- No explicit any allowed (but disabled in ESLint)
- Unused variables prefixed with `_` are ignored
- No non-null assertions warned

## Naming Conventions
- **Files**: camelCase for components, kebab-case for utility files
- **Components**: PascalCase (e.g., `Button.tsx`, `WebSocketService.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces/Types**: PascalCase

## React Patterns
- Functional components with hooks
- Custom hooks for reusable logic (prefix with `use`)
- Context for state management
- Props interfaces defined for all components

## File Organization
- `src/components/ui/`: Base UI components
- `src/components/layouts/`: Layout components
- `src/pages/`: Page components
- `src/services/`: API and service layers
- `src/hooks/`: Custom React hooks
- `src/types/`: TypeScript type definitions
- `src/lib/`: Utility functions

## Socket.IO Patterns
- Service classes for WebSocket management
- Typed message handlers
- Promise-based connection establishment
- Automatic reconnection handling