# Task Completion Checklist

When completing any development task in Archon, follow these steps:

## Frontend Tasks (React/TypeScript)
1. **Code Quality**:
   ```bash
   cd archon-ui-main
   npm run lint         # Fix any linting errors
   npm run type-check   # Ensure no TypeScript errors
   ```

2. **Testing**:
   ```bash
   npm run test         # Run all tests
   npm run test:coverage # Check coverage meets requirements
   ```

3. **Build Verification**:
   ```bash
   npm run build        # Ensure production build succeeds
   ```

## Backend Tasks (Python)
1. **Code Quality**:
   ```bash
   cd python
   uv run ruff check . --fix    # Fix linting issues
   uv run ruff format .         # Format code
   uv run mypy . --strict       # Check type hints
   ```

2. **Testing**:
   ```bash
   uv run pytest tests/ -v      # Run all tests
   uv run pytest --cov          # Check test coverage
   ```

## General Tasks
1. **Documentation**: Update relevant documentation if APIs or features changed
2. **Git**: Commit changes with clear message describing what was done
3. **Testing**: Manually test the feature/fix in the running application
4. **Review**: Self-review changes before marking task complete

## Docker Tasks
If changes affect Docker setup:
```bash
docker-compose build         # Rebuild affected containers
docker-compose up -d         # Restart services
docker-compose logs -f       # Check for any errors
```

## Important Notes
- Always run linting and type checking before committing
- Never commit code with failing tests
- Update task status in Archon MCP when moving between stages
- If you find additional issues while working, create new tasks rather than expanding scope