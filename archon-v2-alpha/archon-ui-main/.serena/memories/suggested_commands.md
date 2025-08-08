# Suggested Commands

## Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing
```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests with coverage (force)
npm run test:coverage:force
```

## Quality Assurance
```bash
# Lint code
npm run lint

# Type checking (use TypeScript compiler)
npx tsc --noEmit
```

## Project Management
```bash
# Seed project data
npm run seed:projects
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la                    # List files with details
find . -name "*.ts"       # Find TypeScript files
grep -r "pattern" src/    # Search in source files

# Git operations
git status
git add .
git commit -m "message"
git push

# Process management
ps aux | grep node        # Find Node processes
kill -9 <pid>            # Kill process
```