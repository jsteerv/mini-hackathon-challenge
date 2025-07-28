# Validate Archon PRP

## PRP: $ARGUMENTS

Validate Archon PRPs using specialized agents to ensure comprehensive coverage, proper integration design, and high implementation success probability. This command orchestrates domain experts to review PRPs from multiple perspectives.

## Validation Strategy

This command performs multi-dimensional validation:
1. **Service Coverage**: Ensure all affected services are addressed
2. **Integration Integrity**: Verify service communication design
3. **Implementation Feasibility**: Assess realistic implementation
4. **Quality Standards**: Check against Archon best practices

## Parallel Validation Phase

Launch these validation agents simultaneously:

### Agent 1: UI Validation
```
Agent: archon-ui-expert
Task: Validate UI aspects of PRP "$ARGUMENTS"
Review:
- Component design completeness
- TypeScript type safety coverage
- State management approach validity
- ShadCN integration appropriateness
- Performance considerations
- Accessibility requirements
- Testing strategy adequacy

Return: UI validation report with specific issues and recommendations
```

### Agent 2: Server Validation
```
Agent: archon-server-expert
Task: Validate server aspects of PRP "$ARGUMENTS"
Review:
- API design consistency
- FastAPI pattern compliance
- Database operation efficiency
- Error handling completeness
- Async pattern correctness
- Service layer organization
- Testing coverage adequacy

Return: Server validation report with architecture concerns and suggestions
```

### Agent 3: Socket.IO Validation
```
Agent: archon-socketio-expert
Task: Validate real-time aspects of PRP "$ARGUMENTS"
Review:
- Event architecture completeness
- State synchronization strategy
- Error recovery mechanisms
- Performance impact analysis
- Security considerations
- Testing approach for real-time features

Return: Socket.IO validation report with synchronization risks and solutions
```

### Agent 4: Integration Validation
```
Agent: prp-validator
Task: Validate overall PRP integration and quality
Review:
- Cross-service integration points
- API contract completeness
- Testing strategy coverage
- Validation loop executability
- Success criteria measurability
- Risk identification adequacy

Return: Integration validation report with quality scores
```

## Validation Synthesis

After all agents complete validation:

### 1. Compile Issues Matrix
```yaml
Critical Issues:
  - [Issues that block implementation]
  - [Missing essential information]
  - [Architecture conflicts]

Major Concerns:
  - [Issues that increase risk]
  - [Incomplete specifications]
  - [Performance concerns]

Minor Improvements:
  - [Optimization opportunities]
  - [Best practice deviations]
  - [Documentation gaps]
```

### 2. Integration Risk Assessment
```yaml
UI-Server Integration:
  - API contract completeness: [score/10]
  - Type safety coverage: [score/10]
  - Error handling: [score/10]

Server-Socket Integration:
  - Event schema completeness: [score/10]
  - State consistency strategy: [score/10]
  - Performance impact: [score/10]

UI-Socket Integration:
  - Client event handling: [score/10]
  - Optimistic update strategy: [score/10]
  - Reconnection handling: [score/10]
```

### 3. Quality Scoring

Generate comprehensive quality scores:

#### Context Richness (1-10)
- Documentation references: [score]
- Code examples: [score]
- Gotchas identified: [score]
- Overall: [average]

#### Implementation Clarity (1-10)
- Task breakdown: [score]
- Technical detail: [score]
- Integration points: [score]
- Overall: [average]

#### Validation Completeness (1-10)
- Test coverage: [score]
- Validation gates: [score]
- Success criteria: [score]
- Overall: [average]

#### Success Probability (1-10)
- Complexity assessment: [score]
- Risk mitigation: [score]
- Resource adequacy: [score]
- Overall: [average]

### 4. Recommendations Report

```markdown
# Archon PRP Validation Report

## Executive Summary
- Overall Score: [X/10]
- Implementation Readiness: [Ready/Needs Work]
- Estimated Success Probability: [X%]

## Critical Findings
[Top issues that must be addressed]

## Service-Specific Feedback

### UI Implementation
[Findings from archon-ui-expert]

### Server Implementation
[Findings from archon-server-expert]

### Socket.IO Implementation
[Findings from archon-socketio-expert]

## Integration Concerns
[Cross-service issues and risks]

## Recommendations
1. [Specific improvements needed]
2. [Additional context required]
3. [Risk mitigation strategies]

## Next Steps
- [ ] Address critical issues
- [ ] Enhance integration specifications
- [ ] Add missing validation gates
- [ ] Clarify success criteria
```

## Validation Gates

The PRP passes validation if:
- ✅ All critical issues resolved
- ✅ Overall score ≥ 8/10
- ✅ Each service score ≥ 7/10
- ✅ Integration risks identified and mitigated
- ✅ Success probability ≥ 80%

## Iterative Improvement

If validation fails:

1. **Generate Improvement Tasks**
   - List specific changes needed
   - Prioritize by impact
   - Assign to appropriate expert

2. **Request Targeted Research**
   - Identify missing context
   - Specify research areas
   - Delegate to specialists

3. **Re-validate After Updates**
   - Focus on changed sections
   - Verify issue resolution
   - Update scores

## Output Format

### Success Output
```
✅ PRP Validation Passed

Overall Score: 9.2/10
- Context Richness: 9/10
- Implementation Clarity: 9/10
- Validation Completeness: 10/10
- Success Probability: 9/10

Ready for implementation with high confidence.
```

### Failure Output
```
❌ PRP Validation Failed

Overall Score: 6.5/10

Critical Issues:
1. Missing Socket.IO event schemas
2. Incomplete API contract specification
3. No integration test strategy

See detailed report for improvements needed.
```

## Usage Examples

```bash
# Validate a single PRP
/prp-validate-archon PRPs/archon-collaborative-editing.md

# Validate multiple service PRPs
/prp-validate-archon PRPs/archon-auth-*.md

# Validate with specific focus
/prp-validate-archon PRPs/archon-realtime-dashboard.md --focus=socketio
```

This validation ensures Archon PRPs are comprehensive, well-integrated, and ready for successful implementation across all services.