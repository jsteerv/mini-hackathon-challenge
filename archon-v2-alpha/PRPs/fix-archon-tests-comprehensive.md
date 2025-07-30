# PRP: Fix All Archon Test Failures - Zero Tolerance

## CRITICAL RULE: ANALYZE BEFORE CHANGING ANYTHING

**When a test fails, determine WHY:**

1. **Is it a real bug?** 
   - Would this break user functionality?
   - Does it violate documented behavior?
   - Is data being corrupted or lost?
   - **If YES → Fix the production bug**

2. **Is the test outdated or wrong?**
   - Does it expect old behavior that was intentionally changed?
   - Is it testing internal implementation details instead of behavior?
   - Does it have hardcoded values that don't match reality?
   - **If YES → Fix the test**

3. **Is it a test infrastructure issue?**
   - Missing mocks or fixtures?
   - Wrong test environment setup?
   - Timing/async issues?
   - **If YES → Fix the test setup**

## Goal
Achieve 100% test pass rate across both Python (215 tests) and UI/Vite (592 tests) test suites by fixing whatever is actually broken - whether that's tests, mocks, or real production bugs.
- Python: 72 failed, 128 passed, 15 errors (40% failure rate)
- UI/Vite: 580 failed, 12 passed (98% failure rate)

## Why
- Tests are currently blocking development with ~60% overall failure rate
- Broken tests hide real issues and prevent confident deployment
- Zero failing tests is the only acceptable standard
- Test infrastructure issues are masking actual code problems
- BAD TESTS ARE WORSE THAN NO TESTS

## What
Fix all failing tests by:
1. **Analyzing each failure to determine root cause**
2. **Fixing real bugs in production when found**
3. **Updating outdated test expectations**
4. **Fixing test infrastructure (mocks, fixtures, setup)**

## All Needed Context

### Python Test Failures (87 failures/errors)

#### 1. Test Expectation Mismatches (45 failures)
**THE TESTS ARE WRONG - FIX THE TESTS, NOT THE CODE**
- Tests expecting methods that don't exist in production
- Tests expecting different method signatures than production provides
- Tests expecting different parameter names
- **Example**: Test expects ProjectService to limit titles to 255 chars, but production limits to 256. **FIX THE TEST TO EXPECT 256**
- **Example**: Test expects 'status' parameter that already exists in production with default 'todo'

#### 2. Mock/Fixture Issues (15 errors)
**FIX THE TEST FIXTURES, NOT THE CODE**
- Test fixtures not providing required constructor arguments
- Mock objects missing required attributes
- Test setup not matching production initialization patterns

#### 3. Test Validation Expectations (5 failures)
**THE TESTS HAVE WRONG EXPECTATIONS**
- Test expects 255 char limit, production enforces 256 - **FIX TEST TO EXPECT 256**
- Test expects different validation behavior than production provides
- Tests checking for features that don't exist in production

#### 4. Test Infrastructure Issues (12 failures)
**FIX THE TEST SETUP**
- WebSocket mocks not configured correctly
- Socket.IO test client not initialized properly
- Test environment missing required services
- Mock responses not matching expected format

#### 5. Integration Test Setup (10 failures)
**FIX THE TEST ENVIRONMENT**
- Test database not properly isolated
- Session mocks incomplete
- Service dependencies not mocked correctly
- Test fixtures returning wrong data types

### UI/Vite Test Failures (580 failures)

#### 1. Mock Configuration Issues (300+ failures)
**FIX THE MOCKS IN test/setup.ts**
- Milkdown mock missing `crepe` export
- Tests looking for test IDs that aren't needed - **REMOVE THE TEST ID CHECKS**
- Mock imports not matching production imports

#### 2. Context Provider Issues (150+ failures)
- ThemeContext: localStorage mocking, theme switching
- ToastContext: Display and auto-dismissal
- SettingsContext: Network error handling
- Missing provider wrapping in tests

#### 3. Component Rendering Failures (100+ failures)
- TaskTableView: Cannot find table elements
- GroupCreationModal: Cannot find form elements
- CrawlingProgressCard: Missing stop button
- ProjectPage: Import/export issues

#### 4. Async/Timing Issues (30+ failures)
- useStaggeredEntrance hook timeouts
- WebSocket connection timing
- Animation test failures
- State update race conditions

## Implementation Blueprint

