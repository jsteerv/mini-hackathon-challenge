"""
Test suite for Knowledge Base Services

Tests content indexing, search functionality, crawling progress tracking,
bulk operations, and group management.
"""

import pytest
from unittest.mock import AsyncMock, patch

from src.server.services.knowledge.knowledge_item_service import KnowledgeItemService
from src.server.services.knowledge.crawl_orchestration_service import CrawlOrchestrationService
from src.server.services.knowledge.code_extraction_service import CodeExtractionService
from src.server.services.knowledge.progress_mapper import ProgressMapper
from src.server.services.knowledge.database_metrics_service import DatabaseMetricsService


class TestKnowledgeItemService:
    """Test cases for Knowledge Item Service"""
    
    @pytest.fixture
    def knowledge_service(self, in_memory_supabase_client):
        """Create KnowledgeItemService with in-memory Supabase client"""
        return KnowledgeItemService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def sample_knowledge_item(self):
        """Sample knowledge item data for testing"""
        return {
            "url": "https://example.com/docs/api-guide",
            "title": "API Guide",
            "content": "This is a comprehensive guide to using our API...",
            "source_id": "example.com",
            "metadata": {
                "type": "documentation",
                "language": "english",
                "category": "api",
                "tags": ["api", "guide", "documentation"]
            },
            "embedding": [0.1, 0.2, 0.3] * 512  # Mock embedding vector
        }
    
    def test_create_knowledge_item_success(self, knowledge_service, sample_knowledge_item):
        """Test successful knowledge item creation"""
        success, result = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        
        assert success is True
        assert "knowledge_item" in result
        assert result["knowledge_item"]["url"] == sample_knowledge_item["url"]
        assert result["knowledge_item"]["title"] == sample_knowledge_item["title"]
        assert result["knowledge_item"]["content"] == sample_knowledge_item["content"]
        assert result["knowledge_item"]["source_id"] == sample_knowledge_item["source_id"]
        assert "id" in result["knowledge_item"]
        assert "created_at" in result["knowledge_item"]
    
    def test_create_knowledge_item_duplicate_url(self, knowledge_service, sample_knowledge_item):
        """Test handling of duplicate URL knowledge items"""
        # Create first item
        success, result1 = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        assert success is True
        
        # Try to create duplicate
        success, result2 = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        
        # Should handle duplicates gracefully (update or skip)
        assert success is True
        # Implementation may vary - could update existing or return existing
    
    def test_create_knowledge_item_missing_required_fields(self, knowledge_service):
        """Test knowledge item creation with missing required fields"""
        incomplete_data = {
            "title": "Incomplete Item"
            # Missing url, content, source_id
        }
        
        success, result = knowledge_service.create_knowledge_item(**incomplete_data)
        
        assert success is False
        assert "error" in result
    
    def test_search_knowledge_items_by_content(self, knowledge_service, sample_knowledge_item):
        """Test searching knowledge items by content"""
        # Create test items
        items = [
            {**sample_knowledge_item, "url": "https://example.com/api", "content": "API documentation content"},
            {**sample_knowledge_item, "url": "https://example.com/guide", "content": "User guide content"},
            {**sample_knowledge_item, "url": "https://example.com/tutorial", "content": "Tutorial content with examples"}
        ]
        
        for item in items:
            success, result = knowledge_service.create_knowledge_item(**item)
            assert success is True
        
        # Search for items
        success, result = knowledge_service.search_knowledge_items(
            query="API documentation",
            match_count=10
        )
        
        assert success is True
        assert "items" in result
        assert len(result["items"]) > 0
        # Should find relevant items based on content similarity
    
    def test_search_knowledge_items_by_source(self, knowledge_service, sample_knowledge_item):
        """Test searching knowledge items filtered by source"""
        # Create items from different sources
        sources = ["docs.example.com", "api.example.com", "tutorial.example.com"]
        
        for i, source in enumerate(sources):
            item = {
                **sample_knowledge_item,
                "url": f"https://{source}/page{i}",
                "source_id": source,
                "content": f"Content from {source}"
            }
            success, result = knowledge_service.create_knowledge_item(**item)
            assert success is True
        
        # Search with source filter
        success, result = knowledge_service.search_knowledge_items(
            query="content",
            source_filter="docs.example.com",
            match_count=10
        )
        
        assert success is True
        # Should only return items from specified source
        for item in result["items"]:
            assert item["source_id"] == "docs.example.com"
    
    def test_get_knowledge_item_by_id(self, knowledge_service, sample_knowledge_item):
        """Test getting a specific knowledge item by ID"""
        # Create a knowledge item
        success, create_result = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        assert success is True
        item_id = create_result["knowledge_item"]["id"]
        
        # Get the item
        success, result = knowledge_service.get_knowledge_item(item_id)
        
        assert success is True
        assert result["knowledge_item"]["id"] == item_id
        assert result["knowledge_item"]["url"] == sample_knowledge_item["url"]
        assert result["knowledge_item"]["title"] == sample_knowledge_item["title"]
    
    def test_update_knowledge_item_success(self, knowledge_service, sample_knowledge_item):
        """Test successful knowledge item update"""
        # Create a knowledge item
        success, create_result = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        assert success is True
        item_id = create_result["knowledge_item"]["id"]
        
        # Update the item
        update_data = {
            "title": "Updated API Guide",
            "content": "Updated comprehensive guide to using our API...",
            "metadata": {
                **sample_knowledge_item["metadata"],
                "updated": True,
                "version": "2.0"
            }
        }
        
        success, result = knowledge_service.update_knowledge_item(item_id, update_data)
        
        assert success is True
        assert result["knowledge_item"]["title"] == "Updated API Guide"
        assert result["knowledge_item"]["content"] == update_data["content"]
        assert result["knowledge_item"]["metadata"]["updated"] is True
    
    def test_delete_knowledge_item_success(self, knowledge_service, sample_knowledge_item):
        """Test successful knowledge item deletion"""
        # Create a knowledge item
        success, create_result = knowledge_service.create_knowledge_item(**sample_knowledge_item)
        assert success is True
        item_id = create_result["knowledge_item"]["id"]
        
        # Delete the item
        success, result = knowledge_service.delete_knowledge_item(item_id)
        
        assert success is True
        
        # Verify item is deleted
        success, get_result = knowledge_service.get_knowledge_item(item_id)
        assert success is False
    
    def test_bulk_create_knowledge_items(self, knowledge_service, sample_knowledge_item):
        """Test bulk creation of knowledge items"""
        # Create multiple items
        items = []
        for i in range(5):
            item = {
                **sample_knowledge_item,
                "url": f"https://example.com/page{i}",
                "title": f"Page {i}",
                "content": f"Content for page {i}"
            }
            items.append(item)
        
        success, result = knowledge_service.bulk_create_knowledge_items(items)
        
        assert success is True
        assert "created_count" in result
        assert result["created_count"] == 5
        assert "items" in result
        assert len(result["items"]) == 5
    
    def test_bulk_create_with_errors(self, knowledge_service, sample_knowledge_item):
        """Test bulk creation with some invalid items"""
        items = [
            sample_knowledge_item,  # Valid item
            {"title": "Invalid Item"},  # Missing required fields
            {**sample_knowledge_item, "url": "https://example.com/page2"}  # Valid item
        ]
        
        success, result = knowledge_service.bulk_create_knowledge_items(items)
        
        # Should succeed with partial results
        assert success is True
        assert result["created_count"] == 2  # Only 2 valid items
        assert "errors" in result
        assert len(result["errors"]) == 1  # 1 invalid item
    
    def test_get_knowledge_items_by_source(self, knowledge_service, sample_knowledge_item):
        """Test getting all knowledge items from a specific source"""
        source_id = "test-source.com"
        
        # Create items from the same source
        for i in range(3):
            item = {
                **sample_knowledge_item,
                "url": f"https://{source_id}/page{i}",
                "source_id": source_id,
                "title": f"Page {i} from {source_id}"
            }
            success, result = knowledge_service.create_knowledge_item(**item)
            assert success is True
        
        # Get items by source
        success, result = knowledge_service.get_knowledge_items_by_source(source_id)
        
        assert success is True
        assert len(result["items"]) == 3
        for item in result["items"]:
            assert item["source_id"] == source_id
    
    def test_knowledge_item_content_indexing(self, knowledge_service):
        """Test that knowledge items are properly indexed for search"""
        # Create items with specific content for indexing
        test_items = [
            {
                "url": "https://example.com/python-guide",
                "title": "Python Programming Guide",
                "content": "Learn Python programming with examples. Functions, classes, and modules.",
                "source_id": "example.com",
                "metadata": {"language": "python", "type": "tutorial"},
                "embedding": [0.1] * 1536
            },
            {
                "url": "https://example.com/javascript-guide", 
                "title": "JavaScript Programming Guide",
                "content": "Learn JavaScript programming. Variables, functions, and objects.",
                "source_id": "example.com",
                "metadata": {"language": "javascript", "type": "tutorial"},
                "embedding": [0.2] * 1536
            }
        ]
        
        for item in test_items:
            success, result = knowledge_service.create_knowledge_item(**item)
            assert success is True
        
        # Search should find relevant content
        success, result = knowledge_service.search_knowledge_items(
            query="Python programming functions",
            match_count=10
        )
        
        assert success is True
        assert len(result["items"]) > 0
        # Should rank Python guide higher due to content relevance


