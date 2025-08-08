"""
Parallel Agent Workflow for Research and Synthesis System.

This module implements a LangGraph workflow that routes requests through a guardrail agent,
then executes 3 parallel research agents (SEO, Social, Competitor) simultaneously,
followed by a synthesis agent that combines all findings into an email draft.
"""

from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

from graph.state import NewsAggregationState, ParallelAgentState
from agents.guardrail_agent import guardrail_agent
from agents.seo_research_agent import seo_research_agent
from agents.social_research_agent import social_research_agent
from agents.competitor_research_agent import competitor_research_agent
from agents.synthesis_agent import synthesis_agent, news_synthesis_agent
from agents.fallback_agent import fallback_agent
from agents.deps import (
    create_guardrail_deps,
    create_research_deps,
    create_news_research_deps
)
from pydantic_ai.messages import ModelMessage
from pydantic_ai import Agent
from pydantic_ai.messages import PartDeltaEvent, PartStartEvent, TextPartDelta

load_dotenv()


async def guardrail_node(state: ParallelAgentState, writer) -> dict:
    """Guardrail node that determines if request is for research/outreach or conversation"""
    try:
        deps = create_guardrail_deps(session_id=state.get("session_id"))
        
        # Get structured routing decision with message history
        message_history = state.get("pydantic_message_history", [])
        result = await guardrail_agent.run(state["query"], deps=deps, message_history=message_history)
        decision = result.data.is_research_request
        reasoning = result.data.reasoning
        
        # Stream routing feedback to user
        if decision:
            writer("🔬 Detected research request. Starting parallel research workflow...\n\n")
        else:
            writer("💬 Routing to conversation mode...\n\n")
        
        return {
            "is_research_request": decision,
            "routing_reason": reasoning
        }
        
    except Exception as e:
        print(f"Error in guardrail: {e}")
        writer("⚠️ Guardrail failed, defaulting to conversation mode\n\n")
        return {
            "is_research_request": False,
            "routing_reason": f"Guardrail error: {str(e)}"
        }


async def seo_research_node(state: ParallelAgentState, writer) -> dict:
    """SEO research agent with streaming using .iter() pattern"""
    try:
        # Agent separator with hardcoded start message
        writer("\n\n### 🔍 SEO Research Agent Starting...\n")
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        agent_input = state["query"]
        message_history = state.get("pydantic_message_history", [])

        run = await seo_research_agent.run(agent_input, deps=deps, message_history=message_history)
        full_response = str(run.data) if run.data else "No response generated"

        return {
            "seo_research": [full_response],
            "research_completed": ["seo"]
        }
        
    except Exception as e:
        error_msg = f"SEO Research error: {str(e)}"
        writer(error_msg)
        return {
            "seo_research": [error_msg],
            "research_completed": ["seo_error"]
        }


async def social_research_node(state: ParallelAgentState, writer) -> dict:
    """Social Media research agent with streaming using .iter() pattern"""
    try:
        # Agent separator with hardcoded start message
        writer("\n\n### 📱 Social Media Research Agent Starting...\n")
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        agent_input = state["query"]
        message_history = state.get("pydantic_message_history", [])
        
        run = await social_research_agent.run(agent_input, deps=deps, message_history=message_history)
        full_response = str(run.data) if run.data else "No response generated"
            
        return {
            "social_research": [full_response],
            "research_completed": ["social"]
        }
        
    except Exception as e:
        error_msg = f"Social Research error: {str(e)}"
        writer(error_msg)
        return {
            "social_research": [error_msg],
            "research_completed": ["social_error"]
        }


async def competitor_research_node(state: ParallelAgentState, writer) -> dict:
    """Competitor research agent with streaming using .iter() pattern"""
    try:
        # Agent separator with hardcoded start message
        writer("\n\n### 🏢 Competitor Research Agent Starting...\n")
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        agent_input = state["query"]
        message_history = state.get("pydantic_message_history", [])
            
        run = await competitor_research_agent.run(agent_input, deps=deps, message_history=message_history)
        full_response = str(run.data) if run.data else "No response generated"
        
        return {
            "competitor_research": [full_response],
            "research_completed": ["competitor"]
        }
        
    except Exception as e:
        error_msg = f"Competitor Research error: {str(e)}"
        writer(error_msg)
        return {
            "competitor_research": [error_msg],
            "research_completed": ["competitor_error"]
        }


