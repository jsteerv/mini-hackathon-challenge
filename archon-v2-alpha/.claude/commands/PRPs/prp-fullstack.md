# Full-Stack PRP Creation and Execution

## Feature: $ARGUMENTS

Specialized command for full-stack features that require coordination between frontend and backend systems. This command orchestrates all domain experts and PRP agents for comprehensive implementation.

## Full-Stack Coordination Process

### Phase 1: Parallel Domain Analysis
```
Simultaneously invoke:
- silo-architect-django → Backend architecture analysis
- nextjs-15-expert → Frontend component analysis

Domain experts identify:
- API endpoints needed
- Data models and serializers
- React components and state management
- Integration points between systems
```

### Phase 2: Unified Context Research
```
Use prp-context-researcher with findings from BOTH domain experts:
- Backend patterns and Django conventions
- Frontend patterns and React/Next.js conventions
- API contract specifications
- WebSocket requirements (if real-time features)
- Authentication flow between systems
```

### Phase 3: Integrated PRP Creation
```
Use prp-creator to build a PRP that includes:
- Separate sections for backend and frontend
- Clear API contracts between systems
- Synchronized validation loops
- Integration testing requirements
```

### Phase 4: Parallel Implementation
```
Execute implementation in parallel:
- Backend: prp-executor + silo-architect-django
- Frontend: prp-executor + nextjs-15-expert

Synchronization points:
- API contract implementation first
- Mock data for frontend development
- Integration testing after both complete
```

### Phase 5: Full-Stack Validation
```
Use prp-validator for comprehensive testing:
- Backend API tests
- Frontend component tests
- End-to-end integration tests
- Cross-system data flow validation
```

## Example Full-Stack Features

1. **User Authentication System**
   - Backend: JWT tokens, user models, auth endpoints
   - Frontend: Login/register forms, auth context, protected routes

2. **Product Search with Filters**
   - Backend: Search API, filter query parameters, pagination
   - Frontend: Search UI, filter components, result display

3. **Real-time Notifications**
   - Backend: WebSocket consumers, notification models
   - Frontend: WebSocket hooks, notification UI, real-time updates

4. **Shopping Cart System**
   - Backend: Cart API, session management, order processing
   - Frontend: Cart UI, checkout flow, payment integration

## Success Criteria

Full-stack PRPs must include:
- [ ] API contract specification
- [ ] Backend implementation plan
- [ ] Frontend implementation plan
- [ ] Integration test scenarios
- [ ] Data flow documentation
- [ ] Error handling for both systems
- [ ] Performance considerations

## Output

The command will create:
- Main PRP: `PRPs/{feature-name}-fullstack.md`
- API spec: `PRPs/{feature-name}-api-contract.md` (if needed)

## Benefits

This specialized command ensures:
1. **Synchronized Development**: Backend and frontend align from the start
2. **Reduced Integration Issues**: API contracts defined upfront
3. **Parallel Work**: Teams can work simultaneously with mocks
4. **Comprehensive Testing**: Full-stack validation included
5. **Domain Expertise**: Both systems follow best practices

Remember: Full-stack features require coordination, not just implementation. Let the domain experts guide architecture while PRP agents ensure systematic execution.