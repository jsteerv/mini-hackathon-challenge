"""
YouTube Transcript Analysis Agent for AI News Aggregation.

This agent fetches YouTube video transcripts using Supadata API and analyzes
them for AI news content, discussions, and insights.
"""

import logging
import httpx
from typing import Dict, Any, List
from pydantic_ai import Agent, RunContext
from urllib.parse import urlparse, parse_qs

from clients import get_model
from .deps import NewsResearchAgentDependencies

logger = logging.getLogger(__name__)

YOUTUBE_ANALYSIS_PROMPT = """
You are a specialized YouTube content analysis agent for AI news aggregation.

Your mission is to analyze YouTube video transcripts to extract AI-related news, 
discussions, insights, and developments. Focus on:

1. **Content Analysis**: Extract key points, news items, and insights from transcripts
2. **News Identification**: Identify actual news vs. opinions/discussions
3. **Topic Extraction**: Pull out specific AI developments, companies, technologies
4. **Context Understanding**: Understand the broader context and implications
5. **Credibility Assessment**: Evaluate source credibility and information quality
6. **Trend Spotting**: Identify emerging trends and patterns

For each video transcript, you should:
- Analyze the full transcript content for AI-related information
- Extract specific news items and developments mentioned
- Identify key companies, people, and technologies discussed
- Assess the credibility and newsworthiness of information
- Extract quotes and specific claims with context
- Provide relevance scores (1-10) for different segments

Return structured information including:
- Key news items extracted from transcript
- Important quotes and claims with timestamps
- Companies, people, and technologies mentioned
- Channel credibility and content type assessment
- Relevance scores for different topics covered
- Summary of main insights and takeaways

Prioritize factual information and clearly distinguish between news and opinions.
"""

# Initialize the YouTube analysis agent
youtube_agent = Agent(
    get_model(use_smaller_model=False),
    deps_type=NewsResearchAgentDependencies,
    system_prompt=YOUTUBE_ANALYSIS_PROMPT,
    instrument=True
)

