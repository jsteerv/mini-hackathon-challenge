name: "Fix ALL Failing Tests and Implement Test Result Visualization"
description: |
  ## Purpose
  Comprehensive fix for all failing tests and implementation of proper test result/coverage visualization in Archon
  
  ## Core Principles
  1. **Context is King**: All test failures documented with specific fixes
  2. **Validation Loops**: Progressive test fixing with verification at each step
  3. **Information Dense**: Exact error messages and solutions provided
  4. **Progressive Success**: Fix tests category by category, validate each fix

---

## Goal
Fix ALL failing tests in both UI and backend, implement proper test result visualization with coverage reports accessible from the UI

## Why
- Currently many tests are failing, blocking CI/CD pipeline
- Test Results button shows nothing because files are on server, not accessible to UI
- No coverage visualization for understanding code quality
- Developers need immediate feedback on test status and coverage

## What
- Fix all 60+ failing backend tests and 20+ failing UI tests
- Create backend endpoints to serve test results and coverage reports
- Implement beautiful test result dashboard with coverage visualization
- Enable real-time test result viewing from the UI

### Success Criteria
- [ ] ALL backend tests pass (214/214)
- [ ] ALL UI tests pass
- [ ] Test Results button shows actual test results with coverage
- [ ] Coverage reports viewable in UI with beautiful visualization
- [ ] Test summary dashboard shows pass/fail counts and trends
- [ ] Coverage thresholds enforced and visible

## All Needed Context

### Documentation & References
```yaml
- url: https://vitest.dev/guide/coverage.html
  why: Vitest coverage configuration and HTML report generation
  
- url: https://pytest-cov.readthedocs.io/en/latest/reporting.html
  why: pytest-cov for generating multiple report formats including JSON and HTML
  
- url: https://coverage.readthedocs.io/
  why: Coverage.py documentation for understanding report formats
  
- file: python/src/server/fastapi/tests_api.py
  why: Current test execution API implementation
  
- file: archon-ui-main/vitest.config.ts:14-68
  why: Current vitest configuration with coverage settings
  
- file: python/pytest.ini
  why: Current pytest configuration
```

### Current Test Failures

#### Backend Test Failures (Python)
```yaml
Critical Failures:
  - test_knowledge_sources_endpoint: Missing endpoint implementation
  - test_crawl_endpoint_validation: Validation issues
  - test_search_endpoint_validation: Validation issues
  - test_project_creation_validation: Validation issues
  - test_knowledge_service_database_failures: Database error handling
  - test_concurrent_database_operations: Concurrency issues
  - test_large_document_processing: Memory limits
  - test_bulk_operations_memory_usage: Memory management
  - test_crawler_memory_with_many_urls: Crawler memory issues
  - test_malicious_input_handling: Security validation
  - test_boundary_value_testing: Edge case handling
  - test_is_txt_detection: File type detection logic
  - test_crawl_single_page_*: Multiple crawler test failures
  - test_concurrent_crawling_safety: Thread safety issues
  - test_vector_search_performance_with_large_results: Performance issues
  - test_document_upload_progress_mapping: Progress tracking
  - test_socketio_error_propagation: Error handling
  - test_websocket_crawl: WebSocket implementation
```

#### UI Test Failures (React/TypeScript)
```yaml
Critical Failures:
  - MilkdownEditor tests: crepe.create is not a function (mock issue)
  - GroupCreationModal: useToast hook undefined (context provider missing)
  - ThemeContext: localStorage and theme switching failures
  - ToastContext: Toast display and auto-dismissal failures
  - SettingsContext: Network error handling
```

### Current Codebase Structure
```bash
python/
├── src/
│   └── server/
│       ├── fastapi/
│       │   └── tests_api.py      # Test execution API
│       └── main.py               # FastAPI app setup
├── tests/
│   ├── server/                   # Backend tests
│   ├── mcp/                      # MCP tests
│   └── agents/                   # Agent tests
├── pytest.ini                    # pytest configuration
└── htmlcov/                      # Coverage HTML output (generated)

archon-ui-main/
├── src/
│   ├── services/
│   │   └── testService.ts        # Test service (needs endpoints)
│   └── components/
│       ├── settings/
│       │   └── TestStatus.tsx    # Test UI component
│       └── ui/
│           └── TestResultsModal.tsx  # Results display
├── test/                         # Test files
├── vitest.config.ts             # Vitest configuration
└── public/
    └── test-results/            # Test output directory (configured)
        ├── test-results.json
        └── coverage/            # Coverage reports
```

