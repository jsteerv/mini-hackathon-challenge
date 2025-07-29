"""
Comprehensive mocks for external services used in Archon

This module provides mock implementations for:
- OpenAI API (embeddings, completions)
- GitHub API (repository information, file content)
- Crawl4AI (web crawling)
- Other external services

These mocks ensure tests run consistently without external dependencies.
"""

import json
import time
import uuid
from typing import List, Dict, Any, Optional, Union
from unittest.mock import Mock
from datetime import datetime, timezone


class MockOpenAIClient:
    """Mock OpenAI client for testing"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or "test-api-key"
        self.embeddings = MockEmbeddings()
        self.chat = MockChat()
        self.completions = MockCompletions()
    
    def _validate_api_key(self):
        """Simulate API key validation"""
        if self.api_key == "invalid-key":
            raise Exception("Invalid API key")
        return True


class MockEmbeddings:
    """Mock OpenAI embeddings API"""
    
    def __init__(self):
        self.call_count = 0
        self.total_tokens = 0
    
    def create(self, input: Union[str, List[str]], model: str = "text-embedding-ada-002", **kwargs):
        """Mock embedding creation"""
        self.call_count += 1
        
        # Handle different input types
        if isinstance(input, str):
            texts = [input]
        else:
            texts = input
        
        # Simulate token counting
        tokens_per_text = [len(text.split()) * 1.3 for text in texts]  # Rough approximation
        self.total_tokens += sum(tokens_per_text)
        
        # Generate mock embeddings
        embeddings = []
        for i, text in enumerate(texts):
            # Create deterministic embedding based on text hash
            text_hash = hash(text) % 1000
            embedding = [(text_hash + j) / 1000.0 for j in range(1536)]  # 1536 dimensions
            embeddings.append(embedding)
        
        # Simulate API response structure
        return Mock(
            data=[
                Mock(embedding=emb, index=i) 
                for i, emb in enumerate(embeddings)
            ],
            usage=Mock(
                prompt_tokens=sum(tokens_per_text),
                total_tokens=sum(tokens_per_text)
            ),
            model=model
        )
    
    async def acreate(self, input: Union[str, List[str]], model: str = "text-embedding-ada-002", **kwargs):
        """Mock async embedding creation"""
        return self.create(input, model, **kwargs)


class MockChat:
    """Mock OpenAI chat completions API"""
    
    def __init__(self):
        self.call_count = 0
        self.conversations = []
    
    def completions_create(self, messages: List[Dict], model: str = "gpt-3.5-turbo", **kwargs):
        """Mock chat completion"""
        self.call_count += 1
        self.conversations.append(messages)
        
        # Generate mock response based on last message
        last_message = messages[-1]["content"] if messages else "Hello!"
        
        # Simple mock responses based on content
        if "error" in last_message.lower():
            mock_response = "I understand there's an error. Let me help you troubleshoot."
        elif "code" in last_message.lower():
            mock_response = "Here's a code example:\n\n```python\ndef example():\n    return 'Hello, World!'\n```"
        elif "explain" in last_message.lower():
            mock_response = "Let me explain this concept in detail..."
        else:
            mock_response = f"I understand your message: '{last_message[:50]}...'"
        
        return Mock(
            choices=[
                Mock(
                    message=Mock(
                        content=mock_response,
                        role="assistant"
                    ),
                    finish_reason="stop",
                    index=0
                )
            ],
            usage=Mock(
                prompt_tokens=len(str(messages).split()),
                completion_tokens=len(mock_response.split()),
                total_tokens=len(str(messages).split()) + len(mock_response.split())
            ),
            model=model
        )


class MockCompletions:
    """Mock OpenAI completions API (legacy)"""
    
    def create(self, prompt: str, model: str = "text-davinci-003", **kwargs):
        """Mock text completion"""
        # Simple mock completion
        completion_text = f"This is a mock completion for: {prompt[:30]}..."
        
        return Mock(
            choices=[
                Mock(
                    text=completion_text,
                    index=0,
                    finish_reason="stop"
                )
            ],
            usage=Mock(
                prompt_tokens=len(prompt.split()),
                completion_tokens=len(completion_text.split()),
                total_tokens=len(prompt.split()) + len(completion_text.split())
            ),
            model=model
        )


class MockGitHubAPI:
    """Mock GitHub API for testing"""
    
    def __init__(self):
        self.repositories = {}
        self.rate_limit_remaining = 5000
        self.rate_limit_reset = int(time.time()) + 3600
    
    def get_repository_info(self, owner: str, repo: str) -> Dict[str, Any]:
        """Mock repository information"""
        repo_key = f"{owner}/{repo}"
        
        if repo_key not in self.repositories:
            # Create mock repository data
            self.repositories[repo_key] = {
                "id": hash(repo_key) % 100000,
                "name": repo,
                "full_name": repo_key,
                "owner": {
                    "login": owner,
                    "id": hash(owner) % 10000,
                    "type": "User"
                },
                "description": f"Mock repository for {repo_key}",
                "private": False,
                "html_url": f"https://github.com/{repo_key}",
                "clone_url": f"https://github.com/{repo_key}.git",
                "ssh_url": f"git@github.com:{repo_key}.git",
                "language": "Python",
                "stargazers_count": hash(repo_key) % 1000,
                "watchers_count": hash(repo_key) % 500,
                "forks_count": hash(repo_key) % 100,
                "open_issues_count": hash(repo_key) % 50,
                "default_branch": "main",
                "topics": ["python", "api", "mock"],
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "pushed_at": datetime.now(timezone.utc).isoformat(),
                "size": hash(repo_key) % 10000,
                "license": {
                    "key": "mit",
                    "name": "MIT License"
                }
            }
        
        return self.repositories[repo_key]
    
    def get_file_content(self, owner: str, repo: str, path: str, ref: str = "main") -> Dict[str, Any]:
        """Mock file content retrieval"""
        # Generate mock file content based on path
        if path.endswith(".py"):
            content = f'"""Mock Python file: {path}"""\n\ndef main():\n    print("Hello from {path}")\n\nif __name__ == "__main__":\n    main()\n'
        elif path.endswith(".md"):
            content = f"# {path}\n\nThis is a mock markdown file.\n\n## Features\n\n- Feature 1\n- Feature 2\n"
        elif path.endswith(".json"):
            content = json.dumps({"name": path, "type": "mock", "version": "1.0.0"}, indent=2)
        else:
            content = f"Mock content for {path}"
        
        import base64
        encoded_content = base64.b64encode(content.encode()).decode()
        
        return {
            "name": path.split("/")[-1],
            "path": path,
            "sha": f"mock-sha-{hash(path) % 1000000}",
            "size": len(content),
            "url": f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
            "html_url": f"https://github.com/{owner}/{repo}/blob/{ref}/{path}",
            "git_url": f"https://api.github.com/repos/{owner}/{repo}/git/blobs/mock-sha-{hash(path) % 1000000}",
            "download_url": f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}",
            "type": "file",
            "content": encoded_content,
            "encoding": "base64"
        }
    
    def list_repository_contents(self, owner: str, repo: str, path: str = "", ref: str = "main") -> List[Dict[str, Any]]:
        """Mock repository contents listing"""
        # Generate mock directory structure
        base_files = [
            {"name": "README.md", "type": "file"},
            {"name": "requirements.txt", "type": "file"},
            {"name": "setup.py", "type": "file"},
            {"name": "src", "type": "dir"},
            {"name": "tests", "type": "dir"},
            {"name": "docs", "type": "dir"}
        ]
        
        if path == "src":
            base_files = [
                {"name": "__init__.py", "type": "file"},
                {"name": "main.py", "type": "file"},
                {"name": "utils.py", "type": "file"},
                {"name": "models", "type": "dir"}
            ]
        elif path == "tests":
            base_files = [
                {"name": "__init__.py", "type": "file"},
                {"name": "test_main.py", "type": "file"},
                {"name": "test_utils.py", "type": "file"}
            ]
        
        contents = []
        for item in base_files:
            item_path = f"{path}/{item['name']}" if path else item['name']
            contents.append({
                "name": item["name"],
                "path": item_path,
                "sha": f"mock-sha-{hash(item_path) % 1000000}",
                "size": 1024 if item["type"] == "file" else 0,
                "url": f"https://api.github.com/repos/{owner}/{repo}/contents/{item_path}",
                "html_url": f"https://github.com/{owner}/{repo}/{'blob' if item['type'] == 'file' else 'tree'}/{ref}/{item_path}",
                "git_url": f"https://api.github.com/repos/{owner}/{repo}/git/{'blobs' if item['type'] == 'file' else 'trees'}/mock-sha-{hash(item_path) % 1000000}",
                "download_url": f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{item_path}" if item["type"] == "file" else None,
                "type": item["type"]
            })
        
        return contents
    
    def search_repositories(self, query: str, sort: str = "stars", order: str = "desc") -> Dict[str, Any]:
        """Mock repository search"""
        # Generate mock search results
        mock_repos = []
        for i in range(5):  # Return 5 mock results
            repo_name = f"mock-repo-{i}"
            owner_name = f"mock-user-{i}"
            mock_repos.append(self.get_repository_info(owner_name, repo_name))
        
        return {
            "total_count": len(mock_repos),
            "incomplete_results": False,
            "items": mock_repos
        }
    
    def get_rate_limit(self) -> Dict[str, Any]:
        """Mock rate limit information"""
        return {
            "rate": {
                "limit": 5000,
                "remaining": self.rate_limit_remaining,
                "reset": self.rate_limit_reset,
                "used": 5000 - self.rate_limit_remaining
            }
        }


class MockCrawl4AI:
    """Mock Crawl4AI web crawler for testing"""
    
    def __init__(self):
        self.crawl_count = 0
        self.failed_urls = set()
        self.success_rate = 0.9  # 90% success rate by default
    
    async def arun(self, url: str, **kwargs) -> Mock:
        """Mock async crawl operation"""
        self.crawl_count += 1
        
        # Simulate occasional failures
        should_fail = (
            url in self.failed_urls or 
            hash(url) % 10 >= (self.success_rate * 10)
        )
        
        if should_fail:
            return Mock(
                success=False,
                url=url,
                error_message=f"Failed to crawl {url}: Connection timeout",
                status_code=404,
                markdown=None,
                html=None,
                metadata={},
                links=[]
            )
        
        # Generate mock successful result
        domain = url.split("//")[1].split("/")[0] if "//" in url else "example.com"
        page_title = f"Mock Page - {domain}"
        
        # Generate mock content based on URL
        if "api" in url.lower():
            content_type = "API Documentation"
            markdown_content = f"""# {page_title}

