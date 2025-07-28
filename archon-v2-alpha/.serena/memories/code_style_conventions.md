# Code Style and Conventions

## Python Backend
- **Python 3.12+** with type hints extensively used
- **Async/await** patterns throughout (FastAPI, asyncio)
- **Pydantic** models for data validation and serialization
- **Module structure**: Organized by feature (services, fastapi, config, utils)
- **Naming**: snake_case for functions/variables, PascalCase for classes
- **Error handling**: Structured exceptions with proper logging
- **Dependency injection**: Used in FastAPI endpoints

## TypeScript/React Frontend
- **TypeScript** with strict typing
- **React 18** with functional components and hooks
- **Component structure**: Feature-based organization
- **Styling**: Tailwind CSS with clsx for conditional classes
- **State management**: React hooks and context
- **Naming**: camelCase for functions/variables, PascalCase for components

## General Conventions
- Configuration via environment variables
- Docker-based deployment with microservices
- Health checks for all services
- Structured logging with logfire
- No hardcoded secrets or API keys