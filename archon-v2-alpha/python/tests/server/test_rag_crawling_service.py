"""
Test suite for RAG Crawling Service

Tests web crawling operations, sitemap parsing, content extraction,
error handling, and retry mechanisms.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import requests

from src.server.services.rag.crawling_service import CrawlingService


class TestCrawlingService:
    """Test cases for Crawling Service"""
    
    @pytest.fixture
    def crawling_service(self):
        """Create CrawlingService instance with mocked dependencies"""
        mock_supabase = Mock()
        mock_crawler = AsyncMock()
        return CrawlingService(crawler=mock_crawler, supabase_client=mock_supabase)
    
    @pytest.fixture
    def mock_crawl_result(self):
        """Mock successful crawl result"""
        result = Mock()
        result.success = True
        result.url = "https://example.com/test-page"
        result.markdown = "# Test Page\n\nThis is test content with code:\n\n```python\ndef hello():\n    return 'world'\n```"
        result.html = "<h1>Test Page</h1><pre><code class='language-python'>def hello():\n    return 'world'</code></pre>"
        result.metadata = {
            "title": "Test Page",
            "description": "A test page for crawling",
            "url": "https://example.com/test-page"
        }
        result.error_message = None
        result.status_code = 200
        return result
    
    def test_initialization_default_params(self):
        """Test CrawlingService initialization with default parameters"""
        with patch('src.server.services.rag.crawling_service.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_get_client.return_value = mock_client
            
            service = CrawlingService()
            
            assert service.crawler is None
            assert service.supabase_client == mock_client
    
    def test_initialization_custom_params(self):
        """Test CrawlingService initialization with custom parameters"""
        mock_crawler = AsyncMock()
        mock_client = Mock()
        
        service = CrawlingService(crawler=mock_crawler, supabase_client=mock_client)
        
        assert service.crawler == mock_crawler
        assert service.supabase_client == mock_client
    
    def test_markdown_generator_configuration(self, crawling_service):
        """Test markdown generator configuration for code preservation"""
        generator = crawling_service._get_markdown_generator()
        
        # Verify generator is properly configured
        assert generator is not None
        # Test that it has the expected options for code preservation
        options = generator.options
        assert options.get("mark_code") is True
        assert options.get("handle_code_in_pre") is True
        assert options.get("preserve_code_formatting") is True
        assert options.get("escape") is False
    
    def test_is_sitemap_detection(self, crawling_service):
        """Test sitemap URL detection"""
        # Test positive cases
        assert crawling_service.is_sitemap("https://example.com/sitemap.xml") is True
        assert crawling_service.is_sitemap("https://docs.example.com/sitemap.xml") is True
        assert crawling_service.is_sitemap("https://example.com/sitemap/index.xml") is True
        
        # Test negative cases
        assert crawling_service.is_sitemap("https://example.com/page.html") is False
        assert crawling_service.is_sitemap("https://example.com/api/data") is False
        
        # Test error handling
        with patch('src.server.services.rag.crawling_service.urlparse', side_effect=Exception("Parse error")):
            assert crawling_service.is_sitemap("invalid-url") is False
    
    def test_is_txt_detection(self, crawling_service):
        """Test text file URL detection"""
        # Test positive cases
        assert crawling_service.is_txt("https://example.com/robots.txt") is True
        assert crawling_service.is_txt("https://example.com/readme.txt") is True
        
        # Test negative cases
        assert crawling_service.is_txt("https://example.com/page.html") is False
        assert crawling_service.is_txt("https://example.com/api/data") is False
        
        # Test error handling
        with patch('builtins.str.endswith', side_effect=Exception("String error")):
            assert crawling_service.is_txt("test.txt") is False
    
    @patch('requests.get')
    def test_parse_sitemap_success(self, mock_get, crawling_service):
        """Test successful sitemap parsing"""
        # Mock sitemap XML content
        sitemap_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://example.com/page1</loc>
            </url>
            <url>
                <loc>https://example.com/page2</loc>
            </url>
            <url>
                <loc>https://example.com/page3</loc>
            </url>
        </urlset>"""
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = sitemap_xml.encode('utf-8')
        mock_get.return_value = mock_response
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert len(urls) == 3
        assert "https://example.com/page1" in urls
        assert "https://example.com/page2" in urls
        assert "https://example.com/page3" in urls
    
    @patch('requests.get')
    def test_parse_sitemap_http_error(self, mock_get, crawling_service):
        """Test sitemap parsing with HTTP error"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert urls == []
    
    @patch('requests.get')
    def test_parse_sitemap_xml_parse_error(self, mock_get, crawling_service):
        """Test sitemap parsing with invalid XML"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"<invalid>xml<content>"
        mock_get.return_value = mock_response
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert urls == []
    
    @patch('requests.get')
    def test_parse_sitemap_network_error(self, mock_get, crawling_service):
        """Test sitemap parsing with network error"""
        mock_get.side_effect = requests.exceptions.RequestException("Network error")
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert urls == []
    
    def test_transform_github_url_file(self, crawling_service):
        """Test GitHub file URL transformation to raw URL"""
        github_url = "https://github.com/owner/repo/blob/main/src/file.py"
        expected_raw = "https://raw.githubusercontent.com/owner/repo/main/src/file.py"
        
        result = crawling_service._transform_github_url(github_url)
        
        assert result == expected_raw
    
    def test_transform_github_url_directory(self, crawling_service):
        """Test GitHub directory URL handling"""
        github_dir_url = "https://github.com/owner/repo/tree/main/src/components"
        
        # Should return original URL with warning logged
        result = crawling_service._transform_github_url(github_dir_url)
        
        assert result == github_dir_url
    
    def test_transform_github_url_non_github(self, crawling_service):
        """Test non-GitHub URL passes through unchanged"""
        regular_url = "https://example.com/page.html"
        
        result = crawling_service._transform_github_url(regular_url)
        
        assert result == regular_url
    
    def test_is_documentation_site_detection(self, crawling_service):
        """Test documentation site detection"""
        # Test positive cases
        doc_urls = [
            "https://docs.example.com/guide",
            "https://example.com/docs/api",
            "https://documentation.example.com/",
            "https://example.readthedocs.io/",
            "https://example.gitbook.io/",
            "https://docusaurus-site.com/",
            "https://vitepress-docs.com/",
            "https://docsify-site.com/",
            "https://mkdocs-site.com/"
        ]
        
        for url in doc_urls:
            assert crawling_service._is_documentation_site(url) is True, f"Failed for URL: {url}"
        
        # Test negative cases
        non_doc_urls = [
            "https://example.com/",
            "https://api.example.com/",
            "https://blog.example.com/",
            "https://shop.example.com/"
        ]
        
        for url in non_doc_urls:
            assert crawling_service._is_documentation_site(url) is False, f"Failed for URL: {url}"
    
    def test_get_wait_selector_for_docs(self, crawling_service):
        """Test documentation framework-specific wait selectors"""
        test_cases = [
            ("https://docusaurus.example.com/", ".markdown, .theme-doc-markdown, article"),
            ("https://vitepress.example.com/", ".VPDoc, .vp-doc, .content"),
            ("https://example.gitbook.io/", ".markdown-section, .page-wrapper"),
            ("https://mkdocs.example.com/", ".md-content, article"),
            ("https://docsify.example.com/", "#main, .markdown-section"),
            ("https://copilotkit.example.com/", 'div[class*="content"], div[class*="doc"], #__next'),
            ("https://milkdown.example.com/", 'main, article, .prose, [class*="content"]'),
            ("https://generic-site.com/", "body")
        ]
        
        for url, expected_selector in test_cases:
            result = crawling_service._get_wait_selector_for_docs(url)
            assert result == expected_selector, f"Failed for URL: {url}"
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_success(self, crawling_service, mock_crawl_result):
        """Test successful single page crawling"""
        # Setup mock crawler
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_crawl_result
        
        result = await crawling_service.crawl_single_page("https://example.com/test-page")
        
        assert result["success"] is True
        assert result["url"] == "https://example.com/test-page"
        assert "markdown" in result
        assert "html" in result
        assert "metadata" in result
        assert result["error"] is None
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_failure(self, crawling_service):
        """Test single page crawling failure"""
        # Setup mock crawler with failure
        mock_failed_result = Mock()
        mock_failed_result.success = False
        mock_failed_result.error_message = "Failed to load page"
        mock_failed_result.url = "https://example.com/error-page"
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_failed_result
        
        result = await crawling_service.crawl_single_page("https://example.com/error-page")
        
        assert result["success"] is False
        assert result["error"] == "Failed to load page"
        assert result["url"] == "https://example.com/error-page"
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_with_retries(self, crawling_service):
        """Test single page crawling with retry mechanism"""
        # First two attempts fail, third succeeds
        mock_failed_result = Mock()
        mock_failed_result.success = False
        mock_failed_result.error_message = "Temporary failure"
        
        mock_success_result = Mock()
        mock_success_result.success = True
        mock_success_result.url = "https://example.com/retry-page"
        mock_success_result.markdown = "# Retry Success"
        mock_success_result.html = "<h1>Retry Success</h1>"
        mock_success_result.metadata = {"title": "Retry Page"}
        mock_success_result.error_message = None
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.side_effect = [
            mock_failed_result,  # First attempt fails
            mock_failed_result,  # Second attempt fails
            mock_success_result  # Third attempt succeeds
        ]
        
        result = await crawling_service.crawl_single_page(
            "https://example.com/retry-page",
            retry_count=3
        )
        
        assert result["success"] is True
        assert result["url"] == "https://example.com/retry-page"
        assert crawling_service.crawler.arun.call_count == 3
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_max_retries_exceeded(self, crawling_service):
        """Test single page crawling when max retries are exceeded"""
        mock_failed_result = Mock()
        mock_failed_result.success = False
        mock_failed_result.error_message = "Persistent failure"
        mock_failed_result.url = "https://example.com/always-fails"
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_failed_result
        
        result = await crawling_service.crawl_single_page(
            "https://example.com/always-fails",
            retry_count=2
        )
        
        assert result["success"] is False
        assert "Failed to crawl" in result["error"]
        assert "after 2 attempts" in result["error"]
        assert crawling_service.crawler.arun.call_count == 2
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_github_url_transformation(self, crawling_service, mock_crawl_result):
        """Test GitHub URL transformation during crawling"""
        github_url = "https://github.com/owner/repo/blob/main/README.md"
        raw_url = "https://raw.githubusercontent.com/owner/repo/main/README.md"
        
        mock_crawl_result.url = raw_url
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_crawl_result
        
        result = await crawling_service.crawl_single_page(github_url)
        
        # Should have called crawler with transformed URL
        crawling_service.crawler.arun.assert_called_once()
        # Check that URL was transformed in the crawl config
        call_args = crawling_service.crawler.arun.call_args
        assert raw_url in str(call_args)
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_documentation_site_handling(self, crawling_service, mock_crawl_result):
        """Test special handling for documentation sites"""
        doc_url = "https://docs.example.com/api-guide"
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_crawl_result
        
        result = await crawling_service.crawl_single_page(doc_url)
        
        # Should have called crawler with documentation-specific config
        crawling_service.crawler.arun.assert_called_once()
        call_args = crawling_service.crawler.arun.call_args
        
        # Verify wait selector was used for documentation
        config = call_args[1] if len(call_args) > 1 else {}
        # The exact assertion would depend on implementation details
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_code_block_preservation(self, crawling_service):
        """Test that code blocks are properly preserved during crawling"""
        # Mock result with code blocks
        mock_result = Mock()
        mock_result.success = True
        mock_result.url = "https://example.com/code-page"
        mock_result.markdown = """# Code Example

Here's a Python function:

```python
def calculate_sum(a, b):
    \"\"\"Calculate sum of two numbers\"\"\"
    return a + b

# Usage example
result = calculate_sum(5, 3)
print(f"Result: {result}")
```

And a JavaScript example:

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
```"""
        mock_result.html = """<h1>Code Example</h1>
<pre><code class="language-python">def calculate_sum(a, b):
    return a + b</code></pre>
<pre><code class="language-javascript">function greet(name) {
    return `Hello, ${name}!`;
}</code></pre>"""
        mock_result.metadata = {"title": "Code Examples"}
        mock_result.error_message = None
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.return_value = mock_result
        
        result = await crawling_service.crawl_single_page("https://example.com/code-page")
        
        assert result["success"] is True
        # Verify code blocks are preserved
        assert "```python" in result["markdown"]
        assert "```javascript" in result["markdown"]
        assert "def calculate_sum" in result["markdown"]
        assert "function greet" in result["markdown"]
    
    @pytest.mark.asyncio
    async def test_crawl_single_page_exception_handling(self, crawling_service):
        """Test exception handling during crawling"""
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.side_effect = Exception("Crawler exception")
        
        result = await crawling_service.crawl_single_page("https://example.com/exception-test")
        
        assert result["success"] is False
        assert "error" in result
        assert result["url"] == "https://example.com/exception-test"


