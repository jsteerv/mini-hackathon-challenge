from typing import TypedDict, List, Optional, Annotated, Dict
from pydantic_ai.messages import ModelMessage
import operator

class NewsAggregationState(TypedDict, total=False):
    """LangGraph state for news aggregation workflow"""
    # Input
    query: str
    session_id: str  
    request_id: str
    run_date: str  # For database storage
    
    # Database source data
    research_topics: List[Dict]  # From research_topics table
    rss_feeds: List[Dict]  # From rss_feeds table  
    youtube_channels: List[Dict]  # From youtube_channels table
    
    # Parallel research outputs - using operator.add for state merging
    perplexity_research: str
    rss_articles: str
    youtube_transcripts: str
    research_completed: Annotated[List[str], operator.add]
    
    # News items for database storage
    news_items_to_store: Annotated[List[Dict], operator.add]
    
    # Synthesis output
    synthesis_complete: bool
    top_news_items: List[Dict]  # Top 5-10 relevant news
    
    # Final response
    final_response: str
    
    # Message history management (Pydantic AI compatibility)
    pydantic_message_history: List[ModelMessage]
    message_history: List[bytes]  # Only populated by synthesis agent
    
    # API context
    conversation_title: Optional[str]
    is_new_conversation: Optional[bool]

# Legacy aliases for backwards compatibility
ParallelAgentState = NewsAggregationState
SequentialAgentState = NewsAggregationState