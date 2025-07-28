# Create Archon PRP with Parallel Analysis

## Feature: $ARGUMENTS

Generate a comprehensive PRP for Archon features using parallel specialized agents to analyze UI, server, and Socket.IO impacts. This command orchestrates multiple domain experts to create thorough, service-specific PRPs that ensure successful implementation.

## Parallel Analysis Phase

**IMPORTANT**: Launch all analysis agents simultaneously using the Task tool with multiple invocations to maximize efficiency.

### Agent Coordination

Launch these specialized Archon agents concurrently:

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

## Synthesis & PRP Generation

After all agents complete their analysis:

### 1. Integration Analysis
- Identify touchpoints between services
- Define API contracts between UI and server
- Map Socket.IO events across components
- Plan database migration requirements

### 2. Service-Specific PRPs
Create separate PRPs if the feature requires significant changes across services:

#### UI PRP Structure
```markdown
## Goal
[UI-specific implementation goals from archon-ui-expert]

## Component Architecture
[Component hierarchy and reusability plan]

## State Management
[Local state, context, or external state needs]

## Socket Integration
[Real-time event handling on client side]

## ShadCN Components
[Which ShadCN components to integrate]

## Testing Strategy
[Component tests, integration tests]
```

#### Server PRP Structure
```markdown
## Goal
[Server-specific implementation goals from archon-server-expert]

## API Design
[Endpoints, request/response schemas]

## Service Architecture
[Service layer organization]

## Database Operations
[Supabase queries, migrations]

## Background Tasks
[Async operations, queuing needs]

## Testing Strategy
[Unit tests, API tests]
```

#### Socket.IO PRP Structure
```markdown
## Goal
[Real-time communication goals from archon-socketio-expert]

## Event Architecture
[Event names, payloads, flow]

## Synchronization Strategy
[State consistency approach]

## Performance Optimization
[Batching, compression, throttling]

## Error Handling
[Reconnection, fallbacks]
```

### 3. Unified PRP (for smaller features)
For features that don't require separate PRPs:

```markdown
## Goal
[Overall feature goal synthesized from all agents]

## Why
- [Business value]
- [User impact]
- [Technical benefits]

## What
[Feature description with UI, API, and real-time aspects]

## All Needed Context
### Documentation & References
[Combined from all agent research]

### UI Implementation
[From archon-ui-expert analysis]

### Server Implementation
[From archon-server-expert analysis]

### Socket.IO Implementation
[From archon-socketio-expert analysis]

## Implementation Blueprint
### Task Order
1. Database migrations (if needed)
2. Server API implementation
3. Socket.IO event handlers
4. UI components and integration
5. End-to-end testing

### Integration Points
[How services connect and communicate]

## Validation Loop
### Level 1: Service-Specific
- UI: `npm run lint && npm run test`
- Server: `uv run ruff check . && uv run pytest`

### Level 2: Integration
- API contract testing
- Socket.IO event testing
- End-to-end flows

### Level 3: Performance
- Load testing
- Real-time performance
- UI responsiveness
```

## Validation Phase

After PRP generation, run validation:

```
Agent: prp-validator
Task: Validate generated Archon PRP(s)
Check:
- Completeness of all service implementations
- Integration point coverage
- Testing strategy adequacy
- Risk identification
- Success probability assessment

Return: Validation report with scores and recommendations
```

## Quality Metrics

Score the PRP(s) on:
1. **Service Coverage**: All affected services addressed (UI, Server, Socket)
2. **Integration Clarity**: Clear contracts between services
3. **Implementation Detail**: Specific enough for one-pass success
4. **Risk Mitigation**: Identified and addressed potential issues

Target: 9/10 minimum score across all metrics

## Output

Save PRPs to appropriate locations:
- Single PRP: `PRPs/archon-{feature-name}.md`
- Multiple PRPs: 
  - `PRPs/archon-{feature-name}-ui.md`
  - `PRPs/archon-{feature-name}-server.md`
  - `PRPs/archon-{feature-name}-socketio.md`

## Success Factors

This approach ensures:
- **Complete Analysis**: Every service impact considered
- **Parallel Efficiency**: 4x faster than sequential analysis
- **Domain Expertise**: Specialized agents for each area
- **Integration Focus**: Services work together seamlessly
- **High Success Rate**: Thorough planning prevents rework

Remember: Archon's microservices architecture requires careful coordination. This multi-agent approach ensures all pieces work together perfectly.