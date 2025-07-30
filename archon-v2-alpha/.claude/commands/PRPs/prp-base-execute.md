# Execute BASE PRP

Implement a feature using the PRP file.

## PRP File: $ARGUMENTS

## Execution Process

1. **Load and Analyze PRP**
   - Read the specified PRP file
   - Check if working within Archon project:
     - If yes, use `archon-task-manager` to find related tasks
     - Verify tasks are created and assigned
     - Check task dependencies and priorities
   - Determine if domain expertise is needed:
     - Backend features → Coordinate with `archon-server-expert`
     - Frontend features → Coordinate with `archon-ui-expert`
     - Real-time features → Coordinate with `archon-socketio-expert`
     - Full-stack → Coordinate with multiple domain experts
   - If context is incomplete, use `prp-context-researcher` for additional research

2. **Planning Phase**
   - If in Archon project:
     - Tasks already created during PRP creation
     - Use `archon-task-manager` to coordinate execution
     - Launch agents based on task assignments
   - Otherwise:
     - Use `prp-executor` agent to create implementation plan
     - Break down into todos using TodoWrite tool
   - Coordinate with domain experts for architecture decisions
   - Ensure all patterns follow project conventions

3. **Implementation Phase**
   - If in Archon project:
     - Agents claim tasks (todo → doing) before starting
     - Update task progress during implementation
     - Move tasks to review when complete
   - Use appropriate agents based on task type:
     - `prp-executor` for general implementation
     - `archon-server-expert` for API endpoints
     - `archon-ui-expert` for React components
     - `archon-socketio-expert` for real-time features
   - Implementation follows:
     - PRP blueprint exactly
     - Domain expert architectural recommendations
     - Existing code patterns identified in research
     - Progressive implementation (simple → validated → enhanced)

4. **Validation Phase**
   - If in Archon project:
     - Tasks in "review" status automatically trigger `prp-validator`
     - Validator updates task to "done" if passed, or back to "doing" if fixes needed
   - Use `prp-validator` agent to run all validation loops
   - The validator will:
     - Execute syntax and style checks
     - Run unit tests and fix failures
     - Perform integration testing
     - Iterate until all validations pass
     - Update task status based on results
   - Domain experts review for pattern compliance

5. **Completion**
   - Ensure all PRP checklist items are completed
   - Run final validation suite
   - Get domain expert approval on implementation
   - Report comprehensive completion status

6. **Reference the PRP**
   - You can always reference the PRP again if needed

Note: If validation fails, use error patterns in PRP to fix and retry.
