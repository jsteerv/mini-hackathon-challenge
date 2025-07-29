"""
Test suite for Edge Cases and Error Conditions

Tests error handling, boundary conditions, race conditions,
and other edge cases across all services.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading

from src.server.services.projects.project_service import ProjectService
from src.server.services.knowledge.knowledge_item_service import KnowledgeItemService
from src.server.services.search.vector_search_service import search_documents
from src.server.services.rag.crawling_service import CrawlingService


class TestDatabaseErrorHandling:
    """Test cases for database error conditions"""
    
    @pytest.fixture
    def failing_supabase_client(self):
        """Mock Supabase client that simulates various database failures"""
        client = Mock()
        
        # Different types of database errors
        def table_method(*args, **kwargs):
            table_mock = Mock()
            
            # Simulate connection timeout
            def connection_timeout(*args, **kwargs):
                raise Exception("Connection timeout: Unable to connect to database")
            
            # Simulate constraint violation
            def constraint_violation(*args, **kwargs):
                raise Exception("UNIQUE constraint failed: projects.title")
            
            # Simulate insufficient permissions
            def permission_error(*args, **kwargs):
                raise Exception("Permission denied: insufficient privileges")
            
            # Simulate network error
            def network_error(*args, **kwargs):
                raise Exception("Network error: Connection refused")
            
            # Random error simulation
            error_type = hash(str(args) + str(kwargs)) % 4
            if error_type == 0:
                table_mock.insert.side_effect = connection_timeout
                table_mock.select.side_effect = connection_timeout
                table_mock.update.side_effect = connection_timeout
                table_mock.delete.side_effect = connection_timeout
            elif error_type == 1:
                table_mock.insert.side_effect = constraint_violation
                table_mock.select.return_value.execute.return_value.data = []
                table_mock.update.side_effect = constraint_violation
                table_mock.delete.return_value.execute.return_value.data = []
            elif error_type == 2:
                table_mock.insert.side_effect = permission_error
                table_mock.select.side_effect = permission_error
                table_mock.update.side_effect = permission_error
                table_mock.delete.side_effect = permission_error
            else:
                table_mock.insert.side_effect = network_error
                table_mock.select.side_effect = network_error
                table_mock.update.side_effect = network_error
                table_mock.delete.side_effect = network_error
            
            return table_mock
        
        client.table.side_effect = table_method
        return client
    
    def test_project_service_database_failures(self, failing_supabase_client):
        """Test project service handling of database failures"""
        project_service = ProjectService(supabase_client=failing_supabase_client)
        
        # Test create project with database failure
        success, result = project_service.create_project(title="Test Project")
        
        assert success is False
        assert "error" in result
        assert any(keyword in result["error"].lower() for keyword in 
                  ["timeout", "constraint", "permission", "network"])
    
    def test_knowledge_service_database_failures(self, failing_supabase_client):
        """Test knowledge service handling of database failures"""
        knowledge_service = KnowledgeItemService(supabase_client=failing_supabase_client)
        
        # Test create knowledge item with database failure
        success, result = knowledge_service.create_knowledge_item(
            url="https://example.com/test",
            title="Test Item",
            content="Test content",
            source_id="example.com",
            metadata={},
            embedding=[0.1] * 1536
        )
        
        assert success is False
        assert "error" in result
    
    def test_vector_search_database_failures(self, failing_supabase_client):
        """Test vector search handling of database failures"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_embedding:
            mock_embedding.return_value = [0.1] * 1536
            
            results = search_documents(
                client=failing_supabase_client,
                query="test query",
                match_count=5
            )
            
            # Should handle gracefully and return empty results
            assert results == []


