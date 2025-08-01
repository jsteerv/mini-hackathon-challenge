# Validate Archon Implementation

## Request: $ARGUMENTS

Use agent-organizer to validate: $ARGUMENTS

The agent-organizer will:
1. Analyze what needs to be validated
2. Determine validation requirements from the context (PRP, task requirements, etc.)
3. Orchestrate appropriate testing and validation agents
4. Run all necessary validation gates
5. Coordinate fixes for any failures

The agent-organizer will intelligently select validation approaches:
- For code: syntax checks, unit tests, integration tests
- For features: functional validation, user acceptance criteria
- For performance: benchmarks and metrics
- For security: vulnerability scans and compliance checks

It will update task status in Archon based on validation results and coordinate any necessary fixes with appropriate specialists.