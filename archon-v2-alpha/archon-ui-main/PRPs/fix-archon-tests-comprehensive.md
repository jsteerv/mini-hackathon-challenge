# Fix Archon Tests Comprehensive PRP

## Goal
Fix all failing unit tests in Archon UI and Python server, implement database isolation to prevent production contamination, add comprehensive test coverage for new features, and create a beautiful test dashboard UI that displays pytest and vitest output in a summarized, actionable format.

## Why
- **Failing Tests Block Development**: 383 out of 928 UI tests are failing (41.3% failure rate)
- **Production Database Contamination**: Tests create unwanted DB writes, test projects, and blank crawled documents
- **Missing Coverage**: Zero test coverage for new features (RAG, projects, tasks, WebSocket)
- **No Visibility**: Current test execution lacks pretty reporting and real-time progress visualization
- **Regression Risk**: Without working tests, we can't validate changes or prevent regressions

## What
A comprehensive test infrastructure overhaul that includes:
1. Immediate fixes for all failing tests (port configuration, mocks)
2. Complete database isolation using transaction rollback patterns
3. Test coverage for all new features with >80% coverage target
4. Beautiful test dashboard with real-time progress and export capabilities
5. Integration with validation loops for continuous quality assurance

## All Needed Context

### Documentation & References
- **Vitest Config**: `archon-ui-main/vitest.config.ts:17-45` - Current test configuration
- **Test Setup**: `archon-ui-main/test/setup.ts:1-120` - Comprehensive mock setup
- **Pytest Config**: `python/pytest.ini:1-15` - Python test configuration
- **Test Safety**: `python/tests/test_safety.py:1-45` - Database isolation patterns
- **TestStatus Component**: `archon-ui-main/src/components/settings/TestStatus.tsx:1-450` - Existing test UI

### Current Test Infrastructure
**UI Tests (Vitest)**:
- Location: `archon-ui-main/test/`
- Status: 383 failed / 544 passed / 928 total
- Duration: 91.20s
- Coverage: JSON and HTML reports configured

**Python Tests (Pytest)**:
- Location: `python/tests/`
- Missing dependency: `docker` module
- Database contamination issues
- No coverage for new features

### Root Cause Analysis
1. **Port Mismatch**: Tests expect `localhost:8080` but server runs on `8181`
2. **Missing Mocks**: `agentChatService` methods not properly mocked
3. **Database Writes**: No isolation, tests write directly to production
4. **Async Issues**: Inconsistent async/await patterns in tests

### Implementation Patterns

#### Database Isolation Pattern
```python
@pytest.fixture(scope='function')
def isolated_db():
    """Database session with automatic rollback"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```

#### Socket.IO Mock Pattern
```typescript
export class MockSocketIOClient {
  private handlers = new Map<string, Set<Function>>();
  
  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return this;
  }
  
  simulateServerEvent(event: string, data: any) {
    this.handlers.get(event)?.forEach(h => h(data));
  }
}
```

#### Test Dashboard Data Model
```typescript
interface TestDashboardState {
  executions: Map<string, TestExecution>;
  progressData: Map<string, TestProgressData>;
  liveResults: Map<string, TestResult[]>;
  history: TestHistoryData;
  coverage: CoverageMetrics;
}

interface TestProgressData {
  testType: 'mcp' | 'ui';
  phase: 'collecting' | 'running' | 'completed';
  current: number;
  total: number;
  currentFile?: string;
  estimatedTimeRemaining: number;
}
```

### Known Gotchas
1. **Port Configuration**: Must update all test expectations from 8080 to 8181
2. **Docker Module**: Use optional import pattern to avoid CI failures
3. **ShadCN Components**: Need data-testid attributes for reliable testing
4. **Async Tests**: Always use proper async/await with waitFor
5. **Database Cleanup**: Must implement proper transaction boundaries

## Implementation Blueprint

### Phase 1: Critical Infrastructure Fixes (URGENT - Day 1)

#### Task 1.1: Fix Port Configuration Mismatch
**File**: `archon-ui-main/test/setup.ts`
```typescript
// Line 15-20 - Update environment configuration
beforeAll(() => {
  process.env.ARCHON_SERVER_PORT = '8181';
  import.meta.env.VITE_API_URL = '';
  import.meta.env.ARCHON_SERVER_PORT = '8181';
});
```

**Files to Update**:
- `test/services/api.test.ts` - Replace all "8080" with "8181"
- `test/services/mcpService.test.ts` - Update port references
- `test/services/mcpServerService.test.ts` - Fix hardcoded URLs
- `test/services/mcpClientService.test.ts` - Update expectations

#### Task 1.2: Fix Missing Mock Implementations
**File**: `archon-ui-main/test/services/agentChatService.test.ts`
```typescript
// Add missing mock return values
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ 
    session_id: mockSessionId,
    messages: [] // Add missing property
  })
});
```

#### Task 1.3: Add Missing Dependencies
**File**: `python/pyproject.toml`
```toml
[project.optional-dependencies]
test = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "pytest-timeout>=2.3.0",
    "docker>=7.0.0",  # Add this
    "factory-boy>=3.3.0",  # Add this
]
```

