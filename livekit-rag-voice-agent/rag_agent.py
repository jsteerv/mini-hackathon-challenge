"""
RAG Voice Agent with PostgreSQL/PGVector
=========================================
Voice AI agent that searches through knowledge base using semantic similarity
"""

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    NOT_GIVEN,
    Agent,
    AgentFalseInterruptionEvent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    ModelSettings,
    RoomInputOptions,
    RoomOutputOptions,
    RunContext,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents.llm import function_tool
from livekit.plugins import openai, deepgram, silero, turn_detector
import asyncpg
import json
import os
from typing import List, Dict, Any
import logging
import numpy as np

# Load environment variables
load_dotenv(".env")

logger = logging.getLogger(__name__)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

class RAGKnowledgeAgent(Agent):
    """Voice AI agent with RAG knowledge base access."""
    
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are an intelligent knowledge assistant with access to an organization's documentation and information.
            Your role is to help users find accurate information from the knowledge base.
            You have a professional yet friendly demeanor.
            Always search the knowledge base before answering questions.
            If information isn't in the knowledge base, clearly state that and offer general guidance.
            Be concise but thorough in your responses.
            Ask clarifying questions if the user's query is ambiguous.
            When you find relevant information, synthesize it clearly and cite the source documents."""
        )
        self.db_pool = None
        self.search_history = []
        
    async def initialize_db(self):
        """Initialize database connection pool."""
        if not self.db_pool:
            self.db_pool = await asyncpg.create_pool(
                os.getenv("DATABASE_URL"),
                min_size=2,
                max_size=10,
                command_timeout=60
            )
    
    @function_tool
    async def search_knowledge_base(
        self, 
        context: RunContext, 
        query: str,
        limit: int = 5
    ) -> str:
        """
        Search the knowledge base using semantic similarity.
        
        Args:
            query: The search query to find relevant information
            limit: Maximum number of results to return (default: 5)
        """
        try:
            # Ensure database is initialized
            if not self.db_pool:
                await self.initialize_db()
            
            # Generate embedding for query
            from ingestion.embedder import create_embedder
            embedder = create_embedder()
            query_embedding = await embedder.embed_query(query)
            
            # Convert to PostgreSQL vector format
            embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
            
            # Search using match_chunks function
            async with self.db_pool.acquire() as conn:
                results = await conn.fetch(
                    """
                    SELECT * FROM match_chunks($1::vector, $2)
                    """,
                    embedding_str,
                    limit
                )

            # Format results for response
            if not results:
                return "No relevant information found in the knowledge base for your query."
            
            # Build response with sources
            response_parts = []
            for i, row in enumerate(results, 1):
                similarity = row['similarity']
                content = row['content']
                doc_title = row['document_title']
                doc_source = row['document_source']
                
                response_parts.append(
                    f"[Source: {doc_title}]\n{content}\n"
                )
            
            if not response_parts:
                return "Found some results but they may not be directly relevant to your query. Please try rephrasing your question."
            
            # Track search history
            self.search_history.append({
                "query": query,
                "results_count": len(response_parts),
                "top_similarity": results[0]['similarity'] if results else 0
            })
            
            return f"Found {len(response_parts)} relevant results:\n\n" + "\n---\n".join(response_parts)
            
        except Exception as e:
            logger.error(f"Knowledge base search failed: {e}")
            return f"I encountered an error searching the knowledge base. Please try again or rephrase your question."
    
    async def on_enter(self) -> None:
        """Called when the agent becomes active."""
        # Initialize database connection
        await self.initialize_db()
        
        # Generate greeting
        await self.session.generate_reply(
            instructions="""Greet the user warmly and let them know you can help them:
            - Search through the organization's knowledge base
            - Answer questions about documented topics
            - Find specific information from internal documents
            Keep it brief, natural, and professional."""
        )
    
    async def on_exit(self) -> None:
        """Called when agent is being replaced or session ends."""
        # Close database pool
        if self.db_pool:
            await self.db_pool.close()
        
        # Farewell message
        await self.session.say("Thank you for using the knowledge assistant. Have a great day!")


async def entrypoint(ctx: agents.JobContext):
    """Main entry point for the agent worker."""
    
    # Configure voice pipeline with recommended settings
    session = AgentSession(
        # Speech-to-Text - Deepgram Nova-2 (Nova-3 not available in SDK yet)
        stt=deepgram.STT(
            model="nova-2",
            language="en",
        ),
        
        # LLM - GPT-4o-mini for fast RAG responses
        llm=openai.LLM(
            model="gpt-4.1-mini",
            temperature=0.3,  # Lower for factual responses
        ),
        
        # Text-to-Speech - OpenAI echo voice
        tts=openai.TTS(
            voice="echo",
            speed=1.0,
        ),
        
        # Voice Activity Detection
        vad=silero.VAD.load(),
        
        # Turn detection - semantic for natural flow
        turn_detection=MultilingualModel(),
    )
    
    # Start session with RAG agent
    await session.start(
        room=ctx.room,
        agent=RAGKnowledgeAgent(),
    )
    
    # Logging
    logger.info(f"RAG Voice Agent started in room: {ctx.room.name}")
    
    # Event handlers
    @session.on("agent_state_changed")
    def on_state_changed(ev):
        logger.info(f"Agent state: {ev.old_state} -> {ev.new_state}")


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the agent
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))