### ANALYSIS PROTOCOL: THINK BEFORE FIXING

For each failing test:
1. **Understand what the test is trying to verify**
2. **Check if this is a legitimate requirement**
3. **Determine if production behavior is correct**
4. **Fix the actual problem:**
   - Real bug → Fix production code
   - Outdated test → Update test expectations
   - Missing mock → Fix test infrastructure

### Phase 1: Fix Python Tests (Day 1-2)

#### Task 1: Fix Test Expectations
```python
# 1. Analyze test expectations
# If test expects create_knowledge_item but production doesn't have it:
# CHECK: What is this test actually testing?
# - Is it testing a documented API? → Production bug, add the method
# - Is it testing internal implementation? → Bad test, remove it
# - Is it testing deprecated functionality? → Update or remove test

# 2. Example: Character limit mismatch
test_boundary_value_testing():
    # Test expects 255, production enforces 256
    # CHECK: What does the database schema say?
    # CHECK: What's documented for users?
    # CHECK: What makes sense for the feature?
    # Then fix whichever is wrong

# 3. Example: Missing method in production
# Test calls service.create_knowledge_item()
# CHECK: Is this in the API documentation?
# CHECK: Do other parts of the system need this?
# CHECK: Was this removed intentionally?
# Fix based on findings, not assumptions
```

#### Task 2: Fix Test Fixtures
```python
# 1. Fix test initialization
@pytest.fixture
def code_extraction_service(in_memory_supabase_client):
    # Provide the required supabase_client argument
    return CodeExtractionService(supabase_client=in_memory_supabase_client)

# 2. Fix mock imports in conftest.py
# Don't add get_supabase_client to production
# Mock it in the test:
with patch('module.get_supabase_client', return_value=mock_client):
    # run test
```

#### Task 3: Fix WebSocket Test Setup
```python
# 1. Fix test mocks
# If test expects store_document_chunks_sync:
with patch('module.store_document_chunks_sync') as mock_store:
    mock_store.return_value = expected_result
    # run test

# 2. Fix Socket.IO test client
# Don't change production error handling
# Fix the test to properly capture emitted events:
class SocketIOTestClient:
    def __init__(self):
        self.emitted_events = []
    
    async def emit(self, event, data, **kwargs):
        self.emitted_events.append((event, data))
```

### Phase 2: Fix UI Tests (Day 2-3)

#### Task 1: Fix Mock Configurations - DO NOT ADD TEST IDS TO PRODUCTION
```typescript
// 1. Fix Milkdown mock in test/setup.ts
vi.mock('@milkdown/crepe', () => {
  const mockInstance = {
    create: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    getMarkdown: vi.fn(() => ''),
    setMarkdown: vi.fn(),
    action: vi.fn(),
    use: vi.fn(),
    config: vi.fn()
  }
  
  return {
    Crepe: vi.fn(() => mockInstance),
    crepe: mockInstance, // Critical fix
    CrepeFeature: {
      HeaderMeta: 'HeaderMeta',
      LinkTooltip: 'LinkTooltip',
      ImageBlock: 'ImageBlock',
      BlockEdit: 'BlockEdit',
      ListItem: 'ListItem',
      CodeBlock: 'CodeBlock',
      Table: 'Table',
      Toolbar: 'Toolbar',
    }
  }
})

// 2. Fix lucide-react mock
const createMockIcon = (name: string) => 
  vi.fn(({ 'data-testid': testId, ...props }) => 
    React.createElement('span', { 
      'data-testid': testId || `${name.toLowerCase()}-icon`, 
      ...props 
    }, name)
  )
```

#### Task 2: Fix Test Selectors - DO NOT ADD TEST IDS
```typescript
// DO NOT add data-testid to production components!
// Instead, fix the tests to use better selectors:

// Bad test (requires test ID):
const editor = screen.getByTestId('milkdown-editor')

// Good test (uses accessible queries):
const editor = screen.getByRole('textbox')
// or
const editor = container.querySelector('.milkdown-editor')
```

#### Task 3: Fix Context Providers
```typescript
// Create comprehensive test wrapper
const AllTheProviders = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ToastProvider>
  </ThemeProvider>
)

// Update test utils
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })
```

#### Task 4: Fix Async Issues
```typescript
// Fix useStaggeredEntrance
const useStaggeredEntrance = () => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 0)
    return () => clearTimeout(timer)
  }, [])
  
  return { isVisible, variants: {} }
}
```

