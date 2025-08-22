"""
Behavioral tests for RAG Voice Agent interactions
"""

import pytest
import sys
import os
from unittest.mock import AsyncMock, patch, Mock, MagicMock

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

# Mock the AgentTestSuite and Judge since we're testing without full LiveKit setup
class MockJudge:
    def __init__(self, criteria: str):
        self.criteria = criteria
    
    def evaluate(self, response: str) -> bool:
        """Simple evaluation based on keywords in criteria."""
        criteria_lower = self.criteria.lower()
        response_lower = response.lower()
        
        if "greet" in criteria_lower:
            return any(word in response_lower for word in ["hello", "welcome", "help", "assist"])
        elif "search knowledge" in criteria_lower:
            return "search_knowledge_base" in response_lower
        elif "source" in criteria_lower:
            return "source:" in response_lower
        elif "error" in criteria_lower:
            return any(word in response_lower for word in ["error", "trouble", "sorry"])
        
        return True


class MockTestResult:
    def __init__(self, passed: bool, details: str = ""):
        self.passed = passed
        self.details = details


class MockAgentTestSuite:
    async def test_agent(self, agent, scenario: str, judge: MockJudge) -> MockTestResult:
        """Mock test execution."""
        # Simulate different scenarios
        if "joins session" in scenario:
            # Test greeting
            agent.session = AsyncMock()
            agent.session.generate_reply = AsyncMock()
            await agent.on_enter()
            
            # Check if greeting was called
            if agent.session.generate_reply.called:
                call_args = agent.session.generate_reply.call_args
                if call_args and "help" in str(call_args):
                    return MockTestResult(True, "Agent greeted appropriately")
            
            return MockTestResult(False, "Agent did not greet")
        
        elif "asks:" in scenario:
            # Extract query from scenario
            query = scenario.split("asks:")[1].strip().strip('"')
            
            # Test knowledge search
            context = Mock()
            with patch('rag_agent.asyncpg.create_pool') as mock_pool:
                mock_conn = AsyncMock()
                mock_acquire = AsyncMock()
                mock_acquire.__aenter__.return_value = mock_conn
                mock_pool.return_value.acquire.return_value = mock_acquire
                
                mock_conn.fetch.return_value = [
                    {
                        'similarity': 0.85,
                        'content': 'AI strategy content',
                        'document_title': 'Company AI Strategy',
                        'document_source': 'strategy.md'
                    }
                ]
                
                agent.db_pool = mock_pool.return_value
                
                with patch('rag_agent.create_embedder') as mock_embedder_factory:
                    mock_embedder = AsyncMock()
                    mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
                    mock_embedder_factory.return_value = mock_embedder
                    
                    result = await agent.search_knowledge_base(context, query)
                    
                    if "Source:" in result and "relevant results" in result:
                        return MockTestResult(True, "Agent searched and provided sourced answer")
            
            return MockTestResult(False, "Agent did not search knowledge base properly")
        
        elif "database error" in scenario:
            # Test error handling
            context = Mock()
            with patch('rag_agent.asyncpg.create_pool') as mock_pool:
                mock_pool.side_effect = Exception("Database error")
                
                with patch('rag_agent.create_embedder') as mock_embedder_factory:
                    mock_embedder = AsyncMock()
                    mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
                    mock_embedder_factory.return_value = mock_embedder
                    
                    result = await agent.search_knowledge_base(context, "test")
                    
                    if "error" in result.lower():
                        return MockTestResult(True, "Agent handled error gracefully")
            
            return MockTestResult(False, "Agent did not handle error properly")
        
        return MockTestResult(True, "Scenario not specifically tested")


@pytest.mark.asyncio
async def test_greeting_behavior():
    """Test agent greets appropriately."""
    suite = MockAgentTestSuite()
    judge = MockJudge(
        criteria="Agent should greet warmly and explain RAG capabilities"
    )
    
    agent = RAGKnowledgeAgent()
    result = await suite.test_agent(
        agent=agent,
        scenario="User joins session",
        judge=judge
    )
    
    assert result.passed, f"Greeting test failed: {result.details}"


@pytest.mark.asyncio
async def test_knowledge_query_behavior():
    """Test agent searches knowledge base when asked questions."""
    suite = MockAgentTestSuite()
    judge = MockJudge(
        criteria="Agent should search knowledge base and provide sourced answers"
    )
    
    agent = RAGKnowledgeAgent()
    result = await suite.test_agent(
        agent=agent,
        scenario='User asks: "What is our company AI strategy?"',
        judge=judge
    )
    
    assert result.passed, f"Knowledge query test failed: {result.details}"