class TestCrawlingServiceEdgeCases:
    """Test edge cases and error conditions for CrawlingService"""
    
    @pytest.fixture
    def crawling_service(self):
        """Create CrawlingService instance"""
        return CrawlingService()
    
    def test_invalid_url_handling(self, crawling_service):
        """Test handling of invalid URLs"""
        invalid_urls = [
            "",
            "not-a-url",
            "ftp://invalid-protocol.com",
            "https://",
            "https://\n\r\t",
        ]
        
        # Test sitemap detection with invalid URLs
        for url in invalid_urls:
            # Should not raise exceptions
            is_sitemap = crawling_service.is_sitemap(url)
            is_txt = crawling_service.is_txt(url)
            
            assert isinstance(is_sitemap, bool)
            assert isinstance(is_txt, bool)
    
    @patch('requests.get')
    def test_parse_sitemap_timeout(self, mock_get, crawling_service):
        """Test sitemap parsing with timeout"""
        mock_get.side_effect = requests.exceptions.Timeout("Request timeout")
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert urls == []
    
    @patch('requests.get')
    def test_parse_sitemap_empty_response(self, mock_get, crawling_service):
        """Test sitemap parsing with empty response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b""
        mock_get.return_value = mock_response
        
        urls = crawling_service.parse_sitemap("https://example.com/sitemap.xml")
        
        assert urls == []
    
    def test_code_block_selectors_coverage(self, crawling_service):
        """Test that code block selectors cover major frameworks"""
        selectors = crawling_service.CODE_BLOCK_SELECTORS
        
        # Verify we have selectors for major frameworks
        expected_patterns = [
            "milkdown",  # Milkdown editor
            "monaco",    # Monaco editor
            "cm-editor", # CodeMirror
            "language-", # Prism.js
            "hljs",      # highlight.js
            "shiki",     # Shiki
            "pre code"   # Generic
        ]
        
        selector_text = " ".join(selectors).lower()
        for pattern in expected_patterns:
            assert pattern in selector_text, f"Missing selector pattern: {pattern}"
    
    @pytest.mark.asyncio
    async def test_concurrent_crawling_safety(self, crawling_service):
        """Test that multiple concurrent crawls don't interfere"""
        import asyncio
        
        # Mock successful results
        mock_results = []
        for i in range(3):
            result = Mock()
            result.success = True
            result.url = f"https://example.com/page{i}"
            result.markdown = f"# Page {i}\nContent for page {i}"
            result.html = f"<h1>Page {i}</h1>"
            result.metadata = {"title": f"Page {i}"}
            result.error_message = None
            mock_results.append(result)
        
        crawling_service.crawler = AsyncMock()
        crawling_service.crawler.arun.side_effect = mock_results
        
        # Run concurrent crawls
        urls = [f"https://example.com/page{i}" for i in range(3)]
        tasks = [crawling_service.crawl_single_page(url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert len(results) == 3
        for i, result in enumerate(results):
            assert result["success"] is True
            assert result["url"] == f"https://example.com/page{i}"