"""
Test suite for RAG Vector Search Service

Tests vector similarity search, query processing, source filtering,
and performance optimization for document retrieval.
"""

import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch

from src.server.services.search.vector_search_service import (
    search_documents,
    SIMILARITY_THRESHOLD
)


class TestVectorSearchService:
    """Test cases for Vector Search Service"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """Mock Supabase client for vector search tests"""
        client = Mock()
        # Mock RPC response structure
        mock_response = Mock()
        mock_response.data = [
            {
                "id": "doc1",
                "content": "Test document content",
                "url": "https://example.com/doc1",
                "similarity": 0.85,
                "metadata": {"title": "Test Doc 1"}
            },
            {
                "id": "doc2", 
                "content": "Another test document",
                "url": "https://example.com/doc2",
                "similarity": 0.75,
                "metadata": {"title": "Test Doc 2"}
            },
            {
                "id": "doc3",
                "content": "Low relevance document",
                "url": "https://example.com/doc3", 
                "similarity": 0.10,  # Below threshold
                "metadata": {"title": "Test Doc 3"}
            }
        ]
        
        client.rpc.return_value.execute.return_value = mock_response
        return client
    
    @pytest.fixture
    def mock_embedding(self):
        """Mock embedding vector"""
        return [0.1, 0.2, 0.3] * 512  # 1536 dimensions typical for OpenAI embeddings
    
    def test_search_documents_basic_query(self, mock_supabase_client, mock_embedding):
        """Test basic document search with query processing"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=5
            )
            
            # Should filter out results below similarity threshold
            assert len(results) == 2  # Only doc1 and doc2 above threshold
            assert results[0]["similarity"] == 0.85
            assert results[1]["similarity"] == 0.75
            
            # Verify RPC call parameters
            mock_supabase_client.rpc.assert_called_once_with(
                "match_crawled_pages",
                {
                    "query_embedding": mock_embedding,
                    "match_count": 5,
                    "filter": {}
                }
            )
    
    def test_search_documents_with_source_filter(self, mock_supabase_client, mock_embedding):
        """Test document search with source filtering"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            filter_metadata = {"source": "example.com"}
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=3,
                filter_metadata=filter_metadata
            )
            
            # Verify RPC call with source filter
            mock_supabase_client.rpc.assert_called_once_with(
                "match_crawled_pages",
                {
                    "query_embedding": mock_embedding,
                    "match_count": 3,
                    "source_filter": "example.com",
                    "filter": {}
                }
            )
    
    def test_search_documents_with_general_filter(self, mock_supabase_client, mock_embedding):
        """Test document search with general metadata filtering"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            filter_metadata = {"category": "documentation", "language": "python"}
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=3,
                filter_metadata=filter_metadata
            )
            
            # Verify RPC call with general filter
            mock_supabase_client.rpc.assert_called_once_with(
                "match_crawled_pages",
                {
                    "query_embedding": mock_embedding,
                    "match_count": 3,
                    "filter": {"category": "documentation", "language": "python"}
                }
            )
    
    def test_search_documents_embedding_failure(self, mock_supabase_client):
        """Test handling of embedding creation failure"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = None  # Simulate failure
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=5
            )
            
            assert results == []
            # Should not call RPC if embedding creation fails
            mock_supabase_client.rpc.assert_not_called()
    
    def test_search_documents_similarity_threshold_filtering(self, mock_supabase_client, mock_embedding):
        """Test that results below similarity threshold are filtered out"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            # Mock response with varied similarity scores
            mock_response = Mock()
            mock_response.data = [
                {"id": "high", "similarity": 0.80},     # Above threshold
                {"id": "medium", "similarity": 0.50},   # Above threshold
                {"id": "low", "similarity": 0.10},      # Below threshold
                {"id": "very_low", "similarity": 0.05}, # Below threshold
            ]
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=10
            )
            
            # Should only return results above SIMILARITY_THRESHOLD (0.15)
            assert len(results) == 2
            assert all(r["similarity"] >= SIMILARITY_THRESHOLD for r in results)
    
    def test_search_documents_database_error(self, mock_supabase_client, mock_embedding):
        """Test handling of database errors during search"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            # Simulate database error
            mock_supabase_client.rpc.side_effect = Exception("Database connection failed")
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=5
            )
            
            assert results == []
    
    def test_search_documents_empty_response(self, mock_supabase_client, mock_embedding):
        """Test handling of empty search results"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            # Mock empty response
            mock_response = Mock()
            mock_response.data = []
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=5
            )
            
            assert results == []
    
    def test_search_documents_with_code_content(self, mock_supabase_client, mock_embedding):
        """Test document search with code-related content"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            # Mock response with code-related documents
            mock_response = Mock()
            mock_response.data = [
                {
                    "id": "doc1",
                    "content": "Python function example: def example_function():\n    return 'hello'",
                    "url": "https://example.com/python-guide",
                    "similarity": 0.90,
                    "metadata": {"category": "code", "language": "python"}
                }
            ]
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            results = search_documents(
                client=mock_supabase_client,
                query="python function example",
                match_count=3
            )
            
            assert len(results) == 1
            assert results[0]["metadata"]["language"] == "python"
            assert "def example_function" in results[0]["content"]
            
            # Verify correct RPC function called
            mock_supabase_client.rpc.assert_called_once_with(
                "match_crawled_pages",
                {
                    "query_embedding": mock_embedding,
                    "match_count": 3,
                    "filter": {}
                }
            )
    
    def test_search_documents_with_code_filtering(self, mock_supabase_client, mock_embedding):
        """Test document search with code-specific filtering"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            mock_response = Mock()
            mock_response.data = []
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            results = search_documents(
                client=mock_supabase_client,
                query="react component",
                match_count=3,
                filter_metadata={"category": "code", "language": "javascript"}
            )
            
            # Verify filter applied correctly
            mock_supabase_client.rpc.assert_called_once_with(
                "match_crawled_pages",
                {
                    "query_embedding": mock_embedding,
                    "match_count": 3,
                    "filter": {"category": "code", "language": "javascript"}
                }
            )
    
    def test_vector_search_performance_with_large_results(self, mock_supabase_client, mock_embedding):
        """Test performance with large result sets"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            # Create large mock response
            large_response_data = []
            for i in range(1000):
                large_response_data.append({
                    "id": f"doc{i}",
                    "content": f"Document {i} content",
                    "similarity": 0.8 - (i * 0.0001),  # Decreasing similarity
                    "metadata": {"index": i}
                })
            
            mock_response = Mock()
            mock_response.data = large_response_data
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            # Test with high match count
            results = search_documents(
                client=mock_supabase_client,
                query="test query",
                match_count=100
            )
            
            # Should handle large results efficiently
            assert len(results) <= 100
            # Results should be properly filtered by similarity threshold
            assert all(r["similarity"] >= SIMILARITY_THRESHOLD for r in results)
    
    def test_search_documents_query_sanitization(self, mock_supabase_client, mock_embedding):
        """Test handling of potentially problematic queries"""
        with patch('src.server.services.search.vector_search_service.create_embedding') as mock_create_embedding:
            mock_create_embedding.return_value = mock_embedding
            
            mock_response = Mock()
            mock_response.data = []
            mock_supabase_client.rpc.return_value.execute.return_value = mock_response
            
            # Test various edge case queries
            edge_queries = [
                "",  # Empty query
                " " * 1000,  # Very long whitespace
                "🚀 emoji query 🎉",  # Unicode/emoji
                "query\nwith\nnewlines",  # Newlines
                "query\twith\ttabs",  # Tabs
                "query with 'quotes' and \"double quotes\"",  # Quotes
            ]
            
            for query in edge_queries:
                results = search_documents(
                    client=mock_supabase_client,
                    query=query,
                    match_count=5
                )
                
                # Should handle edge cases gracefully
                assert isinstance(results, list)


class TestVectorSearchServiceAsync:
    """Test cases for async vector search operations"""
    
    @pytest_asyncio.fixture
    async def mock_async_client(self):
        """Mock async Supabase client"""
        client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.data = [
            {
                "id": "async_doc1",
                "content": "Async test content",
                "similarity": 0.90,
                "metadata": {"type": "async_test"}
            }
        ]
        client.rpc.return_value.execute = AsyncMock(return_value=mock_response)
        return client
    
    @pytest.mark.asyncio
    async def test_async_vector_search_integration(self, mock_async_client):
        """Test async vector search integration"""
        with patch('src.server.services.search.vector_search_service.create_embedding_async') as mock_create_embedding:
            mock_embedding = [0.1] * 1536
            mock_create_embedding.return_value = mock_embedding
            
            # Test async search function if implemented
            # This would test the async version of search_documents
            # For now, we'll test that the sync version can be called from async context
            
            results = search_documents(
                client=mock_async_client,
                query="async test query",
                match_count=5
            )
            
            # Should work in async context
            assert isinstance(results, list)