### Phase 2: Database Isolation Implementation (URGENT - Day 2)

#### Task 2.1: Create InMemorySupabaseClient
**File**: `python/tests/mocks/in_memory_supabase.py`
```python
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
import uuid
from datetime import datetime

@dataclass
class InMemoryTable:
    name: str
    data: List[Dict[str, Any]] = field(default_factory=list)
    
    def insert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if 'id' not in data:
            data['id'] = str(uuid.uuid4())
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        self.data.append(data)
        return data
    
    def select(self, columns: str = "*") -> 'QueryBuilder':
        return QueryBuilder(self.data, columns)

class InMemorySupabaseClient:
    def __init__(self):
        self.tables: Dict[str, InMemoryTable] = {}
    
    def table(self, name: str) -> InMemoryTable:
        if name not in self.tables:
            self.tables[name] = InMemoryTable(name)
        return self.tables[name]
    
    def reset(self):
        """Clear all data for test isolation"""
        self.tables.clear()
```

#### Task 2.2: Update Test Fixtures
**File**: `python/tests/conftest.py`
```python
@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    """Automatically mock Supabase for all tests"""
    mock_client = InMemorySupabaseClient()
    
    def mock_create_client(*args, **kwargs):
        return mock_client
    
    monkeypatch.setattr("supabase.create_client", mock_create_client)
    yield mock_client
    mock_client.reset()
```

### Phase 3: Add Test Coverage for New Features (HIGH - Days 3-5)

#### Task 3.1: RAG Feature Tests
**File**: `archon-ui-main/test/components/knowledge-base/RAGQueryPanel.test.tsx`
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RAGQueryPanel } from '@/components/knowledge-base/RAGQueryPanel';

