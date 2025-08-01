# Execute Archon PRP

## Request: $ARGUMENTS

Use agent-organizer to execute: $ARGUMENTS

The agent-organizer will:
1. Analyze the request to determine what needs to be executed
2. If it's a PRP execution, load the PRP and analyze implementation tasks
3. Intelligently select and coordinate appropriate agents for parallel execution
4. Monitor progress through Archon task management
5. Handle dependencies and coordinate validation

The agent-organizer will decide which agents to use based on:
- The technology stack involved
- The type of implementation needed
- The complexity and dependencies
- The validation requirements

It will update task status in Archon as work progresses and handle any issues that arise during execution.