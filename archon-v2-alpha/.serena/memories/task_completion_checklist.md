# Task Completion Checklist

When completing any coding task in the Archon project:

## Frontend (TypeScript/React)
1. **Run linting**: `npm run lint` in archon-ui-main directory
2. **Run tests**: `npm run test` to ensure no regressions
3. **Type checking**: TypeScript compiler will check during build
4. **Verify UI**: Test the UI changes at http://localhost:3737

## Backend (Python)
1. **Run tests**: `pytest` in python directory
2. **Type hints**: Ensure all new functions have proper type annotations
3. **Pydantic models**: Validate data structures are properly defined
4. **API testing**: Test endpoints via Swagger UI or curl
5. **Check logs**: Monitor service logs for errors

## General
1. **No hardcoded values**: Use environment variables for configuration
2. **Update .env.example**: If new env vars are added
3. **Docker rebuild**: If dependencies changed, rebuild containers
4. **Documentation**: Update README if adding new features
5. **Git status**: Check for untracked files before committing

## Important Notes
- No dedicated formatter found (no black, ruff, prettier configs)
- ESLint is configured for frontend linting
- Tests are critical - both frontend and backend have test suites