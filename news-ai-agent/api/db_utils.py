"""
Database utility functions for the Agent API.

This module contains functions for interacting with the database,
including conversation and message management.
"""
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
from supabase import Client, acreate_client, AsyncClient
from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage, ModelMessagesTypeAdapter
import random
import string
import os
import logging

logger = logging.getLogger(__name__)


async def fetch_conversation_history(supabase: Client, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch the most recent conversation history for a session."""
    try:
        response = supabase.table("messages") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        # Convert to list and reverse to get chronological order
        messages = response.data[::-1]
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversation history: {str(e)}")


async def create_conversation(supabase: Client, user_id: str, session_id: str) -> Dict[str, Any]:
    """Create a new conversation record in the database.
    
    Args:
        user_id (str): The user ID
        session_id (str): The session ID
        
    Returns:
        Dict[str, Any]: The created conversation record
    
    """
    try:
        response = supabase.table("conversations") \
            .insert({"user_id": user_id, "session_id": session_id}) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create conversation record")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


async def update_conversation_title(supabase: Client, session_id: str, title: str) -> Dict[str, Any]:
    """Update the title of a conversation.
    
    Args:
        session_id (int): The conversation session ID
        title (str): The new title
        
    Returns:
        Dict[str, Any]: The updated conversation record
    
    """
    try:
        response = supabase.table("conversations") \
            .update({"title": title}) \
            .eq("session_id", session_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update conversation title")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update conversation title: {str(e)}")


def generate_session_id(user_id: str) -> str:
    """Generate a unique session ID for a new conversation.
    
    Args:
        user_id (str): The user ID
        
    Returns:
        str: The generated session ID
    
    """
    # Generate a random string of 10 characters
    random_str = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(10))
    return f"{user_id}~{random_str}"


async def generate_conversation_title(title_agent: Agent, query: str) -> str:
    """Generate a title for a conversation based on the first user message.
    
    Args:
        query (str): The first user message
        
    Returns:
        str: The generated title
    
    """
    try:
        prompt = f"Based on the user message below, create a 4-6 word sentence for the conversation description since this is the first message in the description.\n\n{query}"
        result = await title_agent.run(prompt)

        # Extract just the text content from the result
        title = result.data.strip()
        return title
    except Exception as e:
        print(f"Error generating conversation title: {str(e)}")
        return "New Conversation"  # Fallback title


async def store_message(
    supabase: Client,
    session_id: str, 
    message_type: str, 
    content: str, 
    message_data: Optional[bytes] = None, 
    data: Optional[Dict] = None,
    files: Optional[List[Dict[str, str]]] = None
):
    """Store a message in the Supabase messages table.
    
    Args:
        supabase: Supabase client
        session_id: The session ID for the conversation
        message_type: Type of message ('human' or 'ai')
        content: The message content
        message_data: Optional binary data associated with the message
        data: Optional additional data for the message
        files: Optional list of file attachments with fileName, content, and mimeType
    """
    message_obj = {
        "type": message_type,
        "content": content
    }
    if data:
        message_obj["data"] = data
        
    # Add files to the message object if provided
    if files:
        message_obj["files"] = files

    try:
        insert_data = {
            "session_id": session_id,
            "message": message_obj
        }
        
        # Add message_data if provided
        if message_data:
            insert_data["message_data"] = message_data.decode('utf-8')
        
        supabase.table("messages").insert(insert_data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store message: {str(e)}")



async def convert_history_to_pydantic_format(conversation_history):
    """Convert Supabase conversation history to format expected by Pydantic AI.
    Only uses messages with message_data field.
    """
    messages: List[ModelMessage] = []
    
    for msg in conversation_history:
        # Only process messages with message_data
        if msg.get("message_data"):
            try:
                # Parse the message_data JSON and validate it as Pydantic AI messages
                message_data_json = msg["message_data"]
                # Extend our messages list with the validated messages
                messages.extend(ModelMessagesTypeAdapter.validate_json(message_data_json))
            except Exception as e:
                print(f"Error parsing message_data: {str(e)}")
                # Skip this message if there's an error parsing
                continue
    
    return messages


async def check_rate_limit(supabase: Client, user_id: str, rate_limit: int = 5) -> bool:
    """
    Check if the user has exceeded the rate limit.
    
    Args:
        supabase: Supabase client
        user_id: User ID to check
        rate_limit: Maximum number of requests allowed per minute
        
    Returns:
        bool: True if rate limit is not exceeded, False otherwise
    """
    try:
        # Get timestamp for one minute ago
        one_minute_ago = (datetime.now(timezone.utc) - timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S')
        
        # Use count() to efficiently get just the number of requests without fetching all records
        response = supabase.table("requests") \
            .select("*", count="exact") \
            .eq("user_id", user_id) \
            .gte("timestamp", one_minute_ago) \
            .execute()
        
        # Get the count from the response
        request_count = response.count if hasattr(response, 'count') else 0
        
        # Check if the number of requests exceeds the rate limit
        return request_count < rate_limit
    except Exception as e:
        print(f"Error checking rate limit: {str(e)}")
        # In case of error, allow the request to proceed
        return True


async def store_request(supabase: Client, request_id: str, user_id: str, query: str):
    """
    Store a request in the requests table for rate limiting purposes.
    
    Args:
        supabase: Supabase client
        request_id: Unique request ID
        user_id: User ID
        query: User's query
    """
    try:
        supabase.table("requests").insert({
            "id": request_id,
            "user_id": user_id,
            "user_query": query,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f"Error storing request: {str(e)}")


# News Aggregation Functions

async def create_supabase_client() -> AsyncClient:
    """Create async Supabase client for news aggregation operations"""
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required")
        
        return await acreate_client(url, key)
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {str(e)}")
        raise


async def load_source_data() -> Dict[str, List[Dict]]:
    """Load all active sources from Supabase for news aggregation"""
    try:
        supabase = await create_supabase_client()
        
        # Load research topics
        research_topics_response = await supabase.table("research_topics").select("*").eq("is_active", True).order("priority", desc=True).execute()
        
        # Load RSS feeds  
        rss_feeds_response = await supabase.table("rss_feeds").select("*").eq("is_active", True).execute()
        
        # Load YouTube channels
        youtube_channels_response = await supabase.table("youtube_channels").select("*").eq("is_active", True).execute()
        
        await supabase.close()
        
        return {
            "research_topics": research_topics_response.data or [],
            "rss_feeds": rss_feeds_response.data or [],
            "youtube_channels": youtube_channels_response.data or []
        }
    except Exception as e:
        logger.error(f"Failed to load source data: {str(e)}")
        raise


async def insert_news_items_with_deduplication(items: List[Dict], run_date: str) -> List[Dict]:
    """Insert news items with smart deduplication following n8n prototype logic"""
    try:
        supabase = await create_supabase_client()
        
        # Get existing news items for today (like n8n prototype)
        existing_response = await supabase.table("news_items").select("*").eq("run_date", run_date).execute()
        existing_items = existing_response.data or []
        
        inserted_items = []
        
        for item in items:
            # Check for duplicates (same logic as n8n prototype)
            duplicate = find_duplicate(item, existing_items)
            
            if duplicate:
                # Update mention count (like n8n prototype)
                update_response = await supabase.table("news_items").update({
                    "mention_count": duplicate["mention_count"] + 1
                }).eq("id", duplicate["id"]).execute()
                
                if update_response.data:
                    inserted_items.append(update_response.data[0])
                    logger.info(f"Updated mention count for duplicate item: {duplicate['title']}")
            else:
                # Insert new item
                insert_response = await supabase.table("news_items").insert({
                    "run_date": run_date,
                    "title": item["title"],
                    "summary": item["summary"],
                    "relevance_score": item.get("relevance_score", 5),
                    "mention_count": 1,
                    "source_type": item["source_type"],
                    "source_url": item.get("source_url", ""),
                    "source_name": item.get("source_name", ""),
                    "article_url": item.get("article_url", ""),
                    "raw_content": item.get("raw_content", "")
                }).execute()
                
                if insert_response.data:
                    inserted_items.append(insert_response.data[0])
                    existing_items.append(insert_response.data[0])  # Add to existing for future duplicate checks
                    logger.info(f"Inserted new news item: {item['title']}")
        
        await supabase.close()
        return inserted_items
        
    except Exception as e:
        logger.error(f"Failed to insert news items: {str(e)}")
        return []


def find_duplicate(new_item: Dict, existing_items: List[Dict]) -> Dict | None:
    """Find duplicate using n8n prototype logic"""
    for existing in existing_items:
        # Same article URL (highest priority)
        if existing.get("article_url") and new_item.get("article_url"):
            if existing["article_url"] == new_item["article_url"]:
                return existing
        
        # Same title (70%+ similarity)
        if title_similarity(existing["title"], new_item["title"]) > 0.7:
            return existing
    
    return None


def title_similarity(title1: str, title2: str) -> float:
    """Calculate title similarity for deduplication"""
    # Simple word overlap similarity
    words1 = set(title1.lower().split())
    words2 = set(title2.lower().split())
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union) if union else 0


async def get_todays_news_items(run_date: str) -> List[Dict]:
    """Get all news items for a specific date"""
    try:
        supabase = await create_supabase_client()
        response = await supabase.table("news_items").select("*").eq("run_date", run_date).order("relevance_score", desc=True).execute()
        await supabase.close()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to get news items for {run_date}: {str(e)}")
        return []


# News extraction helper functions (to be implemented based on agent analysis)

async def extract_news_from_perplexity_research(research_text: str, run_date: str) -> List[Dict]:
    """Extract structured news items from Perplexity research results"""
    try:
        if not research_text or len(research_text.strip()) < 50:
            return []
        
        # Basic extraction logic - in production, this would use an LLM to structure the data
        # For now, create a single news item from the research
        news_items = []
        
        # Split research by topic sections (indicated by "--- Topic ---")
        sections = research_text.split("---")
        
        for section in sections:
            section = section.strip()
            if len(section) > 100:  # Minimum content length
                # Extract potential title (first line)
                lines = section.split('\n')
                title = lines[0].strip()[:100] + "..." if len(lines[0]) > 100 else lines[0].strip()
                
                if title and len(title) > 10:
                    news_item = {
                        "title": title,
                        "summary": section[:500] + "..." if len(section) > 500 else section,
                        "source_type": "perplexity",
                        "source_url": "",
                        "source_name": "Perplexity Research",
                        "article_url": "",
                        "raw_content": section,
                        "relevance_score": 7  # Default relevance for Perplexity research
                    }
                    news_items.append(news_item)
        
        logger.info(f"Extracted {len(news_items)} news items from Perplexity research")
        return news_items
        
    except Exception as e:
        logger.error(f"Error extracting news from Perplexity research: {str(e)}")
        return []


async def extract_news_from_rss_articles(articles_text: str, run_date: str) -> List[Dict]:
    """Extract structured news items from RSS article analysis"""
    try:
        if not articles_text or len(articles_text.strip()) < 50:
            return []
        
        news_items = []
        
        # Split by feed sections (indicated by "--- Feed Name ---")
        sections = articles_text.split("---")
        
        for section in sections:
            section = section.strip()
            if len(section) > 100:  # Minimum content length
                # Extract potential title (first line)
                lines = section.split('\n')
                title = lines[0].strip()[:100] + "..." if len(lines[0]) > 100 else lines[0].strip()
                
                if title and len(title) > 10:
                    news_item = {
                        "title": title,
                        "summary": section[:500] + "..." if len(section) > 500 else section,
                        "source_type": "rss",
                        "source_url": "",
                        "source_name": "RSS Feed Analysis",
                        "article_url": "",
                        "raw_content": section,
                        "relevance_score": 6  # Default relevance for RSS articles
                    }
                    news_items.append(news_item)
        
        logger.info(f"Extracted {len(news_items)} news items from RSS articles")
        return news_items
        
    except Exception as e:
        logger.error(f"Error extracting news from RSS articles: {str(e)}")
        return []


async def extract_news_from_youtube_transcripts(transcripts_text: str, run_date: str) -> List[Dict]:
    """Extract structured news items from YouTube transcript analysis"""
    try:
        if not transcripts_text or len(transcripts_text.strip()) < 50:
            return []
        
        news_items = []
        
        # Split by channel sections (indicated by "--- Channel Name ---")
        sections = transcripts_text.split("---")
        
        for section in sections:
            section = section.strip()
            if len(section) > 100:  # Minimum content length
                # Extract potential title (first line)  
                lines = section.split('\n')
                title = lines[0].strip()[:100] + "..." if len(lines[0]) > 100 else lines[0].strip()
                
                if title and len(title) > 10:
                    news_item = {
                        "title": title,
                        "summary": section[:500] + "..." if len(section) > 500 else section,
                        "source_type": "youtube",
                        "source_url": "",
                        "source_name": "YouTube Channel Analysis",
                        "article_url": "",
                        "raw_content": section,
                        "relevance_score": 6  # Default relevance for YouTube content
                    }
                    news_items.append(news_item)
        
        logger.info(f"Extracted {len(news_items)} news items from YouTube transcripts")
        return news_items
        
    except Exception as e:
        logger.error(f"Error extracting news from YouTube transcripts: {str(e)}")
        return []