async def synthesis_node(state: ParallelAgentState, writer) -> dict:
    """Synthesis agent that combines all research and creates comprehensive summary"""
    try:
        # Agent separator with hardcoded start message
        writer("\n\n### 📝 Synthesis Agent Starting...\n")
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        
        # Combine all research data
        seo_data = ' '.join(state.get("seo_research", []))
        social_data = ' '.join(state.get("social_research", []))
        competitor_data = ' '.join(state.get("competitor_research", []))
        
        # Construct comprehensive synthesis prompt
        synthesis_prompt = f"""
        Create a comprehensive research synthesis based on parallel research findings:
        
        Original Request: {state["query"]}
        
        SEO Research Findings:
        {seo_data}
        
        Social Media Research Findings:
        {social_data}
        
        Competitor Research Findings:
        {competitor_data}
        
        Please synthesize all research findings and create a comprehensive analysis that:
        1. Integrates insights from all three research streams into a coherent narrative
        2. Highlights key patterns and connections across different data sources
        3. Provides strategic insights and actionable intelligence
        4. Identifies strengths, weaknesses, opportunities, and threats
        5. Delivers clear, data-backed conclusions
        
        Structure your synthesis with clear sections and actionable insights.
        """
        
        message_history = state.get("pydantic_message_history", [])
        full_response = ""
        
        try:
            # Use .iter() for streaming with message history
            async with synthesis_agent.iter(synthesis_prompt, deps=deps, message_history=message_history) as run:
                async for node in run:
                    if Agent.is_model_request_node(node):
                        # Stream tokens from the model's request
                        async with node.stream(run.ctx) as request_stream:
                            async for event in request_stream:
                                if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                    writer(event.part.content)
                                    full_response += event.part.content
                                elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                    delta = event.delta.content_delta
                                    writer(delta)
                                    full_response += delta
            
            # Capture new messages for conversation history
            new_messages = run.result.new_messages_json()
                
        except Exception as stream_error:
            print(f"Synthesis streaming failed, using fallback: {stream_error}")
            writer("\n[Streaming unavailable, generating response...]\n")
            
            run = await synthesis_agent.run(synthesis_prompt, deps=deps, message_history=message_history)
            full_response = str(run.data) if run.data else "No response generated"
            writer(full_response)
            
            # Capture new messages from fallback run
            new_messages = run.new_messages_json()
        
        # Notify user about synthesis completion
        writer("\n\n### ✅ Research synthesis completed.")
        
        return {
            "final_response": full_response,
            "synthesis_complete": True,
            "message_history": [new_messages]  # THIS agent updates history
        }
        
    except Exception as e:
        error_msg = f"Synthesis error: {str(e)}"
        writer(error_msg)
        return {
            "final_response": error_msg,
            "synthesis_complete": False,
            "message_history": []
        }


async def fallback_node(state: ParallelAgentState, writer) -> dict:
    """Fallback node for normal conversation"""
    try:
        # Agent separator
        writer("\n\n💬 Conversation Agent Starting...\n\n")
        
        deps = create_guardrail_deps(session_id=state.get("session_id"))
        agent_input = state["query"]
        message_history = state.get("pydantic_message_history", [])
        full_response = ""
        
        try:
            # Use .iter() for streaming with message history
            async with fallback_agent.iter(agent_input, deps=deps, message_history=message_history) as run:
                async for node in run:
                    if Agent.is_model_request_node(node):
                        # Stream tokens from the model's request
                        async with node.stream(run.ctx) as request_stream:
                            async for event in request_stream:
                                if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                    writer(event.part.content)
                                    full_response += event.part.content
                                elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                    delta = event.delta.content_delta
                                    writer(delta)
                                    full_response += delta
            
            # CRITICAL: Capture new messages for conversation history
            new_messages = run.result.new_messages_json()
                
        except Exception as stream_error:
            print(f"Fallback streaming failed, using fallback: {stream_error}")
            writer("\n[Streaming unavailable, generating response...]\n")
            
            run = await fallback_agent.run(agent_input, deps=deps, message_history=message_history)
            full_response = str(run.data) if run.data else "No response generated"
            writer(full_response)
            
            # Capture new messages from fallback run
            new_messages = run.new_messages_json()
        
        return {
            "final_response": full_response,
            "message_history": [new_messages]  # THIS agent updates history
        }
        
    except Exception as e:
        error_msg = f"Fallback error: {str(e)}"
        writer(error_msg)
        return {
            "final_response": error_msg,
            "message_history": []
        }


