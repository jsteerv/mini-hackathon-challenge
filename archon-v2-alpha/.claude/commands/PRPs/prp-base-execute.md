# Execute BASE PRP

Implement a feature using the PRP file.

## PRP File: $ARGUMENTS

## Execution Process

1. **Load and Analyze PRP**
   - Read the specified PRP file
   - Determine if domain expertise is needed:
     - Backend features → Coordinate with `silo-architect-django`
     - Frontend features → Coordinate with `nextjs-15-expert`
     - Full-stack → Coordinate with both domain experts
   - If context is incomplete, use `prp-context-researcher` for additional research

2. **Planning Phase**
   - Use `prp-executor` agent to create comprehensive implementation plan
   - The executor will:
     - Break down the PRP into clear todos using TodoWrite tool
     - Coordinate with domain experts for architecture decisions
     - Ensure all patterns follow project conventions
     - Create tasks that can be validated at each step

3. **Implementation Phase**
   - Use `prp-executor` agent with domain expert guidance
   - The executor implements code following:
     - PRP blueprint exactly
     - Domain expert architectural recommendations
     - Existing code patterns identified in research
     - Progressive implementation (simple → validated → enhanced)

4. **Validation Phase**
   - Use `prp-validator` agent to run all validation loops
   - The validator will:
     - Execute syntax and style checks
     - Run unit tests and fix failures
     - Perform integration testing
     - Iterate until all validations pass
   - Domain experts review for pattern compliance

5. **Completion**
   - Ensure all PRP checklist items are completed
   - Run final validation suite
   - Get domain expert approval on implementation
   - Report comprehensive completion status

6. **Reference the PRP**
   - You can always reference the PRP again if needed

Note: If validation fails, use error patterns in PRP to fix and retry.