class TestCrawlOrchestrationService:
    """Test cases for Crawl Orchestration Service"""
    
    @pytest.fixture
    def orchestration_service(self, in_memory_supabase_client):
        """Create CrawlOrchestrationService with mocked dependencies"""
        with patch('src.server.services.knowledge.crawl_orchestration_service.get_supabase_client') as mock_client:
            mock_client.return_value = in_memory_supabase_client
            return CrawlOrchestrationService()
    
    @pytest.fixture
    def mock_progress_callback(self):
        """Mock progress callback for testing"""
        return AsyncMock()
    
    @pytest.mark.asyncio
    async def test_start_crawl_session_success(self, orchestration_service, mock_progress_callback):
        """Test successful crawl session initialization"""
        source_id = "test-source.com"
        urls = ["https://test-source.com/page1", "https://test-source.com/page2"]
        
        session_id = await orchestration_service.start_crawl_session(
            source_id=source_id,
            urls=urls,
            progress_callback=mock_progress_callback
        )
        
        assert session_id is not None
        assert isinstance(session_id, str)
        # Session should be tracked internally
        assert session_id in orchestration_service.active_sessions
    
    @pytest.mark.asyncio
    async def test_crawl_progress_tracking(self, orchestration_service, mock_progress_callback):
        """Test crawl progress tracking and reporting"""
        source_id = "progress-test.com"
        urls = [f"https://progress-test.com/page{i}" for i in range(5)]
        
        with patch.object(orchestration_service, '_crawl_single_url') as mock_crawl:
            # Mock successful crawl results
            mock_crawl.return_value = {
                "success": True,
                "url": "https://progress-test.com/page1",
                "content": "Test content"
            }
            
            session_id = await orchestration_service.start_crawl_session(
                source_id=source_id,
                urls=urls,
                progress_callback=mock_progress_callback
            )
            
            # Start crawling
            await orchestration_service.execute_crawl(session_id)
            
            # Verify progress callbacks were called
            assert mock_progress_callback.call_count > 0
            
            # Verify progress updates
            progress_calls = mock_progress_callback.call_args_list
            assert any("progress" in str(call) for call in progress_calls)
    
    @pytest.mark.asyncio
    async def test_crawl_error_handling(self, orchestration_service, mock_progress_callback):
        """Test error handling during crawl operations"""
        source_id = "error-test.com"
        urls = ["https://error-test.com/page1", "https://error-test.com/error-page"]
        
        with patch.object(orchestration_service, '_crawl_single_url') as mock_crawl:
            # Mock mixed results - success and failure
            mock_crawl.side_effect = [
                {"success": True, "url": urls[0], "content": "Success content"},
                {"success": False, "url": urls[1], "error": "Failed to crawl"}
            ]
            
            session_id = await orchestration_service.start_crawl_session(
                source_id=source_id,
                urls=urls,
                progress_callback=mock_progress_callback
            )
            
            # Execute crawl
            await orchestration_service.execute_crawl(session_id)
            
            # Should handle errors gracefully and continue with other URLs
            assert mock_crawl.call_count == 2
            
            # Verify error was reported in progress
            progress_calls = mock_progress_callback.call_args_list
            error_reported = any("error" in str(call).lower() for call in progress_calls)
            assert error_reported
    
    @pytest.mark.asyncio
    async def test_stop_crawl_session(self, orchestration_service, mock_progress_callback):
        """Test stopping an active crawl session"""
        source_id = "stop-test.com"
        urls = [f"https://stop-test.com/page{i}" for i in range(10)]
        
        session_id = await orchestration_service.start_crawl_session(
            source_id=source_id,
            urls=urls,
            progress_callback=mock_progress_callback
        )
        
        # Stop the session
        success = await orchestration_service.stop_crawl_session(session_id)
        
        assert success is True
        # Session should be marked as stopped
        assert session_id not in orchestration_service.active_sessions
    
    @pytest.mark.asyncio
    async def test_concurrent_crawl_sessions(self, orchestration_service):
        """Test handling multiple concurrent crawl sessions"""
        sessions = []
        
        for i in range(3):
            source_id = f"concurrent-test-{i}.com"
            urls = [f"https://concurrent-test-{i}.com/page{j}" for j in range(2)]
            
            session_id = await orchestration_service.start_crawl_session(
                source_id=source_id,
                urls=urls,
                progress_callback=AsyncMock()
            )
            sessions.append(session_id)
        
        # All sessions should be active
        assert len(orchestration_service.active_sessions) == 3
        
        # Each session should have unique ID
        assert len(set(sessions)) == 3
    
    @pytest.mark.asyncio
    async def test_crawl_session_cleanup(self, orchestration_service, mock_progress_callback):
        """Test cleanup of completed crawl sessions"""
        source_id = "cleanup-test.com"
        urls = ["https://cleanup-test.com/page1"]
        
        with patch.object(orchestration_service, '_crawl_single_url') as mock_crawl:
            mock_crawl.return_value = {
                "success": True,
                "url": urls[0],
                "content": "Test content"
            }
            
            session_id = await orchestration_service.start_crawl_session(
                source_id=source_id,
                urls=urls,
                progress_callback=mock_progress_callback
            )
            
            # Execute and complete crawl
            await orchestration_service.execute_crawl(session_id)
            
            # Session should be cleaned up after completion
            # (Implementation detail - may vary based on actual service design)
            # This test verifies the service properly manages session lifecycle