def route_after_guardrail(state: ParallelAgentState):
    """Conditional routing based on guardrail decision"""
    if state.get("is_research_request", False):
        return ["seo_research_node", "social_research_node", "competitor_research_node"]
    else:
        return "fallback_node"


def create_workflow():
    """Create and configure the parallel agent workflow with fan-out/fan-in pattern"""
    
    # Create state graph
    builder = StateGraph(ParallelAgentState)
    
    # Add all nodes
    builder.add_node("guardrail_node", guardrail_node)
    builder.add_node("seo_research_node", seo_research_node)
    builder.add_node("social_research_node", social_research_node)
    builder.add_node("competitor_research_node", competitor_research_node)
    builder.add_node("synthesis_node", synthesis_node)
    builder.add_node("fallback_node", fallback_node)
    
    # Set entry point
    builder.add_edge(START, "guardrail_node")
    
    # Add conditional routing after guardrail for parallel execution
    builder.add_conditional_edges(
        "guardrail_node",
        route_after_guardrail,
        ["seo_research_node", "social_research_node", "competitor_research_node", "fallback_node"]
    )
    
    # Parallel research nodes all feed into synthesis (fan-in)
    builder.add_edge("seo_research_node", "synthesis_node")
    builder.add_edge("social_research_node", "synthesis_node")
    builder.add_edge("competitor_research_node", "synthesis_node")
    
    # End nodes
    builder.add_edge("synthesis_node", END)
    builder.add_edge("fallback_node", END)
    
    # Compile the graph
    return builder.compile()


# Create the workflow instance
workflow = create_workflow()

# News Aggregation Node Functions
async def load_sources_node(state: NewsAggregationState, writer) -> dict:
    """Load all source data from Supabase at workflow start"""
    writer("📊 Loading source data from database...\n")
    
    # Import here to avoid circular imports
    from api.db_utils import load_source_data
    
    try:
        source_data = await load_source_data()
        writer(f"✅ Loaded {len(source_data['research_topics'])} research topics, "
               f"{len(source_data['rss_feeds'])} RSS feeds, "
               f"{len(source_data['youtube_channels'])} YouTube channels\n")
        return source_data
    except Exception as e:
        writer(f"❌ Failed to load source data: {str(e)}\n")
        return {
            "research_topics": [],
            "rss_feeds": [],
            "youtube_channels": []
        }

async def perplexity_research_node(state: NewsAggregationState, writer) -> dict:
    """Perplexity web research agent"""
    writer("\n\n### 🔬 Perplexity Research Agent Starting...\n")
    
    try:
        # Import agent here to avoid circular imports during initial setup
        from agents.perplexity_agent import perplexity_agent
        from agents.deps import create_research_deps
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        research_topics = state.get("research_topics", [])
        
        all_research = ""
        for topic in research_topics[:3]:  # Limit to top 3 topics
            query = f"{topic['topic']} latest AI news developments"
            run = await perplexity_agent.run(query, deps=deps, message_history=state.get("pydantic_message_history", []))
            result = str(run.data) if run.data else ""
            all_research += f"\n--- {topic['topic']} ---\n{result}\n"
        
        return {
            "perplexity_research": all_research,
            "research_completed": ["perplexity"]
        }
    except Exception as e:
        error_msg = f"Perplexity Research error: {str(e)}"
        writer(error_msg)
        return {
            "perplexity_research": error_msg,
            "research_completed": ["perplexity_error"]
        }