### Phase 3: Integration & Validation (Day 3-4)

#### Task 1: Create Shared Test Infrastructure
```typescript
// Shared test data
export const testFixtures = {
  projects: {
    valid: { id: 'test-1', title: 'Test Project' },
    invalid: { id: '', title: '' }
  },
  socketEvents: {
    progress: { type: 'crawl:progress', data: { percentage: 50 } }
  }
}
```

#### Task 2: Run Progressive Test Fixes
```bash
# Python tests - fix in order
1. pytest tests/server/test_basic.py -v
2. pytest tests/server/test_api_endpoints.py -v
3. pytest tests/server/test_edge_cases_and_errors.py -v
4. pytest tests/server/test_integration_services.py -v
5. pytest tests/server/test_knowledge_base_services.py -v
6. pytest tests/server/test_socketio*.py -v
7. pytest tests/server/test_mcp*.py -v

# UI tests - fix in order
1. npm test -- test/setup.test.ts
2. npm test -- test/contexts/
3. npm test -- test/components/ui/
4. npm test -- test/components/
5. npm test -- test/pages/
6. npm test -- test/services/
7. npm test -- test/integration/
```

## Validation Loop

### CRITICAL: Verify No Production Changes
```bash
# Before starting any fixes:
git diff --name-only | grep -E "\.(py|ts|tsx|js|jsx)$" | grep -v test
# This should return NOTHING - no production files changed

# If any production files show up, REVERT THEM:
git checkout -- <production-file>
```

### Level 1: Unit Test Validation
```bash
# Python
uv run pytest -v --tb=short --no-header | grep -E "(PASSED|FAILED|ERROR)"
# Expected: 215 passed, 0 failed, 0 errors

# UI
npm test -- run --reporter=dot | grep -E "(passed|failed)"
# Expected: 592 passed, 0 failed
```

### Level 2: Coverage Validation
```bash
# Python coverage
uv run pytest --cov=src --cov-report=term-missing

# UI coverage
npm run test:coverage
```

### Level 3: CI/CD Validation
```bash
# Run full test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Success Criteria
1. **Python Tests**: 215/215 tests passing (100%)
2. **UI Tests**: 592/592 tests passing (100%)
3. **Coverage**: Maintain or improve current coverage levels
4. **Performance**: Tests complete in under 2 minutes
5. **Stability**: No flaky tests, consistent results
6. **ZERO PRODUCTION CHANGES**: Not a single production file modified

## Risk Mitigation
1. **Backup Current State**: Create branch before fixes
2. **Progressive Fixes**: Fix one category at a time
3. **Validate Each Fix**: Run tests after each change
4. **Document Changes**: Update test documentation
5. **Monitor Performance**: Ensure fixes don't slow tests

## Emergency Rollback
If fixes break functionality:
```bash
git checkout main
git branch -D test-fixes
```

## Notes
- **ANALYZE BEFORE FIXING** - Understand why the test is failing
- Some test failures reveal real bugs that need production fixes
- Some test failures reveal outdated or wrong tests
- Focus on fixing the actual problem, not just making tests green
- Document your analysis for each significant fix

## Decision Framework for Each Failure

### Example 1: Progress ranges (0,0)
- **Analysis**: Test expects 'starting' stage with (0,0) range
- **Question**: Does a 0-0 progress range make any sense?
- **Answer**: No, it's useless for progress tracking
- **Decision**: This is a bad test expectation → Fix the test

### Example 2: Missing create_knowledge_item method
- **Analysis**: Multiple tests call this method but it doesn't exist
- **Question**: Is this part of the documented API? Do users need it?
- **Answer**: Check API docs and user requirements
- **Decision**: If needed → Add to production. If not → Fix tests

### Example 3: Character limit 255 vs 256
- **Analysis**: Test expects 255, code enforces 256
- **Question**: What's the database constraint? What's documented?
- **Answer**: Check schema and documentation
- **Decision**: Fix whichever doesn't match the requirement

### Example 4: Missing data-testid
- **Analysis**: Test looks for data-testid="stop-button"
- **Question**: Is this the best way to find this element?
- **Answer**: Usually no - use accessible queries
- **Decision**: Update test to use better selectors

This PRP ensures 100% test pass rate by fixing the RIGHT things - whether that's tests, mocks, or actual bugs.