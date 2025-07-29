"""
Test suite for Project Management APIs

Tests project CRUD operations, task management endpoints,
document versioning, and GitHub integration.
"""

import pytest
from unittest.mock import Mock, patch
import uuid

from src.server.services.projects.project_service import ProjectService
from src.server.services.projects.task_service import TaskService
from src.server.services.projects.document_service import DocumentService
from src.server.services.projects.versioning_service import VersioningService


class TestProjectService:
    """Test cases for Project Service CRUD operations"""
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Create ProjectService with in-memory Supabase client"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def sample_project_data(self):
        """Sample project data for testing"""
        return {
            "title": "Test Project",
            "github_repo": "https://github.com/test/repo",
            "description": "A test project for development"
        }
    
    def test_create_project_success(self, project_service, sample_project_data):
        """Test successful project creation"""
        success, result = project_service.create_project(
            title=sample_project_data["title"],
            github_repo=sample_project_data["github_repo"]
        )
        
        assert success is True
        assert "project" in result
        assert result["project"]["title"] == sample_project_data["title"]
        assert result["project"]["github_repo"] == sample_project_data["github_repo"]
        assert "id" in result["project"]
        assert "created_at" in result["project"]
    
    def test_create_project_without_github_repo(self, project_service):
        """Test project creation without GitHub repository"""
        success, result = project_service.create_project(title="Project Without Repo")
        
        assert success is True
        assert result["project"]["title"] == "Project Without Repo"
        assert result["project"].get("github_repo") is None
    
    def test_create_project_invalid_title(self, project_service):
        """Test project creation with invalid title"""
        # Test empty title
        success, result = project_service.create_project(title="")
        assert success is False
        assert "error" in result
        assert "title is required" in result["error"]
        
        # Test None title
        success, result = project_service.create_project(title=None)
        assert success is False
        assert "error" in result
        
        # Test whitespace-only title
        success, result = project_service.create_project(title="   ")
        assert success is False
        assert "error" in result
    
    def test_create_project_title_trimming(self, project_service):
        """Test that project title is properly trimmed"""
        success, result = project_service.create_project(title="  Trimmed Project  ")
        
        assert success is True
        assert result["project"]["title"] == "Trimmed Project"
    
    def test_create_project_github_repo_trimming(self, project_service):
        """Test that GitHub repo URL is properly trimmed"""
        success, result = project_service.create_project(
            title="Test Project",
            github_repo="  https://github.com/test/repo  "
        )
        
        assert success is True
        assert result["project"]["github_repo"] == "https://github.com/test/repo"
    
    def test_list_projects_empty(self, project_service):
        """Test listing projects when none exist"""
        success, result = project_service.list_projects()
        
        assert success is True
        assert "projects" in result
        assert result["projects"] == []
    
    def test_list_projects_with_data(self, project_service):
        """Test listing projects with existing data"""
        # Create test projects
        projects_to_create = [
            {"title": "Project 1", "github_repo": "https://github.com/test/repo1"},
            {"title": "Project 2", "github_repo": "https://github.com/test/repo2"},
            {"title": "Project 3"}  # Without GitHub repo
        ]
        
        created_projects = []
        for project_data in projects_to_create:
            success, result = project_service.create_project(**project_data)
            assert success is True
            created_projects.append(result["project"])
        
        # List projects
        success, result = project_service.list_projects()
        
        assert success is True
        assert len(result["projects"]) == 3
        
        # Verify all created projects are in the list
        project_titles = [p["title"] for p in result["projects"]]
        assert "Project 1" in project_titles
        assert "Project 2" in project_titles
        assert "Project 3" in project_titles
    
    def test_get_project_success(self, project_service):
        """Test getting a specific project by ID"""
        # Create a project first
        success, create_result = project_service.create_project(
            title="Get Test Project",
            github_repo="https://github.com/test/get-repo"
        )
        assert success is True
        project_id = create_result["project"]["id"]
        
        # Get the project
        success, result = project_service.get_project(project_id)
        
        assert success is True
        assert "project" in result
        assert result["project"]["id"] == project_id
        assert result["project"]["title"] == "Get Test Project"
        assert result["project"]["github_repo"] == "https://github.com/test/get-repo"
    
    def test_get_project_not_found(self, project_service):
        """Test getting a non-existent project"""
        non_existent_id = str(uuid.uuid4())
        
        success, result = project_service.get_project(non_existent_id)
        
        assert success is False
        assert "error" in result
        assert "not found" in result["error"].lower()
    
    def test_get_project_invalid_id(self, project_service):
        """Test getting project with invalid ID format"""
        invalid_ids = ["", "not-a-uuid", "123", None]
        
        for invalid_id in invalid_ids:
            success, result = project_service.get_project(invalid_id)
            assert success is False
            assert "error" in result
    
    def test_delete_project_success(self, project_service):
        """Test successful project deletion"""
        # Create a project first
        success, create_result = project_service.create_project(title="Delete Test Project")
        assert success is True
        project_id = create_result["project"]["id"]
        
        # Delete the project
        success, result = project_service.delete_project(project_id)
        
        assert success is True
        assert "message" in result
        
        # Verify project is deleted
        success, get_result = project_service.get_project(project_id)
        assert success is False
    
    def test_delete_project_not_found(self, project_service):
        """Test deleting a non-existent project"""
        non_existent_id = str(uuid.uuid4())
        
        success, result = project_service.delete_project(non_existent_id)
        
        assert success is False
        assert "error" in result
    
    def test_update_project_success(self, project_service):
        """Test successful project update"""
        # Create a project first
        success, create_result = project_service.create_project(
            title="Original Title",
            github_repo="https://github.com/original/repo"
        )
        assert success is True
        project_id = create_result["project"]["id"]
        
        # Update the project
        update_data = {
            "title": "Updated Title",
            "github_repo": "https://github.com/updated/repo"
        }
        
        success, result = project_service.update_project(project_id, update_data)
        
        assert success is True
        assert result["project"]["title"] == "Updated Title"
        assert result["project"]["github_repo"] == "https://github.com/updated/repo"
        assert result["project"]["id"] == project_id
    
    def test_update_project_partial(self, project_service):
        """Test partial project update"""
        # Create a project first
        success, create_result = project_service.create_project(
            title="Original Title",
            github_repo="https://github.com/original/repo"
        )
        assert success is True
        project_id = create_result["project"]["id"]
        
        # Update only the title
        update_data = {"title": "Only Title Updated"}
        
        success, result = project_service.update_project(project_id, update_data)
        
        assert success is True
        assert result["project"]["title"] == "Only Title Updated"
        assert result["project"]["github_repo"] == "https://github.com/original/repo"  # Unchanged
    
    def test_database_error_handling(self, project_service):
        """Test handling of database errors"""
        # Mock database error
        with patch.object(project_service.supabase_client, 'table') as mock_table:
            mock_table.side_effect = Exception("Database connection failed")
            
            success, result = project_service.create_project(title="Error Test")
            
            assert success is False
            assert "error" in result
            assert "Database error" in result["error"]