async def rss_extraction_node(state: NewsAggregationState, writer) -> dict:
    """RSS feed extraction agent"""
    writer("\n\n### 📰 RSS Extraction Agent Starting...\n")
    
    try:
        # Import agent here to avoid circular imports during initial setup
        from agents.rss_agent import rss_agent
        from agents.deps import create_research_deps
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        rss_feeds = state.get("rss_feeds", [])
        
        all_articles = ""
        for feed in rss_feeds[:5]:  # Limit to 5 feeds
            run = await rss_agent.run(f"Extract and analyze recent AI news articles from {feed['name']}: {feed['url']}", 
                                    deps=deps, message_history=state.get("pydantic_message_history", []))
            result = str(run.data) if run.data else ""
            all_articles += f"\n--- {feed['name']} ---\n{result}\n"
        
        return {
            "rss_articles": all_articles,
            "research_completed": ["rss"]
        }
    except Exception as e:
        error_msg = f"RSS Extraction error: {str(e)}"
        writer(error_msg)
        return {
            "rss_articles": error_msg,
            "research_completed": ["rss_error"]
        }

async def youtube_transcripts_node(state: NewsAggregationState, writer) -> dict:
    """YouTube transcript extraction agent"""
    writer("\n\n### 📺 YouTube Transcript Agent Starting...\n")
    
    try:
        # Import agent here to avoid circular imports during initial setup
        from agents.youtube_agent import youtube_agent
        from agents.deps import create_research_deps
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        youtube_channels = state.get("youtube_channels", [])
        
        all_transcripts = ""
        for channel in youtube_channels[:3]:  # Limit to 3 channels
            run = await youtube_agent.run(f"Analyze recent AI news from YouTube channel {channel['channel_name']}: {channel['channel_url']}", 
                                        deps=deps, message_history=state.get("pydantic_message_history", []))
            result = str(run.data) if run.data else ""
            all_transcripts += f"\n--- {channel['channel_name']} ---\n{result}\n"
        
        return {
            "youtube_transcripts": all_transcripts,
            "research_completed": ["youtube"]
        }
    except Exception as e:
        error_msg = f"YouTube Transcripts error: {str(e)}"
        writer(error_msg)
        return {
            "youtube_transcripts": error_msg,
            "research_completed": ["youtube_error"]
        }

# Database insert nodes
async def perplexity_insert_node(state: NewsAggregationState, writer) -> dict:
    """Insert Perplexity research results into database"""
    writer("\n\n### 💾 Perplexity Database Insert Agent Starting...\n")
    
    try:
        from api.db_utils import insert_news_items_with_deduplication, extract_news_from_perplexity_research
        
        research_result = state.get("perplexity_research", "")
        if not research_result:
            return {"research_completed": ["perplexity_insert"]}
        
        news_items = await extract_news_from_perplexity_research(research_result, state.get("run_date"))
        if news_items:
            inserted = await insert_news_items_with_deduplication(news_items, state.get("run_date"))
            writer(f"📝 Inserted/updated {len(inserted)} news items from Perplexity research\n")
        
        return {"research_completed": ["perplexity_insert"]}
    except Exception as e:
        writer(f"❌ Perplexity insert error: {str(e)}\n")
        return {"research_completed": ["perplexity_insert_error"]}

async def rss_insert_node(state: NewsAggregationState, writer) -> dict:
    """Insert RSS extraction results into database"""
    writer("\n\n### 💾 RSS Database Insert Agent Starting...\n")
    
    try:
        from api.db_utils import insert_news_items_with_deduplication, extract_news_from_rss_articles
        
        rss_result = state.get("rss_articles", "")
        if not rss_result:
            return {"research_completed": ["rss_insert"]}
        
        news_items = await extract_news_from_rss_articles(rss_result, state.get("run_date"))
        if news_items:
            inserted = await insert_news_items_with_deduplication(news_items, state.get("run_date"))
            writer(f"📝 Inserted/updated {len(inserted)} news items from RSS feeds\n")
        
        return {"research_completed": ["rss_insert"]}
    except Exception as e:
        writer(f"❌ RSS insert error: {str(e)}\n")
        return {"research_completed": ["rss_insert_error"]}

