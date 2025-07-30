# Create Archon PRP with Parallel Analysis

## Feature: $ARGUMENTS

Create a comprehensive Archon project with PRP by using parallel specialized agents to analyze UI, server, and Socket.IO impacts. This command orchestrates multiple domain experts to gather requirements, then passes their analysis to the project orchestrator for unified project creation.

## Parallel Analysis Phase

**IMPORTANT**: Launch all analysis agents simultaneously using the Task tool with multiple invocations to maximize efficiency.

### Agent Coordination

Launch these specialized Archon agents concurrently to gather requirements:

#### Agent 1: UI Analysis
```
Agent: archon-ui-expert
Task: Analyze UI requirements for "$ARGUMENTS"
Focus:
- Component architecture and reusability
- ShadCN UI integration opportunities
- State management requirements
- Socket.IO client integration needs
- TypeScript interfaces and types
- User experience considerations
- Performance optimization strategies

Return: Comprehensive UI implementation plan with component structure, state management approach, and integration points.
```

#### Agent 2: Server Analysis
```
Agent: archon-server-expert
Task: Analyze server requirements for "$ARGUMENTS"
Focus:
- API endpoint design
- FastAPI implementation patterns
- Database schema changes
- Supabase integration requirements
- Service layer architecture
- Background task needs
- Performance and scaling considerations

Return: Detailed server implementation plan with API contracts, service patterns, and database operations.
```

#### Agent 3: Socket.IO Analysis
```
Agent: archon-socketio-expert
Task: Analyze real-time requirements for "$ARGUMENTS"
Focus:
- Event architecture design
- Bidirectional communication needs
- State synchronization strategy
- Room/namespace requirements
- Performance optimization
- Error handling and reconnection
- Event ordering and consistency

Return: Complete Socket.IO implementation strategy with event schemas and synchronization patterns.
```

#### Agent 4: Context Research
```
Agent: prp-researcher
Task: Research implementation context for "$ARGUMENTS"
Focus:
- Existing Archon patterns to follow
- External documentation and best practices
- Similar features in the codebase
- Integration requirements
- Testing strategies
- Known gotchas and solutions

Return: Comprehensive context including documentation references, code examples, and implementation patterns.
```

## Project Creation with Orchestrator

After all agents complete their analysis:

### 1. Synthesize Analysis Results
Compile the results from all analysis agents into a unified understanding:
- UI requirements and component architecture
- Server API design and database needs  
- Socket.IO real-time event architecture
- Implementation context and patterns

### 2. Hand Off to Project Orchestrator

```
Agent: archon-project-orchestrator
Task: Create Archon project for "$ARGUMENTS"
Input: 
  - UI Analysis: [Results from archon-ui-expert]
  - Server Analysis: [Results from archon-server-expert]
  - Socket.IO Analysis: [Results from archon-socketio-expert]
  - Context Research: [Results from prp-context-researcher]
  
Instructions:
1. Create new Archon project with appropriate title and description
2. Generate comprehensive PRP document from the analysis results
3. Add PRP as project document with proper metadata
4. Create prioritized task breakdown with correct task_order (1 = highest priority)
5. Assign tasks to appropriate specialized agents
6. Ensure no duplicate work - use the analysis provided, don't regenerate

Return: Project creation summary with project ID, PRP document ID, and task list
```

### 3. Expected Orchestrator Actions

The orchestrator will:
- Create the Archon project structure
- Synthesize analysis into a unified PRP document
- Store PRP in project docs with version control
- Generate tasks with proper priorities (1, 2, 3, 4, 5, 6)
- Assign agents based on task expertise requirements
- Provide clear next steps for implementation

## Quality Assurance

The orchestrator ensures:
1. **No Duplicate Work**: Analysis results are used, not regenerated
2. **Correct Task Priority**: Tasks ordered 1-N (1 = highest priority)
3. **Complete Coverage**: All services addressed (UI, Server, Socket.IO)
4. **Clear Agent Assignment**: Right agent for each task
5. **Traceability**: PRP linked to project and tasks

## Workflow Summary

```yaml
Step 1: Parallel Analysis
  - archon-ui-expert → UI requirements
  - archon-server-expert → Server design
  - archon-socketio-expert → Real-time architecture
  - prp-context-researcher → Implementation context

Step 2: Project Creation
  - archon-project-orchestrator receives all analysis
  - Creates project with synthesized PRP
  - Generates tasks with correct priorities
  - No duplicate PRP generation

Step 3: Implementation Ready
  - Project created in Archon
  - PRP document stored and versioned
  - Tasks assigned to appropriate agents
  - Clear execution order established
```

## Success Factors

This improved workflow ensures:
- **No Duplication**: Each agent does their specific job once
- **Parallel Efficiency**: 4x faster analysis phase
- **Correct Priorities**: Tasks execute in logical order
- **Clear Handoffs**: Analysis → Orchestration → Implementation
- **Single Source of Truth**: One project, one PRP, one task list

Remember: The orchestrator ORCHESTRATES - it doesn't duplicate the analysis work already done.