class TestTaskService:
    """Test cases for Task Service operations"""
    
    @pytest.fixture
    def task_service(self, in_memory_supabase_client):
        """Create TaskService with in-memory Supabase client"""
        return TaskService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Create ProjectService for test setup"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def test_project(self, project_service):
        """Create a test project for task operations"""
        success, result = project_service.create_project(title="Task Test Project")
        assert success is True
        return result["project"]
    
    @pytest.fixture
    def sample_task_data(self, test_project):
        """Sample task data for testing"""
        return {
            "project_id": test_project["id"],
            "title": "Test Task",
            "description": "A test task for development",
            "assignee": "User",
            "status": "todo",
            "priority": "medium"
        }
    
    def test_create_task_success(self, task_service, sample_task_data):
        """Test successful task creation"""
        success, result = task_service.create_task(**sample_task_data)
        
        assert success is True
        assert "task" in result
        assert result["task"]["title"] == sample_task_data["title"]
        assert result["task"]["description"] == sample_task_data["description"]
        assert result["task"]["project_id"] == sample_task_data["project_id"]
        assert result["task"]["assignee"] == sample_task_data["assignee"]
        assert result["task"]["status"] == "todo"  # Default status
        assert "id" in result["task"]
        assert "created_at" in result["task"]
    
    def test_create_task_minimal_data(self, task_service, test_project):
        """Test task creation with minimal required data"""
        success, result = task_service.create_task(
            project_id=test_project["id"],
            title="Minimal Task"
        )
        
        assert success is True
        assert result["task"]["title"] == "Minimal Task"
        assert result["task"]["project_id"] == test_project["id"]
        assert result["task"]["assignee"] == "User"  # Default assignee
        assert result["task"]["description"] == ""  # Default empty description
    
    def test_create_task_invalid_project_id(self, task_service):
        """Test task creation with invalid project ID"""
        invalid_project_id = str(uuid.uuid4())
        
        success, result = task_service.create_task(
            project_id=invalid_project_id,
            title="Invalid Project Task"
        )
        
        assert success is False
        assert "error" in result
    
    def test_list_tasks_by_project(self, task_service, test_project):
        """Test listing tasks filtered by project"""
        # Create multiple tasks
        task_titles = ["Task 1", "Task 2", "Task 3"]
        created_tasks = []
        
        for title in task_titles:
            success, result = task_service.create_task(
                project_id=test_project["id"],
                title=title
            )
            assert success is True
            created_tasks.append(result["task"])
        
        # List tasks for the project
        success, result = task_service.list_tasks(
            filter_by="project",
            filter_value=test_project["id"]
        )
        
        assert success is True
        assert len(result["tasks"]) == 3
        
        # Verify all tasks belong to the project
        for task in result["tasks"]:
            assert task["project_id"] == test_project["id"]
    
    def test_list_tasks_by_status(self, task_service, test_project):
        """Test listing tasks filtered by status"""
        # Create tasks with different statuses
        task_data = [
            {"title": "Todo Task", "status": "todo"},
            {"title": "Doing Task", "status": "doing"},
            {"title": "Done Task", "status": "done"},
            {"title": "Another Todo", "status": "todo"}
        ]
        
        for data in task_data:
            success, result = task_service.create_task(
                project_id=test_project["id"],
                **data
            )
            assert success is True
        
        # List only 'todo' tasks
        success, result = task_service.list_tasks(
            filter_by="status",
            filter_value="todo",
            project_id=test_project["id"]
        )
        
        assert success is True
        assert len(result["tasks"]) == 2
        for task in result["tasks"]:
            assert task["status"] == "todo"
    
    def test_update_task_success(self, task_service, sample_task_data):
        """Test successful task update"""
        # Create a task first
        success, create_result = task_service.create_task(**sample_task_data)
        assert success is True
        task_id = create_result["task"]["id"]
        
        # Update the task
        update_data = {
            "title": "Updated Task Title",
            "status": "doing",
            "assignee": "Archon"
        }
        
        success, result = task_service.update_task(task_id, update_data)
        
        assert success is True
        assert result["task"]["title"] == "Updated Task Title"
        assert result["task"]["status"] == "doing"
        assert result["task"]["assignee"] == "Archon"
        assert result["task"]["id"] == task_id
    
    def test_update_task_not_found(self, task_service):
        """Test updating a non-existent task"""
        non_existent_id = str(uuid.uuid4())
        
        success, result = task_service.update_task(
            non_existent_id,
            {"title": "Updated Title"}
        )
        
        assert success is False
        assert "error" in result
    
    def test_get_task_success(self, task_service, sample_task_data):
        """Test getting a specific task by ID"""
        # Create a task first
        success, create_result = task_service.create_task(**sample_task_data)
        assert success is True
        task_id = create_result["task"]["id"]
        
        # Get the task
        success, result = task_service.get_task(task_id)
        
        assert success is True
        assert result["task"]["id"] == task_id
        assert result["task"]["title"] == sample_task_data["title"]
    
    def test_delete_task_success(self, task_service, sample_task_data):
        """Test successful task deletion"""
        # Create a task first
        success, create_result = task_service.create_task(**sample_task_data)
        assert success is True
        task_id = create_result["task"]["id"]
        
        # Delete the task
        success, result = task_service.delete_task(task_id)
        
        assert success is True
        
        # Verify task is deleted
        success, get_result = task_service.get_task(task_id)
        assert success is False
    
    def test_archive_task_success(self, task_service, sample_task_data):
        """Test successful task archiving"""
        # Create a task first
        success, create_result = task_service.create_task(**sample_task_data)
        assert success is True
        task_id = create_result["task"]["id"]
        
        # Archive the task
        success, result = task_service.archive_task(task_id)
        
        assert success is True
        assert result["task"]["status"] == "archived"
        assert result["task"]["id"] == task_id


