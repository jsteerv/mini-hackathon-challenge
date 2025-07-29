"""
Integration tests for Archon server services

Tests end-to-end workflows that involve multiple services working together,
including real-time updates, complex data flows, and cross-service communication.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio

from src.server.services.projects.project_service import ProjectService
from src.server.services.projects.task_service import TaskService
from src.server.services.projects.document_service import DocumentService
from src.server.services.knowledge.knowledge_item_service import KnowledgeItemService
from src.server.services.rag.crawling_service import CrawlingService
from src.server.fastapi.socketio_handlers import (
    broadcast_project_update,
    broadcast_task_update,
    broadcast_crawl_progress
)


class TestProjectLifecycleIntegration:
    """Integration tests for complete project lifecycle"""
    
    @pytest.fixture
    def integrated_services(self, in_memory_supabase_client):
        """Create integrated services for project lifecycle"""
        return {
            "project": ProjectService(supabase_client=in_memory_supabase_client),
            "task": TaskService(supabase_client=in_memory_supabase_client),
            "document": DocumentService(supabase_client=in_memory_supabase_client),
            "knowledge": KnowledgeItemService(supabase_client=in_memory_supabase_client)
        }
    
    def test_end_to_end_project_creation_workflow(self, integrated_services):
        """Test complete project creation workflow"""
        services = integrated_services
        
        # Step 1: Create project
        success, project_result = services["project"].create_project(
            title="E2E Test Project",
            github_repo="https://github.com/test/e2e-project"
        )
        assert success is True
        project_id = project_result["project"]["id"]
        
        # Step 2: Add initial documentation
        success, doc_result = services["document"].add_document(
            project_id=project_id,
            document_type="prd",
            title="Product Requirements Document",
            content={
                "overview": "E2E test project for Archon",
                "features": ["Feature 1", "Feature 2", "Feature 3"],
                "requirements": {
                    "functional": ["Auth system", "User management", "Data processing"],
                    "non_functional": ["Performance", "Security", "Scalability"]
                }
            },
            metadata={"version": "1.0", "author": "Test Suite"}
        )
        assert success is True
        doc_id = doc_result["document"]["id"]
        
        # Step 3: Create tasks based on requirements
        task_titles = ["Implement Authentication", "Build User Management", "Setup Data Processing"]
        created_tasks = []
        
        for i, title in enumerate(task_titles):
            success, task_result = services["task"].create_task(
                project_id=project_id,
                title=title,
                description=f"Task for {title}",
                assignee="Developer" if i % 2 == 0 else "QA",
                status="todo",
                priority="high" if i == 0 else "medium"
            )
            assert success is True
            created_tasks.append(task_result["task"])
        
        # Step 4: Add related knowledge items
        knowledge_items = [
            {
                "url": "https://auth-docs.example.com/guide",
                "title": "Authentication Guide",
                "content": "How to implement secure authentication...",
                "source_id": "auth-docs.example.com",
                "metadata": {"category": "authentication", "project_id": project_id}
            },
            {
                "url": "https://user-management.example.com/api",
                "title": "User Management API",
                "content": "API documentation for user management...",
                "source_id": "user-management.example.com", 
                "metadata": {"category": "user_management", "project_id": project_id}
            }
        ]
        
        for item_data in knowledge_items:
            item_data["embedding"] = [0.1] * 1536  # Mock embedding
            success, knowledge_result = services["knowledge"].create_knowledge_item(**item_data)
            assert success is True
        
        # Step 5: Verify project state
        success, get_result = services["project"].get_project(project_id)
        assert success is True
        assert get_result["project"]["title"] == "E2E Test Project"
        
        # Verify tasks exist
        success, task_list = services["task"].list_tasks(
            filter_by="project",
            filter_value=project_id
        )
        assert success is True
        assert len(task_list["tasks"]) == 3
        
        # Verify documents exist
        success, doc_list = services["document"].list_documents(project_id)
        assert success is True
        assert len(doc_list["documents"]) == 1
        
        # Verify knowledge items can be searched
        success, search_result = services["knowledge"].search_knowledge_items(
            query="authentication guide",
            match_count=10
        )
        assert success is True
        assert len(search_result["items"]) > 0
    
    @pytest.mark.asyncio
    async def test_project_update_with_realtime_notifications(self, integrated_services):
        """Test project updates with real-time Socket.IO notifications"""
        services = integrated_services
        
        # Mock Socket.IO
        mock_sio = AsyncMock()
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Create project
            success, project_result = services["project"].create_project(title="Real-time Test Project")
            assert success is True
            project_id = project_result["project"]["id"]
            
            # Create task
            success, task_result = services["task"].create_task(
                project_id=project_id,
                title="Real-time Task",
                status="todo"
            )
            assert success is True
            task_id = task_result["task"]["id"]
            
            # Update task and broadcast
            success, update_result = services["task"].update_task(
                task_id,
                {"status": "in_progress", "assignee": "Developer"}
            )
            assert success is True
            
            # Broadcast task update
            await broadcast_task_update(
                project_id=project_id,
                event_type="task_updated",
                task_data=update_result["task"]
            )
            
            # Verify Socket.IO emission
            mock_sio.emit.assert_called_with(
                "task_updated",
                update_result["task"],
                room=project_id
            )
            
            # Broadcast project update
            await broadcast_project_update()
            
            # Should have called emit for project list update
            assert mock_sio.emit.call_count >= 2
    
    def test_document_versioning_integration(self, integrated_services):
        """Test document versioning integration with project workflow"""
        services = integrated_services
        
        # Create project and document
        success, project_result = services["project"].create_project(title="Versioning Test Project")
        assert success is True
        project_id = project_result["project"]["id"]
        
        # Add initial document
        initial_content = {
            "version": "1.0",
            "features": ["Feature A", "Feature B"],
            "status": "draft"
        }
        
        success, doc_result = services["document"].add_document(
            project_id=project_id,
            document_type="specification",
            title="Technical Specification",
            content=initial_content,
            metadata={"author": "Developer 1", "review_status": "pending"}
        )
        assert success is True
        doc_id = doc_result["document"]["id"]
        
        # Update document (simulating version 2.0)
        updated_content = {
            "version": "2.0",
            "features": ["Feature A", "Feature B", "Feature C"],
            "status": "reviewed",
            "changes": ["Added Feature C", "Updated Feature A implementation"]
        }
        
        success, update_result = services["document"].update_document(
            project_id=project_id,
            doc_id=doc_id,
            content=updated_content,
            metadata={"author": "Developer 2", "review_status": "approved"}
        )
        assert success is True
        
        # Verify document was updated
        success, get_result = services["document"].get_document(project_id, doc_id)
        assert success is True
        assert get_result["document"]["content"]["version"] == "2.0"
        assert len(get_result["document"]["content"]["features"]) == 3


class TestKnowledgeBaseIntegration:
    """Integration tests for knowledge base and search functionality"""
    
    @pytest.fixture
    def knowledge_services(self, in_memory_supabase_client):
        """Create services for knowledge base integration"""
        return {
            "knowledge": KnowledgeItemService(supabase_client=in_memory_supabase_client),
            "crawling": CrawlingService(supabase_client=in_memory_supabase_client)
        }
    
    @pytest.mark.asyncio
    async def test_crawl_to_knowledge_base_workflow(self, knowledge_services):
        """Test complete workflow from crawling to knowledge base indexing"""
        services = knowledge_services
        
        # Mock crawler
        mock_crawler = AsyncMock()
        services["crawling"].crawler = mock_crawler
        
        # Mock crawl results with code examples
        crawl_results = [
            {
                "url": "https://docs.example.com/api-auth",
                "title": "API Authentication Guide", 
                "content": """# API Authentication

