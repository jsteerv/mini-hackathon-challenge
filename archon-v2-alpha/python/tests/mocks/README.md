# Test Mocks - Database Isolation

This directory contains mock implementations to prevent production database contamination during testing.

## Phase 2 Database Isolation Implementation

### Overview

Phase 2 database isolation ensures that:
- **No test data is written to production database**
- **All tests use in-memory storage**
- **Tests are isolated from each other**
- **Production credentials cannot be accidentally used**

### Implementation Components

#### 1. InMemorySupabaseClient (`in_memory_supabase.py`)

A comprehensive mock implementation of the Supabase client that:
- Stores all data in memory using Python dictionaries
- Supports full CRUD operations (Create, Read, Update, Delete)
- Implements query filtering (eq, in_, contains, ilike, order, limit)
- Auto-generates IDs and timestamps
- Provides reset() method for test isolation
- Supports all common Supabase table operations

**Key Features:**
```python
# Basic operations
client.table('users').insert({'name': 'John'}).execute()
client.table('users').select('*').eq('name', 'John').execute()
client.table('users').update({'name': 'Jane'}).eq('id', user_id).execute()
client.table('users').delete().eq('id', user_id).execute()

# Query filtering
client.table('projects').select('*').in_('status', ['active', 'pending']).execute()
client.table('documents').select('*').contains('tags', 'urgent').execute()
client.table('items').select('*').ilike('name', '%search%').execute()
client.table('records').select('*').order('created_at', desc=True).limit(10).execute()

# Test utilities
client.reset()  # Clear all data
client.get_table_data('users')  # Get all data from specific table
client.total_records()  # Count all records across tables
```

#### 2. Automatic Mock Integration (`conftest.py`)

The `conftest.py` file automatically patches all Supabase client usage:
- **autouse fixture**: Runs automatically for every test
- **Comprehensive patching**: Intercepts all ways to get a Supabase client
- **Connection blocking**: Prevents any real database connections
- **Data isolation**: Resets data between each test

**Patched Functions:**
- `src.server.services.client_manager.get_supabase_client`
- `src.server.utils.get_supabase_client`
- `supabase.create_client`
- Any other client creation methods

#### 3. Test Isolation

Every test automatically gets:
- **Clean data**: Starts with empty database
- **Isolated storage**: No data leaks between tests
- **Consistent state**: Same starting conditions for all tests

### Usage

#### For Test Writers

Tests automatically use the mock - no special setup required:

```python
def test_my_feature(async_client):
    """Test automatically uses in-memory database."""
    response = await async_client.post('/api/projects', json={'title': 'Test Project'})
    assert response.status_code == 200
    # Data is stored in memory, not production!
```

#### For Service Testing

Services automatically get the mock client:

```python
def test_project_service():
    """Service tests automatically use mock."""
    from src.server.services.projects.project_service import ProjectService
    
    service = ProjectService()  # Gets mock client automatically
    success, result = service.create_project("Test Project")
    assert success
    # No production database touched!
```

#### Advanced Usage

Access the mock directly if needed:

```python
def test_with_direct_mock_access(in_memory_supabase_client):
    """Direct access to the mock client."""
    client = in_memory_supabase_client
    
    # Pre-populate test data
    client.table('users').insert({'name': 'Test User'}).execute()
    
    # Run your test
    # ...
    
    # Verify database state
    all_users = client.get_table_data('users')
    assert len(all_users) == 1
```

### Verification and Debugging

#### Check Mock Status

```python
def test_verify_mock_is_active():
    """Verify mock is working."""
    from src.server.services.client_manager import get_supabase_client
    
    client = get_supabase_client()
    assert hasattr(client, 'reset')  # Should be our mock
    assert not hasattr(client, 'auth')  # Should not be real client
```

#### Data Cleanup Verification

```python
from tests.mocks.in_memory_supabase import verify_no_production_data

def test_cleanup():
    """Verify no test data remains."""
    # ... run test operations ...
    
    # This will raise AssertionError if any data exists
    verify_no_production_data()
```

#### Manual Reset

```python
from tests.mocks.in_memory_supabase import reset_in_memory_supabase

def test_with_manual_reset():
    """Manually reset between operations."""
    # ... some operations ...
    reset_in_memory_supabase()
    # ... fresh start ...
```

### Security Features

#### Production Protection

1. **Environment Variable Isolation**: Even if production credentials are set, mock is used
2. **Connection Blocking**: Real Supabase connections are intercepted and blocked
3. **Import Interception**: Direct supabase imports are mocked
4. **Network Prevention**: No network calls can reach production

#### Test Contamination Prevention

1. **Automatic Reset**: Data cleared between every test
2. **Isolation Verification**: Tests verify they start with clean state
3. **Cleanup Detection**: Helper functions detect data leaks
4. **Cross-Test Protection**: No test can affect another test's data

### Common Tables

The mock pre-initializes common production tables:
- `knowledge_items`
- `projects`
- `tasks` 
- `documents`
- `code_examples`
- `sources`
- `embeddings`
- `project_documents`
- `project_versions`
- `crawl_results`

### Troubleshooting

#### Test Fails with "AttributeError"

If a test fails with missing method errors:
1. Check if the InMemoryTable class implements the needed method
2. Add the method implementation to `in_memory_supabase.py`
3. Follow the pattern of existing methods

#### Test Fails with Network Errors

If tests still try to reach the network:
1. Check that the service imports `get_supabase_client` correctly
2. Add the import path to `conftest.py` patches
3. Verify the service isn't creating clients directly

#### Data Persistence Issues

If data doesn't persist within a test:
1. Ensure you're using the same client instance
2. Check that operations call `.execute()`
3. Verify the table name is consistent

#### Isolation Problems

If tests interfere with each other:
1. Verify `conftest.py` is in the test path
2. Check that tests don't use `autouse=False`
3. Ensure no global state is used

### Performance

The in-memory mock is designed for performance:
- **Fast operations**: All data in memory
- **No network**: Zero network latency
- **Minimal overhead**: Simple dictionary operations
- **Quick reset**: Fast data cleanup between tests

### Best Practices

1. **Let automatic patching work**: Don't override the fixtures unless necessary
2. **Use fixture injection**: `def test_example(in_memory_supabase_client):`  
3. **Test data isolation**: Don't rely on data from other tests
4. **Verify mock usage**: Check that services get the mock in tests
5. **Clean test design**: Each test should be independent

### Migration from Old Tests

Old tests using manual mocks can be updated:

```python
# OLD - Manual mock setup
def test_old_way():
    with patch('src.service.get_supabase_client') as mock_client:
        mock_client.return_value = Mock()
        # ... test code ...

# NEW - Automatic mock usage  
def test_new_way():
    """Mock automatically applied!"""
    # ... test code ...
    # InMemorySupabaseClient automatically used
```

## Verification

Run the verification tests to ensure everything works:

```bash
# Test database isolation
pytest tests/test_database_isolation.py -v

# Test production protection  
pytest tests/test_production_isolation.py -v

# Complete verification
pytest tests/test_phase2_verification.py -v
```

## Summary

✅ **No production database contamination possible**  
✅ **All tests use in-memory storage**  
✅ **Complete test isolation**  
✅ **Automatic mock integration**  
✅ **Full CRUD and query support**  
✅ **Production protection layers**  

**Phase 2 database isolation is complete and operational!**