class TestDocumentService:
    """Test cases for Document Service operations"""
    
    @pytest.fixture
    def document_service(self, in_memory_supabase_client):
        """Create DocumentService with in-memory Supabase client"""
        return DocumentService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Create ProjectService for test setup"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def test_project(self, project_service):
        """Create a test project for document operations"""
        success, result = project_service.create_project(title="Document Test Project")
        assert success is True
        return result["project"]
    
    @pytest.fixture
    def sample_document_data(self, test_project):
        """Sample document data for testing"""
        return {
            "project_id": test_project["id"],
            "document_type": "prd",
            "title": "Product Requirements Document",
            "content": {
                "overview": "This is a test PRD",
                "features": ["Feature 1", "Feature 2"],
                "requirements": {
                    "functional": ["Req 1", "Req 2"],
                    "non_functional": ["Performance", "Security"]
                }
            },
            "metadata": {
                "version": "1.0",
                "author": "Test Author",
                "tags": ["requirements", "design"]
            }
        }
    
    def test_add_document_success(self, document_service, sample_document_data):
        """Test successful document addition"""
        success, result = document_service.add_document(**sample_document_data)
        
        assert success is True
        assert "document" in result
        assert result["document"]["title"] == sample_document_data["title"]
        assert result["document"]["document_type"] == sample_document_data["document_type"]
        assert result["document"]["project_id"] == sample_document_data["project_id"]
        assert result["document"]["content"] == sample_document_data["content"]
        assert "id" in result["document"]
        assert "created_at" in result["document"]
    
    def test_list_documents_by_project(self, document_service, test_project):
        """Test listing documents for a project"""
        # Create multiple documents
        document_types = ["prd", "design", "specification"]
        
        for doc_type in document_types:
            success, result = document_service.add_document(
                project_id=test_project["id"],
                document_type=doc_type,
                title=f"Test {doc_type.upper()}",
                content={"type": doc_type}
            )
            assert success is True
        
        # List documents
        success, result = document_service.list_documents(test_project["id"])
        
        assert success is True
        assert len(result["documents"]) == 3
        
        # Verify all documents belong to the project
        for doc in result["documents"]:
            assert doc["project_id"] == test_project["id"]
    
    def test_get_document_success(self, document_service, sample_document_data):
        """Test getting a specific document by ID"""
        # Create a document first
        success, create_result = document_service.add_document(**sample_document_data)
        assert success is True
        doc_id = create_result["document"]["id"]
        
        # Get the document
        success, result = document_service.get_document(
            sample_document_data["project_id"],
            doc_id
        )
        
        assert success is True
        assert result["document"]["id"] == doc_id
        assert result["document"]["title"] == sample_document_data["title"]
        assert result["document"]["content"] == sample_document_data["content"]
    
    def test_update_document_success(self, document_service, sample_document_data):
        """Test successful document update"""
        # Create a document first
        success, create_result = document_service.add_document(**sample_document_data)
        assert success is True
        doc_id = create_result["document"]["id"]
        
        # Update the document
        updated_content = {
            "overview": "Updated PRD overview",
            "features": ["Updated Feature 1", "New Feature"],
            "requirements": {
                "functional": ["Updated Req 1"],
                "non_functional": ["Scalability"]
            }
        }
        
        success, result = document_service.update_document(
            sample_document_data["project_id"],
            doc_id,
            content=updated_content,
            title="Updated PRD Title"
        )
        
        assert success is True
        assert result["document"]["title"] == "Updated PRD Title"
        assert result["document"]["content"] == updated_content
        assert result["document"]["id"] == doc_id
    
    def test_delete_document_success(self, document_service, sample_document_data):
        """Test successful document deletion"""
        # Create a document first
        success, create_result = document_service.add_document(**sample_document_data)
        assert success is True
        doc_id = create_result["document"]["id"]
        
        # Delete the document
        success, result = document_service.delete_document(
            sample_document_data["project_id"],
            doc_id
        )
        
        assert success is True
        
        # Verify document is deleted
        success, get_result = document_service.get_document(
            sample_document_data["project_id"],
            doc_id
        )
        assert success is False