## API Reference

### Authentication
Use API key in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://{domain}/api/endpoint
```

### Endpoints

#### GET /users
Returns a list of users.

```json
{{
    "users": [
        {{"id": 1, "name": "John Doe", "email": "john@example.com"}}
    ]
}}
```

#### POST /users
Creates a new user.

```json
{{
    "name": "Jane Doe",
    "email": "jane@example.com"
}}
```
"""
        elif "docs" in url.lower() or "documentation" in url.lower():
            content_type = "Documentation"
            markdown_content = f"""# {page_title}

## Getting Started

Welcome to the documentation for {domain}.

### Installation

```bash
pip install {domain.replace('.', '-')}-sdk
```

### Quick Start

```python
from {domain.replace('.', '_')} import Client

client = Client(api_key="your-key")
result = client.get_data()
print(result)
```

### Configuration

Set up your configuration:

```yaml
api:
  endpoint: https://{domain}/api
  timeout: 30
  retries: 3
```
"""
        elif "tutorial" in url.lower() or "guide" in url.lower():
            content_type = "Tutorial"
            markdown_content = f"""# {page_title}

## Step-by-Step Tutorial

### Step 1: Setup
First, set up your environment:

```bash
npm install @{domain}/toolkit
```

### Step 2: Initialize
Create your first project:

```javascript
const toolkit = require('@{domain}/toolkit');