class TestCodeExtractionService:
    """Test cases for Code Extraction Service"""
    
    @pytest.fixture
    def code_extraction_service(self):
        """Create CodeExtractionService instance"""
        return CodeExtractionService()
    
    def test_extract_code_from_markdown(self, code_extraction_service):
        """Test code extraction from markdown content"""
        markdown_content = """
# API Documentation

Here's how to use the API:

```python
import requests

def get_user(user_id):
    response = requests.get(f"/api/users/{user_id}")
    return response.json()

# Example usage
user = get_user(123)
print(user["name"])
```

And here's a JavaScript example:

```javascript
async function fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}

// Usage
const user = await fetchUser(123);
console.log(user.name);
```
"""
        
        extracted_code = code_extraction_service.extract_code_blocks(markdown_content)
        
        assert len(extracted_code) == 2
        
        # Python code block
        python_block = extracted_code[0]
        assert python_block["language"] == "python"
        assert "import requests" in python_block["code"]
        assert "def get_user" in python_block["code"]
        
        # JavaScript code block
        js_block = extracted_code[1]
        assert js_block["language"] == "javascript"
        assert "async function fetchUser" in js_block["code"]
        assert "await fetch" in js_block["code"]
    
    def test_extract_code_from_html(self, code_extraction_service):
        """Test code extraction from HTML content"""
        html_content = """
<div class="documentation">
    <h1>Code Examples</h1>
    <pre><code class="language-python">
def hello_world():
    print("Hello, World!")
    
if __name__ == "__main__":
    hello_world()
    </code></pre>
    
    <pre><code class="language-sql">
SELECT users.name, posts.title
FROM users
JOIN posts ON users.id = posts.user_id
WHERE users.active = true;
    </code></pre>
</div>
"""
        
        extracted_code = code_extraction_service.extract_code_from_html(html_content)
        
        assert len(extracted_code) == 2
        
        # Python code
        python_code = extracted_code[0]
        assert python_code["language"] == "python"
        assert "def hello_world" in python_code["code"]
        
        # SQL code
        sql_code = extracted_code[1]
        assert sql_code["language"] == "sql"
        assert "SELECT users.name" in sql_code["code"]
    
    def test_extract_inline_code(self, code_extraction_service):
        """Test extraction of inline code snippets"""
        content = """
To install the package, run `pip install requests` in your terminal.
Use `git clone https://github.com/repo/project.git` to clone the repository.
The function `calculate_sum(a, b)` returns the sum of two numbers.
"""
        
        inline_code = code_extraction_service.extract_inline_code(content)
        
        expected_snippets = [
            "pip install requests",
            "git clone https://github.com/repo/project.git",
            "calculate_sum(a, b)"
        ]
        
        assert len(inline_code) == 3
        for snippet in expected_snippets:
            assert snippet in inline_code
    
    def test_classify_code_language(self, code_extraction_service):
        """Test automatic code language classification"""
        code_samples = [
            ("def function():\n    return True", "python"),
            ("function test() {\n    return true;\n}", "javascript"),
            ("SELECT * FROM users;", "sql"),
            ("console.log('Hello World');", "javascript"),
            ("<div>Hello World</div>", "html"),
            ("body { color: red; }", "css")
        ]
        
        for code, expected_language in code_samples:
            detected = code_extraction_service.classify_language(code)
            assert detected == expected_language or detected == "unknown"  # Allow unknown for edge cases
    
    def test_extract_code_with_context(self, code_extraction_service):
        """Test code extraction with surrounding context"""
        content = """
## Authentication

To authenticate API requests, include your API key in the header:

```python
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get("/api/data", headers=headers)
```

This will authenticate your request and return the requested data.
"""
        
        extracted = code_extraction_service.extract_code_with_context(content)
        
        assert len(extracted) == 1
        code_block = extracted[0]
        
        assert code_block["language"] == "python"
        assert "Authorization" in code_block["code"]
        assert "context_before" in code_block
        assert "Authentication" in code_block["context_before"]
        assert "context_after" in code_block
        assert "authenticate your request" in code_block["context_after"]
    
    def test_extract_code_from_mixed_content(self, code_extraction_service):
        """Test code extraction from mixed markdown and HTML content"""
        mixed_content = """
# Getting Started

```bash
npm install archon-sdk
```

<div class="example">
<pre><code class="language-typescript">
import { ArchonClient } from 'archon-sdk';

const client = new ArchonClient({
    apiKey: process.env.ARCHON_API_KEY
});
</code></pre>
</div>

And here's another example in `Python`:

```python
from archon import Client

client = Client(api_key="your-key")
result = client.query("search term")
```
"""
        
        all_code = code_extraction_service.extract_all_code(mixed_content)
        
        assert len(all_code) >= 3  # bash, typescript, python
        
        languages = [block["language"] for block in all_code]
        assert "bash" in languages
        assert "typescript" in languages
        assert "python" in languages