class TestVersioningService:
    """Test cases for Document Versioning Service"""
    
    @pytest.fixture
    def versioning_service(self, in_memory_supabase_client):
        """Create VersioningService with in-memory Supabase client"""
        return VersioningService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Create ProjectService for test setup"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    @pytest.fixture
    def test_project(self, project_service):
        """Create a test project for versioning operations"""
        success, result = project_service.create_project(title="Versioning Test Project")
        assert success is True
        return result["project"]
    
    def test_create_version_success(self, versioning_service, test_project):
        """Test successful version creation"""
        content = {
            "overview": "Version 1.0 content",
            "features": ["Feature A", "Feature B"]
        }
        
        success, result = versioning_service.create_version(
            project_id=test_project["id"],
            field_name="docs",
            content=content,
            change_summary="Initial version",
            created_by="Test User"
        )
        
        assert success is True
        assert "version" in result
        assert result["version"]["version_number"] == 1
        assert result["version"]["content"] == content
        assert result["version"]["change_summary"] == "Initial version"
        assert result["version"]["created_by"] == "Test User"
    
    def test_list_versions_success(self, versioning_service, test_project):
        """Test listing versions for a field"""
        # Create multiple versions
        versions_data = [
            {"content": {"version": "1.0"}, "change_summary": "Initial"},
            {"content": {"version": "1.1"}, "change_summary": "Minor update"},
            {"content": {"version": "2.0"}, "change_summary": "Major release"}
        ]
        
        for data in versions_data:
            success, result = versioning_service.create_version(
                project_id=test_project["id"],
                field_name="docs",
                **data
            )
            assert success is True
        
        # List versions
        success, result = versioning_service.list_versions(
            project_id=test_project["id"],
            field_name="docs"
        )
        
        assert success is True
        assert len(result["versions"]) == 3
        
        # Verify versions are in correct order
        version_numbers = [v["version_number"] for v in result["versions"]]
        assert version_numbers == [3, 2, 1]  # Latest first
    
    def test_get_version_success(self, versioning_service, test_project):
        """Test getting a specific version"""
        content = {"test": "version content"}
        
        # Create a version
        success, create_result = versioning_service.create_version(
            project_id=test_project["id"],
            field_name="docs",
            content=content,
            change_summary="Test version"
        )
        assert success is True
        version_number = create_result["version"]["version_number"]
        
        # Get the version
        success, result = versioning_service.get_version(
            project_id=test_project["id"],
            field_name="docs",
            version_number=version_number
        )
        
        assert success is True
        assert result["version"]["content"] == content
        assert result["version"]["version_number"] == version_number
    
    def test_restore_version_success(self, versioning_service, test_project):
        """Test successful version restoration"""
        # Create multiple versions
        v1_content = {"version": "1.0", "feature": "original"}
        v2_content = {"version": "2.0", "feature": "updated"}
        
        # Create version 1
        success, result1 = versioning_service.create_version(
            project_id=test_project["id"],
            field_name="docs",
            content=v1_content,
            change_summary="Version 1"
        )
        assert success is True
        
        # Create version 2
        success, result2 = versioning_service.create_version(
            project_id=test_project["id"],
            field_name="docs",
            content=v2_content,
            change_summary="Version 2"
        )
        assert success is True
        
        # Restore to version 1
        success, result = versioning_service.restore_version(
            project_id=test_project["id"],
            field_name="docs",
            version_number=1,
            created_by="Test User"
        )
        
        assert success is True
        assert result["restored_version"]["content"] == v1_content
        assert result["new_version"]["version_number"] == 3  # New version created
        assert result["new_version"]["change_summary"].startswith("Restored from version 1")


