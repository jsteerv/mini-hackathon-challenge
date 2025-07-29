"""
In-memory Supabase client mock for preventing production database contamination.

This mock stores all data in memory using dictionaries and provides a reset() method
for test isolation. It supports basic CRUD operations and query filtering.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Union
from unittest.mock import Mock


class InMemoryTable:
    """Mock implementation of a Supabase table that stores data in memory."""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.data: List[Dict[str, Any]] = []
        self._last_query_result = []
    
    def select(self, columns: Union[str, List[str]] = "*"):
        """Mock select operation."""
        # Reset query result for new query
        if columns == "*":
            self._last_query_result = self.data.copy()
        else:
            # Handle column filtering if needed
            self._last_query_result = self.data.copy()
        return self
    
    def insert(self, data: Union[Dict[str, Any], List[Dict[str, Any]]]):
        """Mock insert operation."""
        if isinstance(data, dict):
            data = [data]
        
        inserted_records = []
        for record in data:
            # Auto-generate ID if not provided
            if 'id' not in record:
                record['id'] = str(uuid.uuid4())
            
            # Auto-generate timestamps if not provided
            now = datetime.now(timezone.utc).isoformat()
            if 'created_at' not in record:
                record['created_at'] = now
            if 'updated_at' not in record:
                record['updated_at'] = now
            
            # Store the record
            self.data.append(record.copy())
            inserted_records.append(record.copy())
        
        self._last_query_result = inserted_records
        return self
    
    def update(self, data: Dict[str, Any]):
        """Mock update operation."""
        # Update timestamp
        data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Apply updates to filtered records from previous query operations
        updated_records = []
        for i, record in enumerate(self.data):
            if record in self._last_query_result:
                self.data[i].update(data)
                updated_records.append(self.data[i].copy())
        
        self._last_query_result = updated_records
        return self
    
    def delete(self):
        """Mock delete operation."""
        deleted_records = []
        # Remove records that match the current query filter
        self.data = [record for record in self.data 
                    if record not in self._last_query_result]
        deleted_records = self._last_query_result.copy()
        self._last_query_result = deleted_records
        return self
    
    def eq(self, column: str, value: Any):
        """Mock equality filter."""
        self._last_query_result = [
            record for record in self._last_query_result 
            if record.get(column) == value
        ]
        return self
    
    def neq(self, column: str, value: Any):
        """Mock not-equal filter."""
        self._last_query_result = [
            record for record in self._last_query_result 
            if record.get(column) != value
        ]
        return self
    
    def in_(self, column: str, values: List[Any]):
        """Mock 'in' filter."""
        self._last_query_result = [
            record for record in self._last_query_result 
            if record.get(column) in values
        ]
        return self
    
    def contains(self, column: str, value: Any):
        """Mock contains filter for arrays."""
        self._last_query_result = [
            record for record in self._last_query_result 
            if isinstance(record.get(column), list) and value in record.get(column, [])
        ]
        return self
    
    def ilike(self, column: str, pattern: str):
        """Mock case-insensitive like filter."""
        pattern_lower = pattern.lower().replace('%', '')
        self._last_query_result = [
            record for record in self._last_query_result 
            if pattern_lower in str(record.get(column, '')).lower()
        ]
        return self
    
    def order(self, column: str, desc: bool = False):
        """Mock order by operation."""
        reverse_order = desc
        try:
            self._last_query_result = sorted(
                self._last_query_result,
                key=lambda x: x.get(column, ''),
                reverse=reverse_order
            )
        except Exception:
            # If sorting fails, just return the data as-is
            pass
        return self
    
    def limit(self, count: int):
        """Mock limit operation."""
        self._last_query_result = self._last_query_result[:count]
        return self
    
    def execute(self):
        """Mock execute operation."""
        result = Mock()
        result.data = self._last_query_result.copy()
        result.count = len(self._last_query_result)
        return result


class InMemorySupabaseClient:
    """
    In-memory Supabase client mock that prevents production database contamination.
    
    Features:
    - Stores data in memory using dictionaries
    - Supports basic CRUD operations
    - Auto-generates IDs and timestamps
    - Provides reset() method for test isolation
    - Implements select(), insert(), update(), delete() methods
    - Supports basic query filtering
    """
    
    def __init__(self):
        self.tables: Dict[str, InMemoryTable] = {}
        self.reset()
    
    def reset(self):
        """Reset all data for test isolation."""
        self.tables.clear()
        
        # Initialize common tables that might be used in tests
        common_tables = [
            'knowledge_items',
            'projects', 
            'tasks',
            'documents',
            'code_examples',
            'sources',
            'embeddings',
            'project_documents',
            'project_versions',
            'crawl_results'
        ]
        
        for table_name in common_tables:
            self.tables[table_name] = InMemoryTable(table_name)
    
    def table(self, table_name: str) -> InMemoryTable:
        """Get a table instance for operations."""
        if table_name not in self.tables:
            self.tables[table_name] = InMemoryTable(table_name)
        return self.tables[table_name]
    
    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Get all data from a specific table (for debugging/testing)."""
        if table_name not in self.tables:
            return []
        return self.tables[table_name].data.copy()
    
    def get_all_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all data from all tables (for debugging/testing)."""
        return {
            table_name: table.data.copy() 
            for table_name, table in self.tables.items()
        }
    
    def count_records(self, table_name: str) -> int:
        """Count records in a specific table."""
        if table_name not in self.tables:
            return 0
        return len(self.tables[table_name].data)
    
    def total_records(self) -> int:
        """Count total records across all tables."""
        return sum(len(table.data) for table in self.tables.values())


# Global instance for test isolation
_in_memory_client = InMemorySupabaseClient()


def get_in_memory_supabase_client() -> InMemorySupabaseClient:
    """Get the global in-memory Supabase client instance."""
    return _in_memory_client


def reset_in_memory_supabase():
    """Reset the global in-memory Supabase client for test isolation."""
    _in_memory_client.reset()


def verify_no_production_data():
    """Verify that no data exists in the mock (useful for test cleanup verification)."""
    total = _in_memory_client.total_records()
    if total > 0:
        data_summary = {
            table_name: len(table.data) 
            for table_name, table in _in_memory_client.tables.items() 
            if table.data
        }
        raise AssertionError(
            f"Test contamination detected: {total} records found in mock database. "
            f"Table breakdown: {data_summary}. "
            f"Tests should clean up after themselves or use proper fixtures."
        )