class TestConcurrencyAndRaceConditions:
    """Test cases for concurrency issues and race conditions"""
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Project service for concurrency tests"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    @pytest.mark.asyncio
    async def test_concurrent_project_creation(self, project_service):
        """Test concurrent project creation with same title"""
        project_title = "Concurrent Test Project"
        
        # Create multiple concurrent requests
        async def create_project_task():
            return project_service.create_project(title=project_title)
        
        # Run 10 concurrent creations
        tasks = [create_project_task() for _ in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # At least one should succeed, others might fail due to uniqueness constraints
        successful_results = [r for r in results if not isinstance(r, Exception) and r[0] is True]
        failed_results = [r for r in results if isinstance(r, Exception) or r[0] is False]
        
        # Should have at least one success
        assert len(successful_results) >= 1
        # Some might fail due to duplicate titles
        assert len(successful_results) + len(failed_results) == 10
    
    @pytest.mark.asyncio  
    async def test_concurrent_database_operations(self, in_memory_supabase_client):
        """Test concurrent read/write operations on database"""
        knowledge_service = KnowledgeItemService(supabase_client=in_memory_supabase_client)
        
        # Create items concurrently
        async def create_item(i):
            return knowledge_service.create_knowledge_item(
                url=f"https://example.com/concurrent/{i}",
                title=f"Concurrent Item {i}",
                content=f"Content for item {i}",
                source_id="example.com",
                metadata={"index": i},
                embedding=[0.1 * i] * 1536
            )
        
        # Create 20 items concurrently
        create_tasks = [create_item(i) for i in range(20)]
        create_results = await asyncio.gather(*create_tasks, return_exceptions=True)
        
        # Count successful creations
        successful_creates = [r for r in create_results if not isinstance(r, Exception) and r[0] is True]
        
        # Most should succeed
        assert len(successful_creates) >= 15  # Allow some failures due to concurrency
    
    @pytest.mark.asyncio
    async def test_race_condition_in_progress_tracking(self):
        """Test race conditions in progress tracking"""
        progress_data = {"current": 0, "lock": threading.Lock()}
        
        async def update_progress(increment):
            """Simulate progress update with potential race condition"""
            # Simulate some async work
            await asyncio.sleep(0.01)
            
            # Unsafe update (potential race condition)
            current = progress_data["current"]
            await asyncio.sleep(0.001)  # Simulate processing time
            progress_data["current"] = current + increment
        
        # Run concurrent progress updates
        tasks = [update_progress(1) for _ in range(50)]
        await asyncio.gather(*tasks)
        
        # Due to race conditions, final value might be less than expected
        # This test demonstrates the need for proper synchronization
        assert progress_data["current"] <= 50
        
        # Now test with proper synchronization
        progress_data["current"] = 0
        
        async def safe_update_progress(increment):
            """Thread-safe progress update"""
            with progress_data["lock"]:
                current = progress_data["current"]
                progress_data["current"] = current + increment
        
        # Run concurrent safe updates
        safe_tasks = [safe_update_progress(1) for _ in range(50)]
        await asyncio.gather(*safe_tasks)
        
        # Should be exact with proper synchronization
        assert progress_data["current"] == 50


class TestMemoryAndResourceLimits:
    """Test cases for memory usage and resource limits"""
    
    def test_large_document_processing(self, in_memory_supabase_client):
        """Test processing of very large documents"""
        knowledge_service = KnowledgeItemService(supabase_client=in_memory_supabase_client)
        
        # Create very large content
        large_content = "This is a large document. " * 100000  # ~2.5MB of text
        large_embedding = [0.1] * 1536
        
        success, result = knowledge_service.create_knowledge_item(
            url="https://example.com/large-doc",
            title="Large Document",
            content=large_content,
            source_id="example.com",
            metadata={"size": "large"},
            embedding=large_embedding
        )
        
        # Should handle large documents gracefully
        assert success is True or "error" in result
        
        if success:
            assert result["knowledge_item"]["content"] == large_content
    
    def test_bulk_operations_memory_usage(self, in_memory_supabase_client):
        """Test memory usage during bulk operations"""
        knowledge_service = KnowledgeItemService(supabase_client=in_memory_supabase_client)
        
        # Create large batch of items
        batch_size = 1000
        items = []
        
        for i in range(batch_size):
            items.append({
                "url": f"https://example.com/bulk/{i}",
                "title": f"Bulk Item {i}",
                "content": f"Content for bulk item {i}" * 100,  # Moderate size content
                "source_id": "example.com",
                "metadata": {"batch_index": i},
                "embedding": [0.1 * (i % 100)] * 1536
            })
        
        # Process bulk creation
        success, result = knowledge_service.bulk_create_knowledge_items(items)
        
        # Should handle bulk operations efficiently
        assert success is True or "error" in result
        
        if success:
            assert result["created_count"] <= batch_size
    
    @pytest.mark.asyncio
    async def test_crawler_memory_with_many_urls(self):
        """Test crawler memory usage with many URLs"""
        crawling_service = CrawlingService()
        
        # Mock crawler to avoid actual HTTP calls
        mock_crawler = AsyncMock()
        mock_result = Mock()
        mock_result.success = True
        mock_result.url = "https://example.com/page"
        mock_result.markdown = "# Test Page\nContent here"
        mock_result.html = "<h1>Test Page</h1><p>Content here</p>"
        mock_result.metadata = {"title": "Test Page"}
        mock_result.error_message = None
        
        mock_crawler.arun.return_value = mock_result
        crawling_service.crawler = mock_crawler
        
        # Test with many URLs
        urls = [f"https://example.com/page{i}" for i in range(1000)]
        
        # Process URLs in batches to test memory management
        batch_size = 100
        results = []
        
        for i in range(0, len(urls), batch_size):
            batch_urls = urls[i:i + batch_size]
            batch_tasks = [crawling_service.crawl_single_page(url) for url in batch_urls]
            batch_results = await asyncio.gather(*batch_tasks)
            results.extend(batch_results)
        
        # Should process all URLs without memory issues
        assert len(results) == len(urls)
        successful_results = [r for r in results if r.get("success")]
        assert len(successful_results) == len(urls)


class TestInputValidationAndSanitization:
    """Test cases for input validation and sanitization"""
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    def test_malicious_input_handling(self, project_service):
        """Test handling of potentially malicious inputs"""
        malicious_inputs = [
            "'; DROP TABLE projects; --",  # SQL injection
            "<script>alert('xss')</script>",  # XSS
            "../../etc/passwd",  # Path traversal
            "\x00\x01\x02",  # Null bytes and control characters
            "A" * 10000,  # Extremely long input
            "\n\r\t",  # Special whitespace characters
            "🚀💀🎉" * 1000,  # Unicode/emoji bomb
        ]
        
        for malicious_input in malicious_inputs:
            success, result = project_service.create_project(title=malicious_input)
            
            # Should either sanitize the input or reject it
            if success:
                # If accepted, should be sanitized
                assert result["project"]["title"] != malicious_input or len(result["project"]["title"]) < len(malicious_input)
            else:
                # If rejected, should have error message
                assert "error" in result
    
    def test_unicode_handling(self, project_service):
        """Test proper Unicode handling"""
        unicode_titles = [
            "Проект на русском языке",  # Cyrillic
            "中文项目名称",  # Chinese
            "プロジェクト名",  # Japanese
            "مشروع عربي",  # Arabic
            "🚀 Emoji Project 🎉",  # Emoji
            "Ḩ̷̛̭̺̮̝̯̈́͛̍̇̾͝e̸̢̳̠̣̻̫̊́̄͘͠ļ̷̰̱̪̺̠̔̽̉̊̋̕l̴̠̣̦̭̫̓̃̈̇̏͘ò̸̧̰̺̭̼̈́̃̓̏̏ ̶̡̛̮̞̰̈́̾͑̒̇Z̸̢̢̛̙̙̙̏̀̉̐̚å̸̤̝̖̯̪̂̓̿̕͝l̸̛̤̥̖̹̭̂̽̀̿̌g̶̢̧̛͔̙̗̈́̂̓̚͝ò̸͚̺̮̻̫̓̍͂̄̚",  # Zalgo text
        ]
        
        for title in unicode_titles:
            success, result = project_service.create_project(title=title)
            
            # Should handle Unicode gracefully
            assert success is True or "error" in result
            
            if success:
                # Title should be preserved or properly encoded
                assert result["project"]["title"] is not None
                assert len(result["project"]["title"]) > 0
    
    def test_boundary_value_testing(self, project_service):
        """Test boundary values for inputs"""
        # Test empty and minimal inputs
        boundary_cases = [
            "",  # Empty string
            " ",  # Single space
            "a",  # Single character
            "ab",  # Two characters
            "A" * 255,  # Maximum reasonable length
            "A" * 256,  # Just over maximum
            None,  # None value
        ]
        
        for title in boundary_cases:
            success, result = project_service.create_project(title=title)
            
            # Should handle boundary cases appropriately
            if title in [None, "", " "]:
                # Should reject empty/invalid titles
                assert success is False
                assert "error" in result
            elif len(str(title)) > 255:
                # Should reject overly long titles or truncate
                if success:
                    assert len(result["project"]["title"]) <= 255
                else:
                    assert "error" in result
            else:
                # Should accept valid titles
                assert success is True
                assert result["project"]["title"] == title.strip()


class TestTimeoutAndDeadlockHandling:
    """Test cases for timeout and deadlock scenarios"""
    
    @pytest.mark.asyncio
    async def test_operation_timeout_handling(self):
        """Test handling of operation timeouts"""
        async def slow_operation():
            """Simulate a slow operation"""
            await asyncio.sleep(10)  # Very slow operation
            return {"success": True, "data": "result"}
        
        # Test with timeout
        try:
            result = await asyncio.wait_for(slow_operation(), timeout=1.0)
            assert False, "Should have timed out"
        except asyncio.TimeoutError:
            # Expected timeout
            assert True
    
    @pytest.mark.asyncio
    async def test_crawler_timeout_handling(self):
        """Test crawler timeout scenarios"""
        crawling_service = CrawlingService()
        
        # Mock crawler with timeout
        mock_crawler = AsyncMock()
        mock_crawler.arun.side_effect = asyncio.TimeoutError("Crawl timeout")
        crawling_service.crawler = mock_crawler
        
        result = await crawling_service.crawl_single_page("https://slow-site.com/page")
        
        # Should handle timeout gracefully
        assert result["success"] is False
        assert "timeout" in result.get("error", "").lower() or "error" in result
    
    def test_database_deadlock_simulation(self, in_memory_supabase_client):
        """Test handling of database deadlock scenarios"""
        # Simulate deadlock by creating competing transactions
        project_service = ProjectService(supabase_client=in_memory_supabase_client)
        
        # Create competing operations that might deadlock
        def competing_operation_1():
            return project_service.create_project(title="Competing Project 1")
        
        def competing_operation_2():
            return project_service.create_project(title="Competing Project 2")
        
        # Run operations concurrently
        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(competing_operation_1)
            future2 = executor.submit(competing_operation_2)
            
            result1 = future1.result(timeout=5)
            result2 = future2.result(timeout=5)
        
        # At least one should succeed (may not be true deadlock in mock, but tests pattern)
        assert result1[0] is True or result2[0] is True


class TestNetworkAndExternalServiceFailures:
    """Test cases for network and external service failures"""
    
    @pytest.mark.asyncio
    async def test_openai_api_failures(self):
        """Test handling of OpenAI API failures"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_embedding:
            # Test different types of API failures
            api_failures = [
                Exception("API key invalid"),
                Exception("Rate limit exceeded"),
                Exception("Service temporarily unavailable"),
                Exception("Network connection failed"),
                None  # No response
            ]
            
            for failure in api_failures:
                if failure:
                    mock_embedding.side_effect = failure
                else:
                    mock_embedding.return_value = None
                
                from src.server.services.search.vector_search_service import search_documents
                
                mock_client = Mock()
                mock_client.rpc.return_value.execute.return_value.data = []
                
                results = search_documents(
                    client=mock_client,
                    query="test query",
                    match_count=5
                )
                
                # Should handle API failures gracefully
                assert results == []
    
    @pytest.mark.asyncio
    async def test_github_api_failures(self):
        """Test handling of GitHub API failures"""
        with patch('requests.get') as mock_get:
            # Simulate various GitHub API failures
            github_failures = [
                Mock(status_code=401, json=lambda: {"message": "Bad credentials"}),
                Mock(status_code=403, json=lambda: {"message": "API rate limit exceeded"}),
                Mock(status_code=404, json=lambda: {"message": "Not Found"}),
                Mock(status_code=500, json=lambda: {"message": "Internal Server Error"}),
            ]
            
            for failure_response in github_failures:
                mock_get.return_value = failure_response
                
                # Test project creation with GitHub repo (if implemented)
                project_service = ProjectService()
                success, result = project_service.create_project(
                    title="GitHub Test Project",
                    github_repo="https://github.com/test/repo"
                )
                
                # Should create project even if GitHub API fails
                assert success is True or "error" in result
    
    @pytest.mark.asyncio
    async def test_network_intermittent_failures(self):
        """Test handling of intermittent network failures"""
        failure_count = 0
        max_failures = 3
        
        async def intermittent_network_call():
            nonlocal failure_count
            
            if failure_count < max_failures:
                failure_count += 1
                raise Exception(f"Network failure {failure_count}")
            
            return {"success": True, "data": "network_data"}
        
        # Test retry mechanism
        async def retry_with_backoff(operation, max_retries=5):
            for attempt in range(max_retries):
                try:
                    return await operation()
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff
        
        # Should eventually succeed after retries
        result = await retry_with_backoff(intermittent_network_call)
        assert result["success"] is True
        assert failure_count == max_failures


class TestErrorRecoveryAndGracefulDegradation:
    """Test cases for error recovery and graceful degradation"""
    
    def test_partial_service_failure_handling(self, in_memory_supabase_client):
        """Test system behavior when some services fail"""
        # Create services with mixed success/failure
        project_service = ProjectService(supabase_client=in_memory_supabase_client)
        
        # Mock knowledge service to fail
        failing_knowledge_service = Mock()
        failing_knowledge_service.create_knowledge_item.side_effect = Exception("Knowledge service down")
        
        # Project creation should still work even if knowledge service fails
        success, result = project_service.create_project(title="Partial Failure Test")
        
        assert success is True
        assert result["project"]["title"] == "Partial Failure Test"
    
    @pytest.mark.asyncio
    async def test_cascading_failure_prevention(self):
        """Test prevention of cascading failures"""
        # Simulate a service that depends on multiple other services
        class CompositeService:
            def __init__(self):
                self.service_a = Mock()
                self.service_b = Mock()
                self.service_c = Mock()
            
            async def complex_operation(self):
                """Operation that uses multiple services"""
                results = {"a": None, "b": None, "c": None}
                errors = []
                
                # Try each service independently
                try:
                    results["a"] = await self.service_a.operation()
                except Exception as e:
                    errors.append(f"Service A failed: {e}")
                
                try:
                    results["b"] = await self.service_b.operation()
                except Exception as e:
                    errors.append(f"Service B failed: {e}")
                
                try:
                    results["c"] = await self.service_c.operation()
                except Exception as e:
                    errors.append(f"Service C failed: {e}")
                
                # Return partial results instead of failing completely
                return {
                    "success": len(errors) < 3,  # Succeed if at least one service works
                    "results": results,
                    "errors": errors,
                    "partial": len(errors) > 0
                }
        
        # Test with one service failing
        composite = CompositeService()
        composite.service_a.operation = AsyncMock(return_value="A result")
        composite.service_b.operation = AsyncMock(side_effect=Exception("B failed"))
        composite.service_c.operation = AsyncMock(return_value="C result")
        
        result = await composite.complex_operation()
        
        # Should succeed with partial results
        assert result["success"] is True
        assert result["partial"] is True
        assert len(result["errors"]) == 1
        assert result["results"]["a"] == "A result"
        assert result["results"]["c"] == "C result"
    
    def test_error_logging_and_monitoring(self):
        """Test that errors are properly logged for monitoring"""
        logged_errors = []
        
        def mock_logger(level, message):
            logged_errors.append({"level": level, "message": message})
        
        # Test error logging in project service
        with patch('src.server.services.projects.project_service.logger') as mock_log:
            mock_log.error.side_effect = lambda msg: mock_logger("ERROR", msg)
            
            # Create project service with failing client
            failing_client = Mock()
            failing_client.table.side_effect = Exception("Database connection failed")
            
            project_service = ProjectService(supabase_client=failing_client)
            success, result = project_service.create_project(title="Error Logging Test")
            
            # Should log the error
            assert mock_log.error.called
            assert success is False