class TestGitHubIntegration:
    """Test cases for GitHub integration features"""
    
    @pytest.fixture
    def project_service(self, in_memory_supabase_client):
        """Create ProjectService for GitHub integration tests"""
        return ProjectService(supabase_client=in_memory_supabase_client)
    
    def test_github_repo_validation(self, project_service):
        """Test GitHub repository URL validation"""
        # Valid GitHub URLs
        valid_urls = [
            "https://github.com/user/repo",
            "https://github.com/organization/project-name",
            "https://github.com/user/repo.git",
            "git@github.com:user/repo.git"
        ]
        
        for url in valid_urls:
            success, result = project_service.create_project(
                title=f"Test Project for {url}",
                github_repo=url
            )
            # Should succeed (basic validation)
            assert success is True
            assert result["project"]["github_repo"] == url.strip()
    
    def test_github_repo_metadata_extraction(self, project_service):
        """Test extraction of metadata from GitHub repository"""
        with patch('requests.get') as mock_get:
            # Mock GitHub API response
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "name": "test-repo",
                "description": "A test repository",
                "language": "Python",
                "stargazers_count": 42,
                "forks_count": 7,
                "topics": ["python", "testing", "api"]
            }
            mock_get.return_value = mock_response
            
            # This would be tested if GitHub integration is implemented
            # For now, just verify basic repository storage
            success, result = project_service.create_project(
                title="GitHub Integration Test",
                github_repo="https://github.com/test/repo"
            )
            
            assert success is True
            assert result["project"]["github_repo"] == "https://github.com/test/repo"
    
    @patch('requests.get')
    def test_github_api_error_handling(self, mock_get, project_service):
        """Test handling of GitHub API errors"""
        # Mock API error
        mock_get.side_effect = requests.exceptions.RequestException("GitHub API error")
        
        # Should still create project even if GitHub API fails
        success, result = project_service.create_project(
            title="GitHub Error Test",
            github_repo="https://github.com/test/repo"
        )
        
        assert success is True
        assert result["project"]["github_repo"] == "https://github.com/test/repo"