### Desired Codebase Structure
```bash
python/
├── src/
│   └── server/
│       ├── fastapi/
│       │   ├── tests_api.py      # Enhanced with coverage endpoints
│       │   └── coverage_api.py   # New: Coverage report serving
│       ├── services/
│       │   └── test_coverage_service.py  # New: Coverage processing
│       └── main.py               # Mount static files for coverage
├── coverage_reports/             # New: Server-side coverage storage
│   ├── pytest/
│   │   ├── coverage.json
│   │   └── htmlcov/
│   └── vitest/
│       ├── coverage-summary.json
│       └── html/

archon-ui-main/
├── src/
│   ├── services/
│   │   └── testService.ts        # Updated with new endpoints
│   └── components/
│       ├── test-results/         # New: Test result components
│       │   ├── TestResultDashboard.tsx
│       │   ├── CoverageVisualization.tsx
│       │   └── TestHistoryChart.tsx
│       └── ui/
│           └── TestResultsModal.tsx  # Enhanced display
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: Docker exec commands need proper container names
# CRITICAL: Coverage reports need to be accessible via HTTP, not file://
# CRITICAL: WebSocket connections need proper error handling
# GOTCHA: vitest coverage uses v8 by default, pytest uses coverage.py
# GOTCHA: React test context providers must wrap all test components
# GOTCHA: localStorage mock needed for theme tests
```

## Implementation Blueprint

### Phase 1: Fix Backend Test Infrastructure
```python
# Fix test endpoint validation
@router.post("/knowledge/crawl")
async def crawl_knowledge_item(request: KnowledgeItemRequest):
    # Add proper validation
    if not request.url:
        raise HTTPException(status_code=422, detail="URL is required")
    # ... rest of implementation

# Fix database error handling in tests
async def test_knowledge_service_database_failures(monkeypatch):
    # Mock database failures properly
    monkeypatch.setattr(supabase, "from_", Mock(side_effect=Exception("DB Error")))
    # Assert proper error handling

# Fix memory limit tests
def test_large_document_processing():
    # Use proper memory limits
    large_content = "x" * (10 * 1024 * 1024)  # 10MB
    # Process with streaming to avoid memory issues
```

### Phase 2: Fix UI Test Infrastructure
```typescript
// Fix useToast mock
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn()
  })
}))

// Fix theme context tests
beforeEach(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  }
  global.localStorage = localStorageMock
})

// Fix Milkdown editor mock
vi.mock('@milkdown/crepe', () => ({
  crepe: {
    create: vi.fn().mockResolvedValue({
      destroy: vi.fn()
    })
  }
}))
```

### Phase 3: Implement Coverage API Endpoints
```python
# coverage_api.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import json

router = APIRouter(prefix="/api/coverage", tags=["coverage"])

@router.get("/pytest/json")
async def get_pytest_coverage_json():
    """Get pytest coverage data as JSON"""
    coverage_file = Path("coverage_reports/pytest/coverage.json")
    if not coverage_file.exists():
        raise HTTPException(status_code=404, detail="Coverage data not found")
    
    with open(coverage_file) as f:
        return JSONResponse(content=json.load(f))

@router.get("/pytest/html/{path:path}")
async def get_pytest_coverage_html(path: str):
    """Serve pytest HTML coverage report files"""
    file_path = Path(f"coverage_reports/pytest/htmlcov/{path}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@router.get("/vitest/summary")
async def get_vitest_coverage_summary():
    """Get vitest coverage summary"""
    summary_file = Path("coverage_reports/vitest/coverage-summary.json")
    if not summary_file.exists():
        raise HTTPException(status_code=404, detail="Coverage summary not found")
    
    with open(summary_file) as f:
        return JSONResponse(content=json.load(f))

@router.get("/combined-summary")
async def get_combined_coverage_summary():
    """Get combined coverage summary from all test suites"""
    # Combine pytest and vitest coverage data
    pytest_cov = await get_pytest_coverage_json()
    vitest_cov = await get_vitest_coverage_summary()
    
    return {
        "backend": pytest_cov,
        "frontend": vitest_cov,
        "timestamp": datetime.now().isoformat()
    }
```

