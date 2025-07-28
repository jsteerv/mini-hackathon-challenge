# Suggested Development Commands

## Running the Project
```bash
# Start all services
docker-compose up --build -d

# Start with documentation
docker-compose -f docker-compose.yml -f docker-compose.docs.yml up --build -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

## Frontend Development
```bash
cd archon-ui-main

# Development server with hot reload
npm run dev

# Linting
npm run lint

# Testing
npm run test
npm run test:coverage

# Build for production
npm run build
```

## Python Backend Development
```bash
cd python

# Run tests
pytest

# Run specific test file
pytest tests/server/test_specific.py

# Development mode (from docker-compose.yml)
python -m uvicorn src.server.main:socket_app --host 0.0.0.0 --port 8181 --reload
```

## System Commands (Darwin/macOS)
- `ls -la` - List files with details
- `grep -r "pattern" .` - Search recursively
- `find . -name "*.py"` - Find files by pattern
- `git status` - Check git status
- `docker ps` - List running containers