async def youtube_insert_node(state: NewsAggregationState, writer) -> dict:
    """Insert YouTube transcript results into database"""
    writer("\n\n### 💾 YouTube Database Insert Agent Starting...\n")
    
    try:
        from api.db_utils import insert_news_items_with_deduplication, extract_news_from_youtube_transcripts
        
        youtube_result = state.get("youtube_transcripts", "")
        if not youtube_result:
            return {"research_completed": ["youtube_insert"]}
        
        news_items = await extract_news_from_youtube_transcripts(youtube_result, state.get("run_date"))
        if news_items:
            inserted = await insert_news_items_with_deduplication(news_items, state.get("run_date"))
            writer(f"📝 Inserted/updated {len(inserted)} news items from YouTube transcripts\n")
        
        return {"research_completed": ["youtube_insert"]}
    except Exception as e:
        writer(f"❌ YouTube insert error: {str(e)}\n")
        return {"research_completed": ["youtube_insert_error"]}

async def news_synthesis_node(state: NewsAggregationState, writer) -> dict:
    """News synthesis agent that analyzes all collected news and selects top items"""
    try:
        writer("\n\n### 📝 News Synthesis Agent Starting...\n")
        
        from agents.deps import create_news_research_deps
        
        deps = create_news_research_deps(session_id=state.get("session_id"))
        
        # Get all research data
        perplexity_data = state.get("perplexity_research", "")
        rss_data = state.get("rss_articles", "")
        youtube_data = state.get("youtube_transcripts", "")
        run_date = state.get("run_date", "")
        query = state.get("query", "AI news aggregation")
        
        # Get database items summary
        from api.db_utils import get_todays_news_items
        try:
            db_items = await get_todays_news_items(run_date)
            db_summary = f"Found {len(db_items)} news items in database"
        except Exception as e:
            db_items = []
            db_summary = f"Database query failed: {str(e)}"
        
        writer(f"🔍 Analyzing news from all sources ({len([d for d in [perplexity_data, rss_data, youtube_data] if d])} sources active)\n")
        writer(f"📊 Database status: {db_summary}\n")
        
        # Run news synthesis
        message_history = state.get("pydantic_message_history", [])
        full_response = ""
        
        try:
            # Create synthesis prompt combining all data
            synthesis_prompt = f"""
            Analyze and synthesize AI news from multiple sources collected on {run_date}:
            
            Original Query: {query}
            
            Perplexity Research Results:
            {perplexity_data[:1000] + "..." if len(perplexity_data) > 1000 else perplexity_data}
            
            RSS Articles Analysis:
            {rss_data[:1000] + "..." if len(rss_data) > 1000 else rss_data}
            
            YouTube Transcript Analysis:
            {youtube_data[:1000] + "..." if len(youtube_data) > 1000 else youtube_data}
            
            Database Summary: {db_summary}
            
            Please provide:
            1. Executive Summary: Top 3 most important AI developments today
            2. Key News Items: Select and describe 5-7 most relevant stories
            3. Trends Identified: Major patterns or themes across sources
            4. Market Impact: Business implications of today's news
            5. Technical Developments: Research or technical breakthroughs mentioned
            
            Focus on delivering high-quality, actionable AI news intelligence.
            """
            
            # Use streaming synthesis
            async with news_synthesis_agent.iter(synthesis_prompt, deps=deps, message_history=message_history) as run:
                async for node in run:
                    if Agent.is_model_request_node(node):
                        async with node.stream(run.ctx) as request_stream:
                            async for event in request_stream:
                                if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                    writer(event.part.content)
                                    full_response += event.part.content
                                elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                    delta = event.delta.content_delta
                                    writer(delta)
                                    full_response += delta
            
            new_messages = run.result.new_messages_json()
                
        except Exception as stream_error:
            writer("\n[Streaming unavailable, generating response...]\n")
            
            run = await news_synthesis_agent.run(synthesis_prompt, deps=deps, message_history=message_history)
            full_response = str(run.data) if run.data else "No synthesis generated"
            writer(full_response)
            
            new_messages = run.new_messages_json()
        
        # Select top news items based on synthesis (simplified)
        top_news_items = []
        if db_items:
            # Sort by relevance score and take top 10
            sorted_items = sorted(db_items, key=lambda x: x.get('relevance_score', 0), reverse=True)
            top_news_items = sorted_items[:10]
        
        writer(f"\n\n### ✅ News synthesis completed - selected {len(top_news_items)} top news items.")
        
        return {
            "final_response": full_response,
            "synthesis_complete": True,
            "top_news_items": top_news_items,
            "message_history": [new_messages]
        }
        
    except Exception as e:
        error_msg = f"News synthesis error: {str(e)}"
        writer(error_msg)
        return {
            "final_response": error_msg,
            "synthesis_complete": False,
            "top_news_items": [],
            "message_history": []
        }

