# LiveKit RAG Voice Agent

A LiveKit-powered intelligent voice AI agent that provides conversational access to a knowledge base stored in PostgreSQL with PGVector. Uses RAG to search through embedded documents and provide contextual, accurate responses with source citations.

## Example Implementation Using PRP Framework

This is a complete agent built using the [LiveKit Agents template PRP (Product Requirements Prompt)](https://github.com/dynamous-community/context-engineering-hub/tree/main/prp-templates/livekit-agents) from the Dynamous Context Engineering Hub. It demonstrates the full three-step process:
1. Starting with requirements in `PRPs/INITIAL.md`
2. Generating a comprehensive PRP using the `.claude/commands/generate-livekit-prp` slash command
3. Executing the PRP with the `.claude/commands/execute-livekit-prp` slash command to build the complete agent

You can use this as both:
- **A reference implementation** for building RAG voice agents with LiveKit
- **An example of the PRP framework** showing how to go from idea to working agent using the Context Engineering Hub templates

## Features

- 🎤 Natural voice conversations with low latency
- 🔍 Semantic search through vector-embedded documents
- 📚 Context-aware responses using RAG pipeline
- 🎯 Source citation for all information provided
- 🔄 Real-time voice interaction with interruption handling
- 💾 PostgreSQL/PGVector for scalable knowledge storage

## Prerequisites

- Python 3.9 or later
- PostgreSQL with PGVector extension (Supabase, Neon, self-hosted Postgres, etc.)
- API Keys:
  - OpenAI API key
  - Deepgram API key
  - LiveKit credentials (optional - only if deploying to LiveKit)

## Quick Start

### 1. Install Dependencies

```bash
# Install dependencies using UV
uv sync
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string (Supabase, Neon, self-hosted, etc.)
- `OPENAI_API_KEY` - OpenAI API key
- `DEEPGRAM_API_KEY` - Deepgram API key

Optional for LiveKit deployment:
- `LIVEKIT_URL` - LiveKit server URL
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret

### 3. Configure Database

You must set up your PostgreSQL database with the PGVector extension and create the required schema:

1. **Enable PGVector extension** in your database (most cloud providers have this pre-installed)
2. **Run the schema file** to create tables and functions:
   ```bash
   # Using psql
   psql $DATABASE_URL < sql/schema.sql
   
   # Or connect to your database and run the SQL directly
   ```
   
The schema file (`sql/schema.sql`) creates:
- `documents` table for storing original documents
- `chunks` table for text chunks with embeddings
- `match_chunks()` function for vector similarity search

### 4. Ingest Documents

```bash
# Add documents to the documents/ folder, then run:
uv run python -m ingestion.ingest --documents documents/
```

### 5. Run the Agent

```bash
# Console mode (for testing)
uv run python rag_agent.py console

# Development mode (connects to LiveKit - optional)
uv run python rag_agent.py dev

# Production mode
uv run python rag_agent.py
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   LiveKit   │────▶│  RAG Agent   │───▶│ PostgreSQL │
│   Client    │     │              │     │  PGVector   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼────┐  ┌────▼─────┐
              │ Deepgram │  │  OpenAI  │
              │   STT    │  │ LLM/TTS  │
              └──────────┘  └──────────┘
```

## Voice Pipeline Configuration

- **STT**: Deepgram Nova-2 (highest accuracy)
- **LLM**: OpenAI GPT-4.1-mini (fast, cost-effective)
- **TTS**: OpenAI Echo voice (natural, versatile)
- **VAD**: Silero VAD (reliable voice detection)
- **Turn Detection**: Semantic model (natural conversation flow)

## Key Components

### RAGKnowledgeAgent

The main agent class that:
- Manages database connections
- Handles voice interactions
- Performs knowledge base searches
- Tracks conversation history

### search_knowledge_base Tool

Function tool that:
- Generates query embeddings
- Searches using PGVector
- Dynamically filters results based on relevance
- Formats results with source citation

### Database Schema

- `documents`: Stores original documents with metadata
- `chunks`: Stores text chunks with embeddings
- `match_chunks()`: PostgreSQL function for vector search

## Performance Optimization

### Database Connection Pooling
```python
self.db_pool = await asyncpg.create_pool(
    DATABASE_URL,
    min_size=2,
    max_size=10,
    command_timeout=60
)
```

### Embedding Cache
The embedder includes built-in caching for frequently searched queries.

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Ingest documents
docker-compose --profile ingestion up ingestion

# View logs
docker-compose logs -f rag-agent
```

### Building for Production

```bash
# Build the Docker image
docker build -f Dockerfile.rag -t rag-voice-agent .

# Run with environment variables
docker run --env-file .env rag-voice-agent
```

## Testing

### Run Unit Tests

```bash
uv run pytest tests/test_rag_agent.py -v
```

### Run Behavioral Tests

```bash
uv run pytest tests/test_behaviors.py -v
```

### Run All Tests

```bash
uv run pytest tests/ -v
```

## Monitoring

### Logging
```python
# Enable debug logging
LOG_LEVEL=DEBUG uv run python rag_agent.py
```

### Metrics to Track
- RAG search latency
- Embedding generation time
- Database query performance
- Turn detection accuracy
- Token usage per query

## API Reference

### Agent Methods

```python
@function_tool
async def search_knowledge_base(
    context: RunContext,
    query: str,
    limit: int = 5
) -> str:
    """Search the knowledge base using semantic similarity."""
```

### Lifecycle Hooks

```python
async def on_enter(self) -> None:
    """Called when agent becomes active."""

async def on_exit(self) -> None:
    """Called when agent is replaced or session ends."""
```