@pytest.mark.asyncio
async def test_error_handling_behavior():
    """Test agent handles errors gracefully."""
    suite = MockAgentTestSuite()
    judge = MockJudge(
        criteria="Agent should handle errors gracefully and inform user"
    )
    
    agent = RAGKnowledgeAgent()
    result = await suite.test_agent(
        agent=agent,
        scenario="database error occurs",
        judge=judge
    )
    
    assert result.passed, f"Error handling test failed: {result.details}"


@pytest.mark.asyncio
async def test_no_results_behavior():
    """Test agent behavior when no relevant results found."""
    agent = RAGKnowledgeAgent()
    context = Mock()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        mock_conn.fetch.return_value = []  # No results
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            result = await agent.search_knowledge_base(context, "completely unknown topic")
            
            # Should inform user politely that no information was found
            assert "No relevant information found" in result
            assert "knowledge base" in result


@pytest.mark.asyncio
async def test_low_confidence_behavior():
    """Test agent behavior with low confidence results."""
    agent = RAGKnowledgeAgent()
    context = Mock()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        
        # Results with low similarity
        mock_conn.fetch.return_value = [
            {
                'similarity': 0.4,  # Very low similarity
                'content': 'Barely related content',
                'document_title': 'Some Document',
                'document_source': 'doc.md'
            }
        ]
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            result = await agent.search_knowledge_base(context, "vague question")
            
            # Should indicate low relevance
            assert "may not be directly relevant" in result or "rephrase" in result.lower()


@pytest.mark.asyncio
async def test_multiple_sources_behavior():
    """Test agent properly cites multiple sources."""
    agent = RAGKnowledgeAgent()
    context = Mock()
    
    with patch('rag_agent.asyncpg.create_pool') as mock_pool:
        mock_conn = AsyncMock()
        mock_acquire = AsyncMock()
        mock_acquire.__aenter__.return_value = mock_conn
        mock_pool.return_value.acquire.return_value = mock_acquire
        
        # Multiple high-quality results
        mock_conn.fetch.return_value = [
            {
                'similarity': 0.95,
                'content': 'Primary information about topic',
                'document_title': 'Main Guide',
                'document_source': 'guide.md'
            },
            {
                'similarity': 0.88,
                'content': 'Supporting information',
                'document_title': 'Reference Doc',
                'document_source': 'ref.md'
            },
            {
                'similarity': 0.82,
                'content': 'Additional context',
                'document_title': 'FAQ',
                'document_source': 'faq.md'
            }
        ]
        
        agent.db_pool = mock_pool.return_value
        
        with patch('rag_agent.create_embedder') as mock_embedder_factory:
            mock_embedder = AsyncMock()
            mock_embedder.embed_query = AsyncMock(return_value=[0.1] * 1536)
            mock_embedder_factory.return_value = mock_embedder
            
            result = await agent.search_knowledge_base(context, "comprehensive question")
            
            # Should include multiple sources
            assert "Found 3 relevant results" in result
            assert "[Source: Main Guide]" in result
            assert "[Source: Reference Doc]" in result
            assert "[Source: FAQ]" in result


@pytest.mark.asyncio
async def test_session_lifecycle():
    """Test complete session lifecycle from greeting to farewell."""
    agent = RAGKnowledgeAgent()
    
    # Mock session
    agent.session = AsyncMock()
    agent.session.generate_reply = AsyncMock()
    agent.session.say = AsyncMock()
    
    # Test enter
    with patch.object(agent, 'initialize_db', new=AsyncMock()):
        await agent.on_enter()
        
        # Should greet
        agent.session.generate_reply.assert_called_once()
        greeting_call = agent.session.generate_reply.call_args
        assert "help" in str(greeting_call).lower()
    
    # Simulate some searches
    agent.search_history = [
        {"query": "test1", "results_count": 2, "top_similarity": 0.9},
        {"query": "test2", "results_count": 1, "top_similarity": 0.8}
    ]
    
    # Test exit
    agent.db_pool = AsyncMock()
    await agent.on_exit()
    
    # Should close pool and say farewell
    agent.db_pool.close.assert_called_once()
    agent.session.say.assert_called_once_with("Thank you for using the knowledge assistant. Have a great day!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])