def create_news_aggregation_graph():
    """Create and configure the news aggregation workflow with fan-out/fan-in pattern"""
    
    workflow = StateGraph(NewsAggregationState)
    
    # Add data loading node
    workflow.add_node("load_sources", load_sources_node)
    
    # Add parallel research nodes (3 research + 3 database insert)
    workflow.add_node("perplexity_research", perplexity_research_node)
    workflow.add_node("perplexity_insert", perplexity_insert_node)
    
    workflow.add_node("rss_extraction", rss_extraction_node)
    workflow.add_node("rss_insert", rss_insert_node)
    
    workflow.add_node("youtube_transcripts", youtube_transcripts_node)
    workflow.add_node("youtube_insert", youtube_insert_node)
    
    # Add news synthesis node  
    workflow.add_node("synthesis", news_synthesis_node)
    
    # Data loading first
    workflow.add_edge(START, "load_sources")
    
    # Fan-out to parallel research agents
    workflow.add_edge("load_sources", "perplexity_research")
    workflow.add_edge("load_sources", "rss_extraction")
    workflow.add_edge("load_sources", "youtube_transcripts")
    
    # Sequential: research → database insert
    workflow.add_edge("perplexity_research", "perplexity_insert")
    workflow.add_edge("rss_extraction", "rss_insert")
    workflow.add_edge("youtube_transcripts", "youtube_insert")
    
    # Fan-in to synthesis after all database inserts complete
    workflow.add_edge("perplexity_insert", "synthesis")
    workflow.add_edge("rss_insert", "synthesis")
    workflow.add_edge("youtube_insert", "synthesis")
    
    workflow.add_edge("synthesis", END)
    
    return workflow.compile()

def create_news_api_initial_state(
    query: str,
    session_id: str,
    request_id: str,
    run_date: str,
    pydantic_message_history: Optional[List[ModelMessage]] = None
) -> NewsAggregationState:
    """Create initial state for news aggregation workflow"""
    return {
        "query": query,
        "session_id": session_id,
        "request_id": request_id,
        "run_date": run_date,
        "research_topics": [],
        "rss_feeds": [],
        "youtube_channels": [],
        "perplexity_research": "",
        "rss_articles": "",
        "youtube_transcripts": "",
        "research_completed": [],
        "news_items_to_store": [],
        "synthesis_complete": False,
        "top_news_items": [],
        "final_response": "",
        "pydantic_message_history": pydantic_message_history or [],
        "message_history": [],
        "conversation_title": None,
        "is_new_conversation": False
    }


def create_api_initial_state(
    query: str,
    session_id: str,
    request_id: str,
    pydantic_message_history: Optional[List[ModelMessage]] = None
) -> ParallelAgentState:
    """Create initial state for API mode with parallel agent support"""
    return {
        "query": query,
        "session_id": session_id,
        "request_id": request_id,
        "is_research_request": False,
        "routing_reason": "",
        "seo_research": [],
        "social_research": [],
        "competitor_research": [],
        "research_completed": [],
        "synthesis_complete": False,
        "final_response": "",
        "pydantic_message_history": pydantic_message_history or [],
        "message_history": [],
        "conversation_title": None,
        "is_new_conversation": False
    }


def extract_api_response_data(state: ParallelAgentState) -> Dict[str, Any]:
    """Extract response data for API return"""
    return {
        "session_id": state.get("session_id"),
        "request_id": state.get("request_id"),
        "query": state["query"],
        "response": state.get("final_response", ""),
        "is_research_request": state.get("is_research_request", False),
        "routing_reason": state.get("routing_reason", ""),
        "seo_research": ' '.join(state.get("seo_research", [])),
        "social_research": ' '.join(state.get("social_research", [])),
        "competitor_research": ' '.join(state.get("competitor_research", [])),
        "synthesis_complete": state.get("synthesis_complete", False),
        "conversation_title": state.get("conversation_title"),
        "is_new_conversation": state.get("is_new_conversation", False)
    }