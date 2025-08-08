"""
Perplexity AI Research Agent for AI News Aggregation.

This agent performs web research using Perplexity's Sonar API to gather 
the latest AI news developments with real-time citations.
"""

import logging
import httpx
from typing import Dict, Any, List
from pydantic_ai import Agent, RunContext

from clients import get_model
from .deps import NewsResearchAgentDependencies

logger = logging.getLogger(__name__)

PERPLEXITY_RESEARCH_PROMPT = """
You are a specialized AI news research agent using Perplexity's real-time web search capabilities.

Your mission is to research the latest AI developments, breakthroughs, and industry news. Focus on:

1. **Technology Breakthroughs**: New AI models, research papers, technical advances
2. **Industry News**: Company announcements, funding, partnerships, acquisitions  
3. **Product Launches**: New AI tools, platforms, applications, features
4. **Research Publications**: Important papers, studies, findings
5. **Policy & Regulation**: AI governance, ethics, regulatory developments
6. **Market Trends**: Industry analysis, market movements, adoption patterns

For each search query, you should:
- Search for the most recent and relevant information
- Extract structured news items with titles, summaries, and sources
- Focus on credible sources (research institutions, major tech companies, reputable news outlets)
- Identify key trends and developments
- Provide clear, factual summaries

Return your findings as structured information including:
- Title of each news item
- Brief summary (2-3 sentences)
- Source URL and publication
- Relevance score (1-10) based on importance to AI community
- Key topics/tags

Always prioritize accuracy and cite your sources properly.
"""

# Initialize the Perplexity research agent
perplexity_agent = Agent(
    get_model(use_smaller_model=False),
    deps_type=NewsResearchAgentDependencies,
    system_prompt=PERPLEXITY_RESEARCH_PROMPT,
    instrument=True
)

@perplexity_agent.tool
async def search_perplexity_for_ai_news(
    ctx: RunContext[NewsResearchAgentDependencies],
    topic: str,
    keywords: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Search Perplexity for AI news on a specific topic with optional keywords.
    
    Args:
        topic: The main research topic (e.g., "LLM advances", "AI regulation")
        keywords: Optional list of keywords to include in search
    
    Returns:
        List of structured news items with metadata
    """
    try:
        # Construct search query
        if keywords:
            query = f"{topic} {' '.join(keywords)} latest AI news developments 2025"
        else:
            query = f"{topic} latest AI news developments 2025"
        
        logger.info(f"Searching Perplexity for: {query}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {ctx.deps.perplexity_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "sonar-pro",
                    "messages": [
                        {
                            "role": "system", 
                            "content": "You are a news research assistant. Find and structure the latest AI news into clear, factual summaries with proper citations."
                        },
                        {
                            "role": "user", 
                            "content": query
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4000
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
                return []
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not content:
                logger.warning("Empty response from Perplexity API")
                return []
            
            # Return the raw content for now - the synthesis agent will structure it
            return [{
                "topic": topic,
                "content": content,
                "source_type": "perplexity",
                "query_used": query,
                "api_response": True
            }]
            
    except httpx.TimeoutException:
        logger.error("Perplexity API request timed out")
        return []
    except httpx.RequestError as e:
        logger.error(f"Perplexity API request error: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in Perplexity search: {str(e)}")
        return []

@perplexity_agent.tool  
async def search_perplexity_web_research(
    ctx: RunContext[NewsResearchAgentDependencies],
    query: str
) -> Dict[str, Any]:
    """
    General web research using Perplexity for any AI-related query.
    
    Args:
        query: Search query for web research
        
    Returns:
        Dictionary with research results and metadata
    """
    try:
        logger.info(f"General Perplexity research for: {query}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {ctx.deps.perplexity_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "sonar-pro", 
                    "messages": [{"role": "user", "content": query}],
                    "temperature": 0.1,
                    "max_tokens": 3000
                }
            )
            
            if response.status_code != 200:
                return {"error": f"API error: {response.status_code}"}
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            return {
                "query": query,
                "content": content,
                "source": "perplexity_api",
                "timestamp": "2025-01-08",  # Will be updated with actual timestamp
                "success": True
            }
            
    except Exception as e:
        logger.error(f"General Perplexity research error: {str(e)}")
        return {"error": str(e), "success": False}