"""
Synthesis Agent for parallel research workflow.

This agent synthesizes findings from all 3 parallel research agents (SEO, Social, Competitor)
and creates a comprehensive email draft based on the combined research data.
"""

import logging
from typing import Dict, Any
from pydantic_ai import Agent, RunContext

from clients import get_model
from .deps import ResearchAgentDependencies, NewsResearchAgentDependencies
from .prompts import SYNTHESIS_SYSTEM_PROMPT, NEWS_SYNTHESIS_PROMPT

logger = logging.getLogger(__name__)


# Initialize the synthesis agent
synthesis_agent = Agent(
    get_model(use_smaller_model=False),
    deps_type=ResearchAgentDependencies,
    system_prompt=SYNTHESIS_SYSTEM_PROMPT,
    instrument=True
)


@synthesis_agent.tool
async def synthesize_research_data(
    ctx: RunContext[ResearchAgentDependencies],
    seo_research: str,
    social_research: str,
    competitor_research: str,
    original_query: str
) -> Dict[str, Any]:
    """
    Synthesize research data from all three parallel agents.
    
    Args:
        seo_research: SEO-focused research findings
        social_research: Social media research findings
        competitor_research: Competitor analysis findings
        original_query: Original user request for context
    
    Returns:
        Dictionary with synthesis results and insights
    """
    try:
        # Create comprehensive synthesis summary
        synthesis_data = {
            "seo_insights": seo_research,
            "social_insights": social_research,
            "competitive_insights": competitor_research,
            "original_context": original_query,
            "synthesis_timestamp": "research_synthesis_completed"
        }
        
        logger.info("Research synthesis completed successfully")
        return synthesis_data
        
    except Exception as e:
        logger.error(f"Research synthesis failed: {e}")
        return {
            "error": f"Synthesis failed: {str(e)}",
            "seo_insights": seo_research,
            "social_insights": social_research,
            "competitive_insights": competitor_research
        }


# News Synthesis Agent
news_synthesis_agent = Agent(
    get_model(use_smaller_model=False),
    deps_type=NewsResearchAgentDependencies,
    system_prompt=NEWS_SYNTHESIS_PROMPT,
    instrument=True
)


@news_synthesis_agent.tool
async def synthesize_ai_news(
    ctx: RunContext[NewsResearchAgentDependencies],
    perplexity_research: str,
    rss_articles: str,
    youtube_transcripts: str,
    news_items_from_db: str,
    original_query: str,
    run_date: str
) -> Dict[str, Any]:
    """
    Synthesize AI news from all sources and select top news items.
    
    Args:
        perplexity_research: Perplexity web research findings
        rss_articles: RSS feed analysis findings
        youtube_transcripts: YouTube transcript analysis findings
        news_items_from_db: All news items collected today from database
        original_query: Original news aggregation request
        run_date: Date for news aggregation
    
    Returns:
        Dictionary with top news items and synthesis analysis
    """
    try:
        # Import database functions here to avoid circular imports
        from api.db_utils import get_todays_news_items
        
        # Get all news items from database for comprehensive analysis
        all_news_items = await get_todays_news_items(run_date)
        
        # Create comprehensive analysis combining all sources
        synthesis_data = {
            "run_date": run_date,
            "original_query": original_query,
            "sources_analyzed": {
                "perplexity": bool(perplexity_research and len(perplexity_research) > 100),
                "rss": bool(rss_articles and len(rss_articles) > 100),
                "youtube": bool(youtube_transcripts and len(youtube_transcripts) > 100),
                "database_items": len(all_news_items)
            },
            "total_sources": len([s for s in [perplexity_research, rss_articles, youtube_transcripts] if s and len(s) > 100]),
            "news_items_collected": len(all_news_items),
            "analysis_timestamp": "news_synthesis_completed"
        }
        
        # Analyze all collected data to identify top news items
        # In a full implementation, this would use LLM analysis to:
        # 1. Rank news items by relevance and importance  
        # 2. Identify trends and patterns
        # 3. Cross-reference stories across sources
        # 4. Select top 5-10 items with detailed analysis
        
        # For now, return basic analysis structure
        synthesis_data["top_news_items"] = []
        synthesis_data["emerging_trends"] = []
        synthesis_data["executive_summary"] = f"Analyzed {len(all_news_items)} news items from {synthesis_data['total_sources']} sources on {run_date}"
        
        # Basic top news selection from database items (by relevance score)
        if all_news_items:
            # Sort by relevance score and mention count
            sorted_items = sorted(all_news_items, key=lambda x: (x.get('relevance_score', 0), x.get('mention_count', 0)), reverse=True)
            top_items = sorted_items[:10]  # Top 10 items
            
            synthesis_data["top_news_items"] = [
                {
                    "title": item.get("title", ""),
                    "summary": item.get("summary", ""),
                    "relevance_score": item.get("relevance_score", 0),
                    "mention_count": item.get("mention_count", 0),
                    "source_type": item.get("source_type", ""),
                    "source_name": item.get("source_name", ""),
                    "article_url": item.get("article_url", "")
                }
                for item in top_items
            ]
        
        logger.info(f"News synthesis completed - found {len(synthesis_data.get('top_news_items', []))} top news items")
        return synthesis_data
        
    except Exception as e:
        logger.error(f"News synthesis failed: {e}")
        return {
            "error": f"News synthesis failed: {str(e)}",
            "run_date": run_date,
            "original_query": original_query,
            "sources_available": {
                "perplexity": bool(perplexity_research),
                "rss": bool(rss_articles),
                "youtube": bool(youtube_transcripts)
            }
        }


@news_synthesis_agent.tool
async def analyze_news_trends(
    ctx: RunContext[NewsResearchAgentDependencies],
    news_items: str,
    timeframe: str = "today"
) -> Dict[str, Any]:
    """
    Analyze trends and patterns in collected news items.
    
    Args:
        news_items: JSON string of news items to analyze
        timeframe: Timeframe for trend analysis
        
    Returns:
        Dictionary with trend analysis results
    """
    try:
        # Basic trend analysis - would be enhanced with LLM analysis
        trend_analysis = {
            "timeframe": timeframe,
            "analysis_type": "trend_identification",
            "key_trends": [],
            "emerging_topics": [],
            "sentiment_analysis": "neutral",  # Would be computed
            "market_implications": [],
            "timestamp": "trend_analysis_completed"
        }
        
        logger.info("News trend analysis completed")
        return trend_analysis
        
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        return {"error": f"Trend analysis failed: {str(e)}"}