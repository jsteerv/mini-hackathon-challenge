# Suggested Commands for Archon Development

## Frontend (archon-ui-main)
```bash
# Development
cd archon-ui-main
npm run dev          # Start development server with hot reload

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report

# Linting & Type Checking
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Building
npm run build        # Build for production
npm run preview      # Preview production build
```

## Backend (Python)
```bash
# Development with uv package manager
cd python
uv run python startup.py  # Start backend services

# Testing
uv run pytest                    # Run all tests
uv run pytest tests/ -v          # Run tests with verbose output
uv run pytest --cov             # Run tests with coverage

# Linting & Type Checking
uv run ruff check .             # Run Ruff linter
uv run ruff check . --fix       # Run Ruff with auto-fix
uv run mypy .                   # Run type checking

# Formatting
uv run ruff format .            # Format code
```

## Docker Commands
```bash
# Start all services
docker-compose up --build -d

# Start with documentation
docker-compose -f docker-compose.yml -f docker-compose.docs.yml up --build -d

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart

# Stop services
docker-compose down
```

## Git Commands
```bash
# Common git operations
git status
git diff
git add .
git commit -m "message"
git push origin feature/branch-name
git pull origin main
```

## System Utilities (macOS/Darwin)
```bash
# File operations
ls -la              # List files with details
find . -name "*.py" # Find files by pattern
grep -r "pattern"   # Search in files
rg "pattern"        # Ripgrep (faster search)

# Process management
ps aux | grep archon
pkill -f "process_name"
lsof -i :3737       # Check what's using a port
```