const project = toolkit.createProject({{
    name: 'my-project',
    version: '1.0.0'
}});
```

### Step 3: Deploy
Deploy your project:

```bash
{domain}-cli deploy --project my-project
```
"""
        else:
            content_type = "General Content"
            markdown_content = f"""# {page_title}

This is mock content for {url}.

## Features

- Feature 1: High performance
- Feature 2: Easy to use
- Feature 3: Scalable architecture

## Code Example

```python
def hello_world():
    return "Hello from {domain}!"

if __name__ == "__main__":
    print(hello_world())
```

## Learn More

Visit our [documentation](https://{domain}/docs) for more information.
"""
        
        # Generate HTML version
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{page_title}</title>
</head>
<body>
    <h1>{page_title}</h1>
    <div class="content-type">{content_type}</div>
    <div class="content">
        {markdown_content.replace('```', '<pre><code>').replace('\n', '<br>')}
    </div>
</body>
</html>"""
        
        # Extract links from content
        mock_links = [
            f"https://{domain}/docs",
            f"https://{domain}/api",
            f"https://{domain}/support",
            f"https://{domain}/about"
        ]
        
        return Mock(
            success=True,
            url=url,
            status_code=200,
            markdown=markdown_content,
            html=html_content,
            metadata={
                "title": page_title,
                "description": f"Mock page for {domain}",
                "url": url,
                "content_type": content_type,
                "language": "en",
                "author": f"{domain} Team",
                "published_date": datetime.now().isoformat(),
                "word_count": len(markdown_content.split()),
                "reading_time": len(markdown_content.split()) // 200  # Rough estimate
            },
            links=mock_links,
            error_message=None
        )
    
    def set_failure_rate(self, rate: float):
        """Set the failure rate for mock crawling (0.0 = no failures, 1.0 = all failures)"""
        self.success_rate = 1.0 - rate
    
    def add_failed_url(self, url: str):
        """Mark a specific URL as always failing"""
        self.failed_urls.add(url)
    
    def remove_failed_url(self, url: str):
        """Remove a URL from the failed URLs set"""
        self.failed_urls.discard(url)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get crawling statistics"""
        return {
            "total_crawls": self.crawl_count,
            "failed_urls_count": len(self.failed_urls),
            "success_rate": self.success_rate
        }