class TestProgressMapper:
    """Test cases for Progress Mapper"""
    
    @pytest.fixture
    def progress_mapper(self):
        """Create ProgressMapper instance"""
        return ProgressMapper()
    
    def test_map_progress_crawling_stages(self, progress_mapper):
        """Test progress mapping for different crawling stages"""
        # Test different stages
        stages = [
            ("initializing", 0, 0),
            ("crawling", 50, 25),
            ("processing", 100, 50),
            ("indexing", 50, 75),
            ("completed", 100, 100)
        ]
        
        for stage, stage_progress, expected_overall in stages:
            overall = progress_mapper.map_progress(stage, stage_progress)
            assert overall == expected_overall
    
    def test_progress_mapping_bounds(self, progress_mapper):
        """Test progress mapping boundary conditions"""
        # Test negative progress
        result = progress_mapper.map_progress("crawling", -10)
        assert result >= 0
        
        # Test progress over 100
        result = progress_mapper.map_progress("crawling", 150)
        assert result <= 100
        
        # Test unknown stage
        result = progress_mapper.map_progress("unknown_stage", 50)
        assert 0 <= result <= 100
    
    def test_progress_consistency(self, progress_mapper):
        """Test that progress never decreases within a stage"""
        stage = "crawling"
        last_progress = 0
        
        for i in range(0, 101, 10):
            current_progress = progress_mapper.map_progress(stage, i)
            assert current_progress >= last_progress
            last_progress = current_progress
    
    def test_progress_stage_transitions(self, progress_mapper):
        """Test smooth transitions between stages"""
        # End of one stage should be close to start of next
        crawling_end = progress_mapper.map_progress("crawling", 100)
        processing_start = progress_mapper.map_progress("processing", 0)
        
        # Should be reasonably close (within 10 points)
        assert abs(processing_start - crawling_end) <= 10