describe('RAGQueryPanel', () => {
  it('should execute query on submit', async () => {
    const user = userEvent.setup();
    render(<RAGQueryPanel />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await user.type(input, 'How do I use MCP?');
    await user.click(screen.getByRole('button', { name: /search/i }));
    
    await waitFor(() => {
      expect(mockRAGService.query).toHaveBeenCalledWith('How do I use MCP?');
    });
  });
  
  it('should display loading state during query', async () => {
    mockRAGService.query.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const user = userEvent.setup();
    render(<RAGQueryPanel />);
    
    await user.click(screen.getByRole('button', { name: /search/i }));
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Task 3.2: Project Management Tests
**File**: `python/tests/services/test_project_service.py`
```python
import pytest
from unittest.mock import Mock, AsyncMock
from src.services.project_service import ProjectService

@pytest.mark.asyncio
async def test_create_project(mock_supabase):
    service = ProjectService(mock_supabase)
    
    project_data = {
        "title": "Test Project",
        "description": "Test Description",
        "github_repo": "https://github.com/test/repo"
    }
    
    result = await service.create_project(project_data)
    
    assert result["title"] == "Test Project"
    assert "id" in result
    assert "created_at" in result
    
    # Verify no real DB write
    assert len(mock_supabase.tables) == 1
    assert "projects" in mock_supabase.tables
```

### Phase 4: Build Test Dashboard UI (MEDIUM - Days 6-7)

#### Task 4.1: Create Test Dashboard Component
**File**: `archon-ui-main/src/components/settings/TestDashboard.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { socketIOService } from '@/services/socketIOService';
import { testService } from '@/services/testService';

interface TestDashboardProps {
  className?: string;
}

export function TestDashboard({ className }: TestDashboardProps) {
  const [executions, setExecutions] = useState<Map<string, TestExecution>>(new Map());
  const [activeExecution, setActiveExecution] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<TestProgressData | null>(null);
  
  useEffect(() => {
    const socket = socketIOService.getSocket();
    
    socket.on('test:progress', (data: TestProgressData) => {
      setProgressData(data);
    });
    
    socket.on('test:complete', (data: TestExecutionResult) => {
      setExecutions(prev => new Map(prev).set(data.id, data));
      setActiveExecution(null);
    });
    
    return () => {
      socket.off('test:progress');
      socket.off('test:complete');
    };
  }, []);
  
  const runTests = async (testType: 'all' | 'ui' | 'python') => {
    const executionId = await testService.runTests({ type: testType });
    setActiveExecution(executionId);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-500">
              {progressData?.successRate || 0}%
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-500">
              {progressData?.coverage || 0}%
            </div>
            <p className="text-sm text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-500">
              {progressData?.duration || 0}s
            </div>
            <p className="text-sm text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Test Execution */}
      <Card>
        <CardHeader>
          <CardTitle>Test Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => runTests('all')}
              disabled={!!activeExecution}
            >
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTests('ui')}
              disabled={!!activeExecution}
            >
              UI Tests Only
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runTests('python')}
              disabled={!!activeExecution}
            >
              Python Tests Only
            </Button>
          </div>
          
          {activeExecution && progressData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {progressData.current}/{progressData.total}</span>
                <span>{Math.round((progressData.current / progressData.total) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(progressData.current / progressData.total) * 100}%` }}
                />
              </div>
              {progressData.currentFile && (
                <p className="text-sm text-muted-foreground">
                  Testing: {progressData.currentFile}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Results table/grid will go here */}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Task 4.2: Add Socket.IO Events for Test Progress
**File**: `python/src/server/test_runner.py`
```python
import asyncio
from typing import AsyncGenerator
import socketio
from src.services.test_service import TestService

class TestRunner:
    def __init__(self, sio: socketio.AsyncServer):
        self.sio = sio
        self.test_service = TestService()
    
    async def run_tests(self, test_type: str, execution_id: str) -> AsyncGenerator[dict, None]:
        """Run tests with real-time progress updates"""
        total_tests = await self.test_service.count_tests(test_type)
        current = 0
        
        async for result in self.test_service.run_tests_stream(test_type):
            current += 1
            
            # Emit progress update
            await self.sio.emit('test:progress', {
                'executionId': execution_id,
                'testType': test_type,
                'phase': 'running',
                'current': current,
                'total': total_tests,
                'currentFile': result.get('file'),
                'currentTest': result.get('test'),
                'estimatedTimeRemaining': (total_tests - current) * 0.1
            })
            
            # Emit individual test result
            if result.get('status') == 'failed':
                await self.sio.emit('test:failure', {
                    'executionId': execution_id,
                    'test': result['test'],
                    'error': result.get('error')
                })
            
            yield result
        
        # Emit completion
        await self.sio.emit('test:complete', {
            'executionId': execution_id,
            'summary': await self.test_service.get_summary(execution_id)
        })
```

## Validation Loop

### Level 1: Syntax and Type Checking (After Each Change)
```bash
# UI
npm run lint
npm run typecheck

# Python
uv run ruff check .
uv run mypy src/
```

### Level 2: Unit Tests (After Each Component)
```bash
# UI - Run specific test file
npm test -- RAGQueryPanel.test.tsx

# Python - Run specific test module
uv run pytest tests/services/test_project_service.py -v
```

### Level 3: Integration Tests (After Each Phase)
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
uv run pytest tests/integration/ -v
```

### Level 4: Database Contamination Check (Daily)
```bash
# Check for test data in production
uv run python scripts/check_db_contamination.py

# Expected output: "No test data found in production database"
```

### Level 5: Coverage Requirements (Before PR)
```bash
# Generate coverage reports
npm run test:coverage
uv run pytest --cov=src --cov-report=html

# Verify thresholds
# UI: 70% minimum (configured in vitest.config.ts)
# Python: 80% minimum for new features
```

### Level 6: Visual Regression Testing (Final)
```bash
# Run visual tests for dashboard
npm run test:visual

# Check lighthouse scores
npm run lighthouse
```

## Progressive Success Markers

### Phase 1 Success (Day 1)
- ✅ All UI tests passing (928/928)
- ✅ No hardcoded URLs in tests
- ✅ Python dependencies installed

### Phase 2 Success (Day 2)
- ✅ Zero database contamination
- ✅ All tests use InMemorySupabaseClient
- ✅ Transaction rollback verified

### Phase 3 Success (Days 3-5)
- ✅ RAG feature tests: >80% coverage
- ✅ Project management tests: >80% coverage
- ✅ Task management tests: >80% coverage
- ✅ WebSocket handler tests: >75% coverage

### Phase 4 Success (Days 6-7)
- ✅ Test dashboard rendering correctly
- ✅ Real-time progress updates working
- ✅ Export functionality implemented
- ✅ Historical trends visualization

## Risk Mitigation

### Risk 1: Test Environment Differences
**Mitigation**: Use exact same versions in test as production
```json
"devDependencies": {
  "@types/react": "18.2.79",  // Match production
  "vitest": "1.6.0"  // Pin version
}
```

### Risk 2: Flaky Async Tests
**Mitigation**: Proper async patterns
```typescript
// Always use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, { timeout: 5000 });
```

### Risk 3: Performance Degradation
**Mitigation**: Monitor test execution time
```python
# Add to pytest.ini
addopts = --durations=10  # Show 10 slowest tests
```

## Success Criteria

1. **Test Health**: 100% of tests passing in both UI and Python
2. **Database Safety**: Zero test data in production (verified daily)
3. **Coverage**: 80%+ for new features, 70%+ overall
4. **Performance**: Full test suite runs in <5 minutes
5. **Dashboard**: Beautiful, functional test UI with export capabilities
6. **Integration**: Tests integrated into CI/CD pipeline

## Implementation Priority

1. **URGENT** (Day 1): Fix port configuration - This alone fixes 383 tests
2. **URGENT** (Day 2): Database isolation - Prevents production contamination  
3. **HIGH** (Days 3-5): New feature coverage - Enables safe development
4. **MEDIUM** (Days 6-7): Test dashboard - Improves visibility and UX
5. **LOW** (Week 2): Performance optimizations and polish

This PRP provides a clear path from a broken test suite to a robust testing infrastructure that enables confident development and deployment of Archon.