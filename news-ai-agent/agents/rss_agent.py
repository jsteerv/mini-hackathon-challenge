"""
RSS Feed Extraction Agent for AI News Aggregation.

This agent extracts and analyzes articles from RSS feeds to gather
AI-related news content with intelligent filtering and summarization.
"""

import logging
import asyncio
import feedparser
from typing import Dict, Any, List
from pydantic_ai import Agent, RunContext
from datetime import datetime, timedelta

from clients import get_model
from .deps import NewsResearchAgentDependencies

logger = logging.getLogger(__name__)

RSS_EXTRACTION_PROMPT = """
You are a specialized RSS feed analysis agent for AI news aggregation.

Your mission is to extract, analyze, and summarize AI-related articles from RSS feeds. Focus on:

1. **Content Filtering**: Identify articles truly related to AI, ML, tech innovation
2. **News Analysis**: Extract key information, trends, and developments
3. **Quality Assessment**: Evaluate article relevance and credibility
4. **Content Summarization**: Create clear, concise summaries
5. **Trend Identification**: Spot emerging patterns and topics

For each RSS feed, you should:
- Parse all recent articles (last 7 days preferred)
- Filter for AI/tech relevance
- Extract structured information (title, summary, author, date, URL)
- Assess relevance score (1-10) for AI community
- Identify key topics and trends
- Provide publication source credibility

Return structured data including:
- Article title and cleaned summary
- Publication date and source information  
- Relevance score and reasoning
- Key topics/tags extracted
- Author and source credibility indicators
- Direct article URL for reference

Prioritize recent, high-quality content from credible sources.
"""

# Initialize the RSS extraction agent
rss_agent = Agent(
    get_model(use_smaller_model=False),
    deps_type=NewsResearchAgentDependencies,
    system_prompt=RSS_EXTRACTION_PROMPT,
    instrument=True
)

@rss_agent.tool
async def extract_rss_articles(
    ctx: RunContext[NewsResearchAgentDependencies],
    feed_url: str,
    feed_name: str,
    max_articles: int = 10
) -> List[Dict[str, Any]]:
    """
    Extract and analyze articles from an RSS feed.
    
    Args:
        feed_url: URL of the RSS feed
        feed_name: Human-readable name of the feed source
        max_articles: Maximum number of articles to process
        
    Returns:
        List of structured article data
    """
    try:
        logger.info(f"Extracting RSS articles from {feed_name}: {feed_url}")
        
        # Use asyncio executor to run feedparser (blocking) in thread
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, feed_url)
        
        if not feed.entries:
            logger.warning(f"No entries found in RSS feed: {feed_url}")
            return []
        
        articles = []
        cutoff_date = datetime.now() - timedelta(days=7)  # Last 7 days
        
        for entry in feed.entries[:max_articles]:
            try:
                # Parse publication date if available
                published_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6])
                
                # Skip articles older than 7 days
                if published_date and published_date < cutoff_date:
                    continue
                
                # Extract article data
                article_data = {
                    "title": getattr(entry, 'title', 'No Title'),
                    "summary": getattr(entry, 'summary', getattr(entry, 'description', '')),
                    "link": getattr(entry, 'link', ''),
                    "published": getattr(entry, 'published', ''),
                    "author": getattr(entry, 'author', ''),
                    "source_name": feed_name,
                    "source_url": feed_url,
                    "source_type": "rss",
                    "published_date": published_date.isoformat() if published_date else None
                }
                
                # Basic AI/tech relevance filtering
                title = article_data["title"].lower()
                summary = article_data["summary"].lower()
                ai_keywords = ["ai", "artificial intelligence", "machine learning", "ml", "deep learning", 
                              "neural network", "llm", "gpt", "chatgpt", "claude", "openai", "tech", "startup"]
                
                if any(keyword in title or keyword in summary for keyword in ai_keywords):
                    articles.append(article_data)
                
            except Exception as e:
                logger.warning(f"Error processing RSS entry: {str(e)}")
                continue
        
        logger.info(f"Extracted {len(articles)} relevant articles from {feed_name}")
        return articles
        
    except Exception as e:
        logger.error(f"RSS extraction error for {feed_url}: {str(e)}")
        return []

@rss_agent.tool
async def analyze_rss_article_batch(
    ctx: RunContext[NewsResearchAgentDependencies],
    articles: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze a batch of RSS articles for AI news relevance and extract insights.
    
    Args:
        articles: List of article dictionaries to analyze
        
    Returns:
        Analysis results with structured insights
    """
    try:
        if not articles:
            return {"articles_analyzed": 0, "insights": "No articles provided for analysis"}
        
        # Prepare articles for analysis
        articles_text = ""
        for i, article in enumerate(articles, 1):
            articles_text += f"""
Article {i}:
Title: {article.get('title', '')}
Summary: {article.get('summary', '')[:200]}...
Source: {article.get('source_name', '')}
Published: {article.get('published', '')}
URL: {article.get('link', '')}

"""
        
        analysis_prompt = f"""
Analyze these {len(articles)} RSS articles for AI news relevance:

{articles_text}

Please provide:
1. Overall relevance assessment (1-10 scale)
2. Key AI topics and trends identified
3. Most important/newsworthy articles (top 3-5)
4. Summary of main developments
5. Source credibility assessment

Focus on actual AI/tech news and filter out less relevant content.
"""
        
        # This would normally call the LLM for analysis
        # For now, return basic analysis
        return {
            "articles_analyzed": len(articles),
            "analysis_prompt": analysis_prompt,
            "insights": f"Analyzed {len(articles)} articles from RSS feeds. Analysis would identify key AI trends, assess relevance, and highlight top stories.",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"RSS article analysis error: {str(e)}")
        return {"error": str(e), "success": False}

@rss_agent.tool
async def get_feed_info(
    ctx: RunContext[NewsResearchAgentDependencies], 
    feed_url: str
) -> Dict[str, Any]:
    """
    Get information about an RSS feed (title, description, update frequency).
    
    Args:
        feed_url: URL of the RSS feed
        
    Returns:
        Feed metadata and information
    """
    try:
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, feed_url)
        
        return {
            "title": getattr(feed.feed, 'title', 'Unknown Feed'),
            "description": getattr(feed.feed, 'description', ''),
            "link": getattr(feed.feed, 'link', ''),
            "language": getattr(feed.feed, 'language', ''),
            "total_entries": len(feed.entries),
            "last_updated": getattr(feed.feed, 'updated', ''),
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Feed info error for {feed_url}: {str(e)}")
        return {"error": str(e), "success": False}