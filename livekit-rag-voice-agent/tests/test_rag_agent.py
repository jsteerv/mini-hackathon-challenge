"""
Unit tests for RAG Voice Agent
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock LiveKit modules before importing
sys.modules['livekit'] = MagicMock()
sys.modules['livekit.agents'] = MagicMock()
sys.modules['livekit.plugins'] = MagicMock()
sys.modules['livekit.plugins.openai'] = MagicMock()
sys.modules['livekit.plugins.deepgram'] = MagicMock()
sys.modules['livekit.plugins.silero'] = MagicMock()
sys.modules['livekit.plugins.turn_detector'] = MagicMock()
sys.modules['ingestion'] = MagicMock()
sys.modules['ingestion.embedder'] = MagicMock()

from rag_agent import RAGKnowledgeAgent


@pytest.mark.asyncio
async def test_agent_initialization():
    """Test agent initializes with correct instructions."""
    agent = RAGKnowledgeAgent()
    assert "knowledge assistant" in agent.instructions.lower()
    assert agent.db_pool is None
    assert agent.search_history == []


@pytest.mark.asyncio
async def test_database_initialization():
    """Test database pool initialization."""
    agent = RAGKnowledgeAgent()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_pool.return_value = AsyncMock()
        
        await agent.initialize_db()
        
        mock_pool.assert_called_once()
        assert agent.db_pool is not None


@pytest.mark.asyncio
async def test_search_knowledge_base_with_results():
    """Test knowledge base search returns relevant results."""
    agent = RAGKnowledgeAgent()
    
    # Mock database and embedder
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        
        # Mock search results
        mock_conn.fetch.return_value = [
            {
                'similarity': 0.85,
                'content': 'Test content about AI and machine learning',
                'document_title': 'AI Documentation',
                'document_source': 'docs/ai.md'
            },
            {
                'similarity': 0.75,
                'content': 'Machine learning algorithms and techniques',
                'document_title': 'ML Guide',
                'document_source': 'docs/ml.md'
            }
        ]
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            # Execute search
            context = Mock()
            result = await agent.search_knowledge_base(context, "What is AI?", limit=5)
            
            assert "Found 2 relevant results" in result
            assert "AI Documentation" in result
            assert "ML Guide" in result
            assert len(agent.search_history) == 1
            assert agent.search_history[0]['query'] == "What is AI?"
            assert agent.search_history[0]['results_count'] == 2


@pytest.mark.asyncio
async def test_search_knowledge_base_no_results():
    """Test graceful handling when no results found."""
    agent = RAGKnowledgeAgent()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        mock_conn.fetch.return_value = []
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            context = Mock()
            result = await agent.search_knowledge_base(context, "Unknown topic")
            
            assert "No relevant information found" in result


@pytest.mark.asyncio
async def test_search_knowledge_base_low_similarity():
    """Test handling of results with low similarity scores."""
    agent = RAGKnowledgeAgent()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        
        # Mock results with low similarity
        mock_conn.fetch.return_value = [
            {
                'similarity': 0.5,  # Below threshold
                'content': 'Somewhat related content',
                'document_title': 'Some Doc',
                'document_source': 'docs/some.md'
            }
        ]
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            context = Mock()
            result = await agent.search_knowledge_base(context, "Vague query")
            
            assert "may not be directly relevant" in result


@pytest.mark.asyncio
async def test_search_knowledge_base_error_handling():
    """Test error handling in knowledge base search."""
    agent = RAGKnowledgeAgent()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_pool.side_effect = Exception("Database connection failed")
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            context = Mock()
            result = await agent.search_knowledge_base(context, "Test query")
            
            assert "encountered an error" in result


@pytest.mark.asyncio
async def test_on_enter_lifecycle():
    """Test on_enter lifecycle method."""
    agent = RAGKnowledgeAgent()
    
    # Mock session and database
    agent.session = AsyncMock()
    agent.session.generate_reply = AsyncMock()
    
    with patch.object(agent, 'initialize_db', new=AsyncMock()) as mock_init_db:
        await agent.on_enter()
        
        mock_init_db.assert_called_once()
        agent.session.generate_reply.assert_called_once()


@pytest.mark.asyncio
async def test_on_exit_lifecycle():
    """Test on_exit lifecycle method."""
    agent = RAGKnowledgeAgent()
    
    # Mock session and database pool
    agent.session = AsyncMock()
    agent.session.say = AsyncMock()
    agent.db_pool = AsyncMock()
    agent.db_pool.close = AsyncMock()
    
    await agent.on_exit()
    
    agent.db_pool.close.assert_called_once()
    agent.session.say.assert_called_once_with("Thank you for using the knowledge assistant. Have a great day!")


@pytest.mark.asyncio
async def test_search_history_tracking():
    """Test that search history is properly tracked."""
    agent = RAGKnowledgeAgent()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        
        # Mock multiple searches
        mock_conn.fetch.return_value = [
            {
                'similarity': 0.9,
                'content': 'Result content',
                'document_title': 'Doc',
                'document_source': 'doc.md'
            }
        ]
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            context = Mock()
            
            # Perform multiple searches
            await agent.search_knowledge_base(context, "First query")
            await agent.search_knowledge_base(context, "Second query")
            await agent.search_knowledge_base(context, "Third query")
            
            assert len(agent.search_history) == 3
            assert agent.search_history[0]['query'] == "First query"
            assert agent.search_history[1]['query'] == "Second query"
            assert agent.search_history[2]['query'] == "Third query"
            
            # Check that similarity scores are tracked
            for history_item in agent.search_history:
                assert 'top_similarity' in history_item
                assert history_item['top_similarity'] == 0.9


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])