@youtube_agent.tool
async def get_youtube_transcript(
    ctx: RunContext[NewsResearchAgentDependencies],
    video_url: str,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Fetch YouTube video transcript using Supadata API.
    
    Args:
        video_url: YouTube video URL
        language: Language code for transcript (default: "en")
        
    Returns:
        Dictionary with transcript data and metadata
    """
    try:
        logger.info(f"Fetching transcript for: {video_url}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "https://api.supadata.ai/v1/transcript",
                headers={
                    "x-api-key": ctx.deps.supadata_api_key,
                    "Content-Type": "application/json"
                },
                params={
                    "url": video_url,
                    "lang": language
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Supadata API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "success": False}
            
            transcript_data = response.json()
            
            return {
                "video_url": video_url,
                "transcript": transcript_data.get("content", ""),
                "metadata": {
                    "duration": transcript_data.get("duration"),
                    "title": transcript_data.get("title", ""),
                    "channel": transcript_data.get("channel", ""),
                    "upload_date": transcript_data.get("upload_date", "")
                },
                "success": True
            }
            
    except httpx.TimeoutException:
        logger.error("Supadata API request timed out")
        return {"error": "Request timeout", "success": False}
    except httpx.RequestError as e:
        logger.error(f"Supadata API request error: {str(e)}")
        return {"error": str(e), "success": False}
    except Exception as e:
        logger.error(f"Unexpected error fetching transcript: {str(e)}")
        return {"error": str(e), "success": False}

@youtube_agent.tool
async def analyze_youtube_channel_recent_videos(
    ctx: RunContext[NewsResearchAgentDependencies],
    channel_url: str,
    max_videos: int = 5
) -> List[Dict[str, Any]]:
    """
    Analyze recent videos from a YouTube channel for AI news content.
    
    Args:
        channel_url: YouTube channel URL 
        max_videos: Maximum number of recent videos to analyze
        
    Returns:
        List of video analysis results
    """
    try:
        logger.info(f"Analyzing recent videos from channel: {channel_url}")
        
        # For now, return mock data structure
        # In a real implementation, this would:
        # 1. Get recent video list from YouTube API or scraping
        # 2. Fetch transcripts for each video
        # 3. Analyze each transcript for AI content
        
        video_analyses = []
        
        # Mock analysis for demonstration
        for i in range(min(max_videos, 3)):  # Limit for demo
            analysis = {
                "video_index": i + 1,
                "channel_url": channel_url,
                "analysis_status": "mock_data",
                "ai_content_found": True,
                "relevance_score": 7.5,
                "key_topics": ["AI developments", "tech news", "industry updates"],
                "summary": f"Mock analysis of video {i+1} from channel. Would contain actual transcript analysis results."
            }
            video_analyses.append(analysis)
        
        return video_analyses
        
    except Exception as e:
        logger.error(f"Channel analysis error: {str(e)}")
        return []

@youtube_agent.tool
async def extract_ai_news_from_transcript(
    ctx: RunContext[NewsResearchAgentDependencies],
    transcript: str,
    video_metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Extract AI news items and insights from a video transcript.
    
    Args:
        transcript: Full video transcript text
        video_metadata: Optional metadata about the video
        
    Returns:
        Structured AI news extraction results
    """
    try:
        if not transcript or len(transcript.strip()) < 50:
            return {"error": "Transcript too short or empty", "success": False}
        
        logger.info("Extracting AI news from transcript...")
        
        # Basic AI keyword filtering
        ai_keywords = [
            "artificial intelligence", "ai", "machine learning", "ml", "deep learning",
            "neural network", "llm", "large language model", "gpt", "chatgpt", "claude",
            "openai", "anthropic", "google ai", "microsoft ai", "nvidia", "transformer",
            "generative ai", "agi", "artificial general intelligence"
        ]
        
        transcript_lower = transcript.lower()
        relevant_keywords = [kw for kw in ai_keywords if kw in transcript_lower]
        
        if not relevant_keywords:
            return {
                "ai_relevance": False,
                "keywords_found": [],
                "message": "No significant AI content detected in transcript"
            }
        
        # Extract key segments (simplified approach)
        segments = transcript.split('. ')
        ai_segments = []
        
        for segment in segments:
            if any(keyword in segment.lower() for keyword in relevant_keywords[:10]):  # Top 10 keywords
                ai_segments.append(segment.strip())
        
        analysis_result = {
            "ai_relevance": True,
            "keywords_found": relevant_keywords,
            "relevant_segments": ai_segments[:10],  # Top 10 segments
            "total_segments": len(ai_segments),
            "transcript_length": len(transcript),
            "video_metadata": video_metadata or {},
            "analysis_summary": f"Found {len(relevant_keywords)} AI-related keywords in transcript with {len(ai_segments)} relevant segments.",
            "success": True
        }
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Transcript analysis error: {str(e)}")
        return {"error": str(e), "success": False}

@youtube_agent.tool  
async def get_video_id_from_url(
    ctx: RunContext[NewsResearchAgentDependencies],
    youtube_url: str
) -> str:
    """
    Extract YouTube video ID from various YouTube URL formats.
    
    Args:
        youtube_url: YouTube URL in any format
        
    Returns:
        Video ID string or empty string if not found
    """
    try:
        parsed_url = urlparse(youtube_url)
        
        if parsed_url.hostname in ('youtu.be',):
            return parsed_url.path[1:]
        
        if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
            if parsed_url.path == '/watch':
                return parse_qs(parsed_url.query)['v'][0]
            elif parsed_url.path[:7] == '/embed/':
                return parsed_url.path.split('/')[2]
            elif parsed_url.path[:3] == '/v/':
                return parsed_url.path.split('/')[2]
        
        return ""
        
    except Exception as e:
        logger.error(f"Error extracting video ID from {youtube_url}: {str(e)}")
        return ""