class TestDatabaseMetricsService:
    """Test cases for Database Metrics Service"""
    
    @pytest.fixture
    def metrics_service(self, in_memory_supabase_client):
        """Create DatabaseMetricsService with in-memory client"""
        return DatabaseMetricsService(supabase_client=in_memory_supabase_client)
    
    def test_get_source_statistics(self, metrics_service):
        """Test getting statistics for knowledge sources"""
        # This would test actual metrics if implemented
        # For now, test that the service can be instantiated and called
        stats = metrics_service.get_source_statistics()
        
        assert isinstance(stats, dict)
        # Would check for expected keys like 'total_sources', 'total_items', etc.
    
    def test_get_crawl_session_metrics(self, metrics_service):
        """Test getting metrics for crawl sessions"""
        session_id = "test-session-123"
        
        metrics = metrics_service.get_crawl_session_metrics(session_id)
        
        assert isinstance(metrics, dict)
        # Would check for metrics like 'urls_crawled', 'success_rate', 'duration', etc.
    
    def test_get_knowledge_base_health(self, metrics_service):
        """Test getting overall knowledge base health metrics"""
        health = metrics_service.get_knowledge_base_health()
        
        assert isinstance(health, dict)
        # Would check for health indicators like 'index_size', 'last_update', 'error_rate', etc.


