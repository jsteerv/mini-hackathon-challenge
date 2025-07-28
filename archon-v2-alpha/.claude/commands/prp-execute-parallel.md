# Execute Archon PRP with Parallel Implementation

## PRP: $ARGUMENTS

Execute Archon PRPs using parallel specialized agents to implement features across UI, server, and Socket.IO services simultaneously. This command orchestrates concurrent implementation with continuous validation and integration checkpoints.

## Execution Strategy

This command enables:
1. **Parallel Service Implementation**: UI, Server, and Socket.IO developed concurrently
2. **Continuous Integration**: Regular sync points between services
3. **Progressive Validation**: Test as you build
4. **Risk Mitigation**: Early detection of integration issues

## Pre-Execution Validation

Before starting implementation:

```
Agent: prp-validator
Task: Pre-flight check for PRP "$ARGUMENTS"
Verify:
- PRP completeness and clarity
- All service specifications present
- Integration points well-defined
- Validation gates executable
- Dependencies available

Return: Go/No-Go decision with readiness report
```

## Parallel Implementation Phase

### Service Implementation Agents

Launch these implementation agents simultaneously:

#### Agent 1: UI Implementation
```
Agent: archon-ui-expert
Task: Implement UI components for "$ARGUMENTS"
Execution:
1. Create component structure
2. Implement TypeScript interfaces
3. Build React components with ShadCN
4. Integrate Socket.IO client events
5. Add state management
6. Write component tests
7. Run validation gates

Context: Follow PRP UI specification exactly
Tools: Read, Write, Edit, MultiEdit, Bash

Return: Implementation status with any blockers
```

#### Agent 2: Server Implementation
```
Agent: archon-server-expert
Task: Implement server features for "$ARGUMENTS"
Execution:
1. Create service modules
2. Implement FastAPI endpoints
3. Add Pydantic models
4. Create database operations
5. Implement business logic
6. Write unit tests
7. Run validation gates

Context: Follow PRP server specification exactly
Tools: Read, Write, Edit, MultiEdit, Bash

Return: Implementation status with API details
```

#### Agent 3: Socket Implementation
```
Agent: archon-socketio-expert
Task: Implement Socket.IO features for "$ARGUMENTS"
Execution:
1. Define event schemas
2. Implement server-side handlers
3. Create client-side listeners
4. Add state synchronization
5. Implement error handling
6. Write event tests
7. Validate real-time flow

Context: Follow PRP Socket.IO specification exactly
Tools: Read, Write, Edit, MultiEdit, Bash

Return: Implementation status with event mappings
```

## Integration Checkpoints

At 25%, 50%, 75%, and 100% completion:

### Integration Validator
```
Agent: prp-validator
Task: Validate integration between services
Check:
- API contracts match between UI and server
- Socket events properly connected
- Data types consistent across services
- Error handling coordinated
- Tests passing for integrated features

Action: If issues found, coordinate fixes between agents
```

## Progressive Testing Strategy

### Level 1: Service Isolation (Continuous)
Each agent runs their service-specific tests:
- UI: `npm run test` after each component
- Server: `uv run pytest` after each endpoint
- Socket: Event emission tests after each handler

### Level 2: Integration Testing (At Checkpoints)
```bash
# Start all services
docker-compose up -d

# Run integration tests
uv run pytest tests/integration/ -v

# Test Socket.IO events
npm run test:e2e
```

### Level 3: End-to-End Validation (At Completion)
```bash
# Full system test
./scripts/test-e2e-archon.sh

# Performance validation
uv run locust -f tests/load_test.py
```

## Coordination Protocol

### 1. Shared Context
All agents have access to:
- PRP specifications
- API contracts (OpenAPI schemas)
- Socket event schemas
- Database models
- Test scenarios

### 2. Communication Points
Agents communicate at:
- API contract changes
- Database schema updates
- Socket event modifications
- Blocking issues
- Test failures

### 3. Conflict Resolution
When conflicts arise:
1. Identify the conflict source
2. Determine service priority
3. Coordinate resolution
4. Update affected services
5. Re-validate integration

## Error Recovery

### Implementation Failures
If an agent encounters blockers:
1. Document the specific issue
2. Attempt automated resolution
3. If unresolved, pause that service
4. Continue other services
5. Coordinate resolution strategy

### Test Failures
When tests fail:
1. Identify failing service
2. Run targeted debugging
3. Fix implementation
4. Re-run validation
5. Verify integration still works

## Completion Criteria

Implementation is complete when:
- ✅ All service tasks completed
- ✅ Unit tests passing (>90% coverage)
- ✅ Integration tests passing
- ✅ E2E scenarios validated
- ✅ Performance benchmarks met
- ✅ No critical issues remaining

## Final Validation

```
Agent: prp-validator
Task: Final implementation validation
Verify:
- All PRP requirements implemented
- Quality gates passed
- Integration fully functional
- Performance acceptable
- Security considerations addressed

Generate: Implementation report with metrics
```

## Output Format

### Progress Updates
```
⚡ Parallel Execution Progress

UI:       ████████░░ 80% - Building dashboard component
Server:   ██████████ 100% - All endpoints implemented
Socket:   ███████░░░ 70% - Implementing state sync

Integration: ✅ Checkpoint 2/4 passed
Tests: 45/52 passing
```

### Completion Report
```
✅ PRP Implementation Complete

Service Status:
- UI: Complete (12 components, 95% coverage)
- Server: Complete (8 endpoints, 92% coverage)
- Socket: Complete (15 events, 88% coverage)

Integration:
- All contracts validated
- E2E tests passing
- Performance benchmarks met

Time Saved: 65% faster than sequential
```

## Parallel Execution Benefits

1. **Speed**: 3-4x faster than sequential implementation
2. **Early Integration**: Issues found and fixed quickly
3. **Resource Efficiency**: Better developer utilization
4. **Risk Reduction**: Continuous validation catches issues early

## Usage Examples

```bash
# Execute single PRP
/prp-execute-parallel PRPs/archon-collaborative-editing.md

# Execute multiple service PRPs
/prp-execute-parallel PRPs/archon-auth-ui.md PRPs/archon-auth-server.md

# Execute with specific validation focus
/prp-execute-parallel PRPs/archon-dashboard.md --strict-validation
```

This parallel execution approach ensures rapid, high-quality implementation of Archon features with continuous validation and integration.