### Phase 4: Update Test Service
```typescript
// testService.ts updates
class TestService {
  async getTestResults(): Promise<TestResults> {
    try {
      // Get from new API endpoint instead of static file
      const response = await fetch('/api/tests/latest-results');
      if (!response.ok) {
        throw new Error('Test results not available');
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load test results: ${error.message}`);
    }
  }

  async getCoverageData(): Promise<CoverageData> {
    try {
      const response = await fetch('/api/coverage/combined-summary');
      if (!response.ok) {
        throw new Error('Coverage data not available');
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load coverage data: ${error.message}`);
    }
  }

  async getCoverageHtmlUrl(): string {
    // Return URL to coverage HTML report
    return '/api/coverage/pytest/html/index.html';
  }
}
```

### Phase 5: Create Test Result Components
```typescript
// TestResultDashboard.tsx
export function TestResultDashboard() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);

  useEffect(() => {
    loadTestData();
  }, []);

  return (
    <div className="test-dashboard">
      <TestSummaryCard results={results} />
      <CoverageVisualization coverage={coverage} />
      <TestHistoryChart />
    </div>
  );
}

// CoverageVisualization.tsx
export function CoverageVisualization({ coverage }: Props) {
  return (
    <div className="coverage-viz">
      <CoverageGauge 
        label="Statements" 
        value={coverage?.statements?.pct || 0} 
        threshold={80}
      />
      <CoverageGauge 
        label="Branches" 
        value={coverage?.branches?.pct || 0} 
        threshold={70}
      />
      <CoverageGauge 
        label="Functions" 
        value={coverage?.functions?.pct || 0} 
        threshold={80}
      />
      <CoverageGauge 
        label="Lines" 
        value={coverage?.lines?.pct || 0} 
        threshold={80}
      />
    </div>
  );
}
```

### Task List
```yaml
Task 1: Fix Backend Test Infrastructure
  - MODIFY: python/src/server/fastapi/knowledge_api.py
  - MODIFY: python/tests/server/test_api_endpoints.py
  - MODIFY: python/tests/server/test_edge_cases_and_errors.py
  - Pattern: Add proper validation and error handling

Task 2: Fix UI Test Infrastructure  
  - MODIFY: archon-ui-main/test/setup.ts
  - CREATE: archon-ui-main/test/__mocks__/useToast.tsx
  - CREATE: archon-ui-main/test/__mocks__/@milkdown/crepe.ts
  - Pattern: Proper mocking for all external dependencies

Task 3: Implement Coverage API
  - CREATE: python/src/server/fastapi/coverage_api.py
  - CREATE: python/src/server/services/test_coverage_service.py
  - MODIFY: python/src/server/main.py (add coverage router)
  - Pattern: RESTful API for serving coverage data

Task 4: Update Test Execution
  - MODIFY: python/src/server/fastapi/tests_api.py
  - Pattern: Generate and store coverage reports after test runs

Task 5: Update Frontend Services
  - MODIFY: archon-ui-main/src/services/testService.ts
  - Pattern: Use new API endpoints instead of static files

Task 6: Create Test Result UI
  - CREATE: archon-ui-main/src/components/test-results/TestResultDashboard.tsx
  - CREATE: archon-ui-main/src/components/test-results/CoverageVisualization.tsx
  - CREATE: archon-ui-main/src/components/test-results/TestHistoryChart.tsx
  - MODIFY: archon-ui-main/src/components/ui/TestResultsModal.tsx
  - Pattern: Beautiful, informative test result display

Task 7: Fix Individual Test Files
  - MODIFY: All failing test files listed above
  - Pattern: Fix specific issues identified in each test

Task 8: Configure Coverage Generation
  - MODIFY: python/pyproject.toml (add coverage config)
  - MODIFY: archon-ui-main/vitest.config.ts (ensure proper output)
  - CREATE: scripts/generate-coverage.sh
  - Pattern: Automated coverage generation
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend
cd python
ruff check . --fix
ruff format .
mypy src/ --strict

# Frontend
cd archon-ui-main
npm run lint
npm run type-check
```

### Level 2: Fix Backend Tests Progressively
```bash
# Test each category separately
cd python

# API endpoint tests
uv run pytest tests/server/test_api_endpoints.py -v

# Edge case tests
uv run pytest tests/server/test_edge_cases_and_errors.py -v

# Service tests
uv run pytest tests/server/test_rag_crawling_service.py -v

# All backend tests with coverage
uv run pytest --cov=src --cov-report=json:coverage_reports/pytest/coverage.json --cov-report=html:coverage_reports/pytest/htmlcov
```

### Level 3: Fix UI Tests Progressively
```bash
cd archon-ui-main

# Context tests first
npm test -- test/contexts/

# Component tests
npm test -- test/components/

# All UI tests with coverage
npm test -- --coverage
```

### Level 4: Integration Testing
```bash
# Start services
docker-compose up -d

# Test coverage endpoints
curl http://localhost:8000/api/coverage/combined-summary
curl http://localhost:8000/api/coverage/pytest/html/index.html

# Run full test suite
cd python && uv run pytest
cd archon-ui-main && npm test
```

### Level 5: Verify UI Access
```bash
# Open browser
# Navigate to Settings page
# Click "Run Tests" - verify console output
# Click "Test Results" - verify results display with coverage

# Verify coverage thresholds
grep -A5 "thresholds" archon-ui-main/vitest.config.ts
grep -A5 "fail_under" python/pyproject.toml
```

## Success Metrics
- 100% of tests passing in both frontend and backend
- Coverage reports accessible via API
- Test Results UI shows:
  - Pass/fail counts
  - Coverage percentages with visual gauges
  - Test execution history
  - Detailed test output
- Coverage thresholds enforced:
  - Backend: 80% minimum
  - Frontend: 70% minimum