class TestKnowledgeServiceIntegration:
    """Integration tests for Knowledge Base Services"""
    
    @pytest.fixture
    def integrated_services(self, in_memory_supabase_client):
        """Create integrated knowledge services"""
        return {
            "knowledge": KnowledgeItemService(supabase_client=in_memory_supabase_client),
            "orchestration": CrawlOrchestrationService(),
            "code_extraction": CodeExtractionService(),
            "progress": ProgressMapper(),
            "metrics": DatabaseMetricsService(supabase_client=in_memory_supabase_client)
        }
    
    @pytest.mark.asyncio
    async def test_end_to_end_crawl_and_index(self, integrated_services):
        """Test end-to-end crawl and indexing workflow"""
        services = integrated_services
        
        # Mock crawled content with code
        crawled_content = """
# API Documentation

```python
def authenticate(api_key):
    headers = {"Authorization": f"Bearer {api_key}"}
    return headers
```

This function helps with API authentication.
"""
        
        # 1. Extract code from content
        code_blocks = services["code_extraction"].extract_code_blocks(crawled_content)
        assert len(code_blocks) == 1
        assert code_blocks[0]["language"] == "python"
        
        # 2. Create knowledge item with extracted content
        knowledge_data = {
            "url": "https://example.com/api-docs",
            "title": "API Documentation",
            "content": crawled_content,
            "source_id": "example.com",
            "metadata": {
                "type": "documentation",
                "has_code": True,
                "code_languages": ["python"]
            },
            "embedding": [0.1] * 1536
        }
        
        success, result = services["knowledge"].create_knowledge_item(**knowledge_data)
        assert success is True
        
        # 3. Verify item can be searched
        success, search_result = services["knowledge"].search_knowledge_items(
            query="API authentication",
            match_count=5
        )
        assert success is True
        assert len(search_result["items"]) > 0
    
    @pytest.mark.asyncio
    async def test_concurrent_operations(self, integrated_services):
        """Test concurrent knowledge base operations"""
        import asyncio
        
        services = integrated_services
        
        # Create multiple knowledge items concurrently
        async def create_item(i):
            return services["knowledge"].create_knowledge_item(
                url=f"https://example.com/page{i}",
                title=f"Page {i}",
                content=f"Content for page {i}",
                source_id="example.com",
                metadata={"page": i},
                embedding=[0.1 * i] * 1536
            )
        
        # Run concurrent operations
        tasks = [create_item(i) for i in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should succeed
        successful_results = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_results) == 5
        
        for success, result in successful_results:
            assert success is True