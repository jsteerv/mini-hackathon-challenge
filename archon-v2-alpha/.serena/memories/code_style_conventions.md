# Code Style and Conventions

## TypeScript/React (Frontend)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with clsx for conditional classes
- **State Management**: Local state with React hooks
- **Data Fetching**: Custom hooks with fetch API
- **Component Structure**: Functional components with TypeScript interfaces
- **File Naming**: PascalCase for components (e.g., `DocsTab.tsx`), camelCase for utilities
- **Imports**: Absolute imports from `@/` alias for src directory

## Python (Backend)
- **Style Guide**: PEP 8 enforced by Ruff
- **Type Hints**: Required, enforced by Mypy with strict mode
- **Async**: Heavy use of async/await for FastAPI endpoints
- **Docstrings**: Google-style docstrings
- **File Structure**: 
  - `src/` for source code
  - `tests/` for test files
  - `docs/` for documentation
- **Naming Conventions**:
  - snake_case for functions and variables
  - PascalCase for classes
  - UPPER_CASE for constants

## Testing Conventions
- **Frontend**: Vitest with React Testing Library
- **Backend**: Pytest with async support
- **Coverage Requirements**: Aim for 80%+ coverage
- **Test File Naming**: 
  - Frontend: `ComponentName.test.tsx`
  - Backend: `test_module_name.py`

## Git Conventions
- **Branch Naming**: `feature/description`, `fix/description`, `docs/description`
- **Commit Messages**: Clear, concise descriptions of changes
- **PR Process**: All changes go through pull requests