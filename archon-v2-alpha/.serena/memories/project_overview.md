# Archon Project Overview

## Purpose
Archon is a Model Context Protocol (MCP) server that creates a centralized knowledge base for AI coding assistants. It enables AI agents (like Cursor, Windsurf, Claude Desktop) to access documentation, search capabilities, task management, and real-time updates.

## Tech Stack
- **Backend**: Python 3.12+ with FastAPI, Socket.IO, asyncio
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **ML/AI**: OpenAI API, Sentence Transformers, Crawl4AI
- **Infrastructure**: Docker, microservices architecture
- **Key Libraries**: 
  - MCP (Model Context Protocol) 1.7.1
  - pydantic for data validation
  - httpx for HTTP requests
  - logfire for logging

## Architecture
True microservices with lightweight containers:
- **Archon-Server** (FastAPI): Web crawling, document processing, main API
- **Archon-MCP**: Lightweight MCP interface (~150MB distroless)
- **Archon-Agents**: AI/ML operations, reranking
- **Archon-UI**: React frontend dashboard
- **Archon-Docs** (optional): Documentation service

Services communicate via HTTP REST APIs on internal Docker network.

## MCP Tool Usage

**CRITICAL: Use MCP tools directly, not through bash commands.**

### Correct MCP Tool Invocation:
```python
# Project management
mcp__archon__manage_project(action="create", title="New Feature")
mcp__archon__manage_project(action="list")

# Task management
mcp__archon__manage_task(action="create", project_id="uuid", title="Implement API")
mcp__archon__manage_task(action="update", task_id="uuid", update_fields={"status": "doing"})

# Knowledge base
mcp__archon__perform_rag_query(query="authentication patterns", match_count=5)
mcp__archon__search_code_examples(query="JWT implementation", match_count=3)
```

### Never Do This:
```bash
# ❌ WRONG - These launch new Claude instances
claude /mcp__archon__manage_project
bash -c "claude mcp__archon__manage_task"
```