To authenticate with our API, include your API key in the Authorization header:

```python
import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get("https://api.example.com/users", headers=headers)
print(response.json())
```

## Error Handling

```python
try:
    response = requests.get("https://api.example.com/users", headers=headers)
    response.raise_for_status()
    data = response.json()
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
```
""",
                "metadata": {"category": "authentication", "language": "python"}
            },
            {
                "url": "https://docs.example.com/user-management", 
                "title": "User Management",
                "content": """# User Management

## Creating Users

```javascript
const createUser = async (userData) => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(userData)
    });
    
    return response.json();
};

// Usage
const newUser = await createUser({
    name: 'John Doe',
    email: 'john@example.com'
});
```
""",
                "metadata": {"category": "user_management", "language": "javascript"}
            }
        ]
        
        # Mock successful crawl responses
        for i, result_data in enumerate(crawl_results):
            mock_result = Mock()
            mock_result.success = True
            mock_result.url = result_data["url"]
            mock_result.markdown = result_data["content"]
            mock_result.html = f"<div>{result_data['content']}</div>"
            mock_result.metadata = {
                "title": result_data["title"],
                **result_data["metadata"]
            }
            mock_result.error_message = None
            
            mock_crawler.arun.return_value = mock_result
            
            # Crawl the page
            crawl_result = await services["crawling"].crawl_single_page(result_data["url"])
            assert crawl_result["success"] is True
            
            # Index the crawled content
            success, knowledge_result = services["knowledge"].create_knowledge_item(
                url=result_data["url"],
                title=result_data["title"],
                content=result_data["content"],
                source_id="docs.example.com",
                metadata=result_data["metadata"],
                embedding=[0.1 * (i + 1)] * 1536  # Mock different embeddings
            )
            assert success is True
        
        # Test search functionality
        success, search_result = services["knowledge"].search_knowledge_items(
            query="API authentication python",
            match_count=10
        )
        assert success is True
        assert len(search_result["items"]) > 0
        
        # Search should find relevant items
        found_auth_item = any(
            "authentication" in item.get("metadata", {}).get("category", "").lower()
            for item in search_result["items"]
        )
        assert found_auth_item
    
    @pytest.mark.asyncio
    async def test_bulk_knowledge_processing(self, knowledge_services):
        """Test bulk processing of knowledge items"""
        services = knowledge_services
        
        # Create large batch of knowledge items
        batch_items = []
        topics = ["authentication", "user_management", "data_processing", "api_design", "security"]
        
        for i in range(50):  # Create 50 items
            topic = topics[i % len(topics)]
            item = {
                "url": f"https://docs.example.com/{topic}/{i}",
                "title": f"{topic.title()} Guide {i}",
                "content": f"This is a comprehensive guide about {topic}. " * 50,  # Longer content
                "source_id": "docs.example.com",
                "metadata": {
                    "category": topic,
                    "index": i,
                    "batch": "bulk_test"
                },
                "embedding": [0.1 * i] * 1536
            }
            batch_items.append(item)
        
        # Process in smaller batches to simulate real-world usage
        batch_size = 10
        total_created = 0
        
        for i in range(0, len(batch_items), batch_size):
            batch = batch_items[i:i + batch_size]
            success, result = services["knowledge"].bulk_create_knowledge_items(batch)
            
            assert success is True
            total_created += result.get("created_count", 0)
        
        # Verify all items were created
        assert total_created == len(batch_items)
        
        # Test search across all categories
        for topic in topics:
            success, search_result = services["knowledge"].search_knowledge_items(
                query=f"{topic} guide",
                match_count=20
            )
            assert success is True
            assert len(search_result["items"]) > 0


class TestRealTimeFeatureIntegration:
    """Integration tests for real-time features"""
    
    @pytest.fixture
    def realtime_services(self, in_memory_supabase_client):
        """Create services for real-time integration testing"""
        return {
            "project": ProjectService(supabase_client=in_memory_supabase_client),
            "task": TaskService(supabase_client=in_memory_supabase_client),
            "knowledge": KnowledgeItemService(supabase_client=in_memory_supabase_client)
        }
    
    @pytest.mark.asyncio
    async def test_real_time_crawl_progress_integration(self, realtime_services):
        """Test real-time crawl progress updates"""
        services = realtime_services
        
        # Mock Socket.IO
        mock_sio = AsyncMock()
        progress_updates = []
        
        async def capture_progress(event, data, room):
            progress_updates.append({"event": event, "data": data, "room": room})
        
        mock_sio.emit.side_effect = capture_progress
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Simulate crawl progress updates
            progress_id = "crawl-integration-test"
            
            # Initial progress
            await broadcast_crawl_progress(progress_id, {
                "progress": 0,
                "status": "starting",
                "message": "Initializing crawl session",
                "urls_total": 10,
                "urls_completed": 0
            })
            
            # Intermediate progress updates
            for i in range(1, 11):
                await broadcast_crawl_progress(progress_id, {
                    "progress": i * 10,
                    "status": "crawling",
                    "message": f"Processing URL {i}/10",
                    "current_url": f"https://example.com/page{i}",
                    "urls_total": 10,
                    "urls_completed": i
                })
                
                # Add small delay to test rate limiting
                await asyncio.sleep(0.01)
            
            # Final completion
            await broadcast_crawl_progress(progress_id, {
                "progress": 100,
                "status": "completed",
                "message": "Crawl session completed successfully",
                "urls_total": 10,
                "urls_completed": 10
            })
            
            # Verify progress updates were broadcasted
            assert len(progress_updates) > 0
            
            # Check that important events (starting, completed) were always broadcasted
            starting_events = [u for u in progress_updates if u["data"].get("status") == "starting"]
            completed_events = [u for u in progress_updates if u["data"].get("status") == "completed"]
            
            assert len(starting_events) >= 1
            assert len(completed_events) >= 1
            
            # Verify progressId was added to all events
            for update in progress_updates:
                assert update["data"].get("progressId") == progress_id
    
    @pytest.mark.asyncio
    async def test_concurrent_real_time_updates(self, realtime_services):
        """Test concurrent real-time updates across multiple projects"""
        services = realtime_services
        mock_sio = AsyncMock()
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Create multiple projects
            projects = []
            for i in range(5):
                success, result = services["project"].create_project(title=f"Concurrent Project {i}")
                assert success is True
                projects.append(result["project"])
            
            # Create tasks for each project concurrently
            async def create_and_update_tasks(project):
                # Create task
                success, task_result = services["task"].create_task(
                    project_id=project["id"],
                    title=f"Task for {project['title']}",
                    status="todo"
                )
                assert success is True
                
                # Update task status
                success, update_result = services["task"].update_task(
                    task_result["task"]["id"],
                    {"status": "in_progress"}
                )
                assert success is True
                
                # Broadcast update
                await broadcast_task_update(
                    project_id=project["id"],
                    event_type="task_updated",
                    task_data=update_result["task"]
                )
                
                return update_result["task"]
            
            # Run concurrent updates
            tasks = [create_and_update_tasks(project) for project in projects]
            results = await asyncio.gather(*tasks)
            
            # Verify all tasks were processed
            assert len(results) == 5
            
            # Verify Socket.IO broadcasts occurred
            assert mock_sio.emit.call_count >= 5
    
    @pytest.mark.asyncio
    async def test_error_handling_in_real_time_updates(self, realtime_services):
        """Test error handling in real-time update scenarios"""
        services = realtime_services
        
        # Mock Socket.IO that sometimes fails
        mock_sio = AsyncMock()
        call_count = 0
        
        async def intermittent_emit(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count % 3 == 0:  # Fail every 3rd call
                raise Exception("Socket.IO connection lost")
            return True
        
        mock_sio.emit.side_effect = intermittent_emit
        
        with patch('src.server.fastapi.socketio_handlers.sio', mock_sio):
            # Create project and tasks
            success, project_result = services["project"].create_project(title="Error Handling Test")
            assert success is True
            project_id = project_result["project"]["id"]
            
            # Try multiple broadcasts, some should fail
            successful_broadcasts = 0
            failed_broadcasts = 0
            
            for i in range(10):
                try:
                    await broadcast_task_update(
                        project_id=project_id,
                        event_type="task_updated",
                        task_data={"id": f"task-{i}", "status": "updated"}
                    )
                    successful_broadcasts += 1
                except Exception:
                    failed_broadcasts += 1
            
            # Some broadcasts should succeed, some should fail
            assert successful_broadcasts > 0
            assert failed_broadcasts > 0


class TestCrossServiceDataConsistency:
    """Integration tests for data consistency across services"""
    
    @pytest.fixture
    def consistency_services(self, in_memory_supabase_client):
        """Create services for consistency testing"""
        return {
            "project": ProjectService(supabase_client=in_memory_supabase_client),
            "task": TaskService(supabase_client=in_memory_supabase_client),
            "document": DocumentService(supabase_client=in_memory_supabase_client),
            "knowledge": KnowledgeItemService(supabase_client=in_memory_supabase_client)
        }
    
    def test_referential_integrity_across_services(self, consistency_services):
        """Test referential integrity between related entities"""
        services = consistency_services
        
        # Create project
        success, project_result = services["project"].create_project(title="Integrity Test Project")
        assert success is True
        project_id = project_result["project"]["id"]
        
        # Create related entities
        success, task_result = services["task"].create_task(
            project_id=project_id,
            title="Test Task"
        )
        assert success is True
        task_id = task_result["task"]["id"]
        
        success, doc_result = services["document"].add_document(
            project_id=project_id,
            document_type="specification",
            title="Test Document",
            content={"spec": "test"}
        )
        assert success is True
        doc_id = doc_result["document"]["id"]
        
        # Verify relationships exist
        success, project_get = services["project"].get_project(project_id)
        assert success is True
        
        success, task_get = services["task"].get_task(task_id)
        assert success is True
        assert task_get["task"]["project_id"] == project_id
        
        success, doc_get = services["document"].get_document(project_id, doc_id)
        assert success is True
        assert doc_get["document"]["project_id"] == project_id
        
        # Test cascading operations (if implemented)
        # For example, deleting a project should handle related entities appropriately
    
    @pytest.mark.asyncio
    async def test_concurrent_data_modification_consistency(self, consistency_services):
        """Test data consistency under concurrent modifications"""
        services = consistency_services
        
        # Create project
        success, project_result = services["project"].create_project(title="Concurrency Test")
        assert success is True
        project_id = project_result["project"]["id"]
        
        # Create multiple tasks concurrently that reference the same project
        async def create_task_with_retry(task_number):
            for attempt in range(3):  # Retry mechanism
                try:
                    success, result = services["task"].create_task(
                        project_id=project_id,
                        title=f"Concurrent Task {task_number}",
                        description=f"Task created concurrently - attempt {attempt}"
                    )
                    if success:
                        return result["task"]
                    await asyncio.sleep(0.01)  # Brief delay before retry
                except Exception as e:
                    if attempt == 2:  # Last attempt
                        raise e
                    await asyncio.sleep(0.01)
            return None
        
        # Create 20 tasks concurrently
        tasks = [create_task_with_retry(i) for i in range(20)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Count successful task creations
        successful_tasks = [r for r in results if r is not None and not isinstance(r, Exception)]
        
        # Most tasks should be created successfully
        assert len(successful_tasks) >= 15  # Allow some failures due to concurrency
        
        # Verify all successful tasks have correct project_id
        for task in successful_tasks:
            assert task["project_id"] == project_id
        
        # Verify project still exists and is consistent
        success, project_check = services["project"].get_project(project_id)
        assert success is True
        assert project_check["project"]["id"] == project_id
    
    def test_data_synchronization_between_services(self, consistency_services):
        """Test data synchronization scenarios between services"""
        services = consistency_services
        
        # Create project with GitHub repo
        github_repo = "https://github.com/test/sync-project"
        success, project_result = services["project"].create_project(
            title="Sync Test Project",
            github_repo=github_repo
        )
        assert success is True
        project_id = project_result["project"]["id"]
        
        # Add knowledge items related to the project
        related_knowledge = [
            {
                "url": f"{github_repo}/blob/main/README.md",
                "title": "Project README",
                "content": "# Sync Test Project\n\nThis project tests synchronization...",
                "source_id": "github.com",
                "metadata": {"project_id": project_id, "type": "documentation"}
            },
            {
                "url": f"{github_repo}/blob/main/docs/api.md",
                "title": "API Documentation", 
                "content": "# API Documentation\n\n## Endpoints\n\n### GET /api/sync",
                "source_id": "github.com",
                "metadata": {"project_id": project_id, "type": "api_docs"}
            }
        ]
        
        knowledge_items = []
        for item_data in related_knowledge:
            item_data["embedding"] = [0.1] * 1536
            success, result = services["knowledge"].create_knowledge_item(**item_data)
            assert success is True
            knowledge_items.append(result["knowledge_item"])
        
        # Update project and verify related data consistency
        success, update_result = services["project"].update_project(
            project_id,
            {"title": "Updated Sync Project"}
        )
        assert success is True
        
        # Verify knowledge items still reference correct project
        for item in knowledge_items:
            success, item_check = services["knowledge"].get_knowledge_item(item["id"])
            assert success is True
            assert item_check["knowledge_item"]["metadata"]["project_id"] == project_id
        
        # Search should still find items related to updated project
        success, search_result = services["knowledge"].search_knowledge_items(
            query="sync project documentation",
            match_count=10
        )
        assert success is True
        
        # Should find items with matching project_id in metadata
        found_related = any(
            item.get("metadata", {}).get("project_id") == project_id
            for item in search_result["items"]
        )
        assert found_related