class MockRequestsSession:
    """Mock requests session for HTTP calls"""
    
    def __init__(self):
        self.call_history = []
        self.response_overrides = {}
    
    def get(self, url: str, **kwargs) -> Mock:
        """Mock GET request"""
        self.call_history.append({"method": "GET", "url": url, "kwargs": kwargs})
        
        # Check for response overrides
        if url in self.response_overrides:
            return self.response_overrides[url]
        
        # Generate mock response based on URL
        if "github.com" in url or "api.github.com" in url:
            return self._mock_github_response(url)
        elif "sitemap.xml" in url:
            return self._mock_sitemap_response(url)
        else:
            return self._mock_generic_response(url)
    
    def post(self, url: str, **kwargs) -> Mock:
        """Mock POST request"""
        self.call_history.append({"method": "POST", "url": url, "kwargs": kwargs})
        
        response = Mock()
        response.status_code = 201
        response.json.return_value = {"success": True, "id": str(uuid.uuid4())}
        response.text = json.dumps(response.json.return_value)
        return response
    
    def _mock_github_response(self, url: str) -> Mock:
        """Generate mock GitHub API response"""
        response = Mock()
        response.status_code = 200
        
        if "repos/" in url:
            github_api = MockGitHubAPI()
            # Extract owner/repo from URL
            parts = url.split("/")
            if len(parts) >= 6:
                owner = parts[4]
                repo = parts[5]
                response.json.return_value = github_api.get_repository_info(owner, repo)
        else:
            response.json.return_value = {"message": "Mock GitHub response"}
        
        response.text = json.dumps(response.json.return_value)
        return response
    
    def _mock_sitemap_response(self, url: str) -> Mock:
        """Generate mock sitemap XML response"""
        domain = url.split("//")[1].split("/")[0] if "//" in url else "example.com"
        
        sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://{domain}/</loc>
        <lastmod>2024-01-01</lastmod>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://{domain}/docs</loc>
        <lastmod>2024-01-01</lastmod>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://{domain}/api</loc>
        <lastmod>2024-01-01</lastmod>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://{domain}/tutorial</loc>
        <lastmod>2024-01-01</lastmod>
        <priority>0.6</priority>
    </url>
</urlset>"""
        
        response = Mock()
        response.status_code = 200
        response.content = sitemap_xml.encode('utf-8')
        response.text = sitemap_xml
        return response
    
    def _mock_generic_response(self, url: str) -> Mock:
        """Generate mock generic HTTP response"""
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"url": url, "status": "ok", "timestamp": time.time()}
        response.text = json.dumps(response.json.return_value)
        response.content = response.text.encode('utf-8')
        return response
    
    def set_response_override(self, url: str, response: Mock):
        """Set a custom response for a specific URL"""
        self.response_overrides[url] = response
    
    def get_call_history(self) -> List[Dict[str, Any]]:
        """Get history of all HTTP calls made"""
        return self.call_history.copy()


def create_mock_openai_client() -> MockOpenAIClient:
    """Factory function to create mock OpenAI client"""
    return MockOpenAIClient()


def create_mock_github_api() -> MockGitHubAPI:
    """Factory function to create mock GitHub API"""
    return MockGitHubAPI()


def create_mock_crawler() -> MockCrawl4AI:
    """Factory function to create mock Crawl4AI crawler"""
    return MockCrawl4AI()


def create_mock_requests_session() -> MockRequestsSession:
    """Factory function to create mock requests session"""
    return MockRequestsSession()


# Pytest fixtures for easy use in tests
def pytest_configure():
    """Configure pytest with mock fixtures"""
    import pytest
    
    @pytest.fixture
    def mock_openai_client():
        return create_mock_openai_client()
    
    @pytest.fixture
    def mock_github_api():
        return create_mock_github_api()
    
    @pytest.fixture
    def mock_crawler():
        return create_mock_crawler()
    
    @pytest.fixture
    def mock_requests_session():
        return create_mock_requests_session()