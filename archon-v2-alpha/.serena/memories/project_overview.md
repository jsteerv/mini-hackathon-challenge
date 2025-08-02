# Archon Project Overview

## Purpose
Archon is a Model Context Protocol (MCP) server that creates a centralized knowledge base for AI coding assistants. It integrates with Cursor, Windsurf, or Claude Desktop to provide:
- Documentation management (crawled websites, uploaded PDFs/docs)
- Smart search capabilities with advanced RAG strategies
- Task management integrated with knowledge base
- Real-time updates as content is added

## Architecture
- **Microservices Architecture** with Docker containers:
  - **Archon-UI**: React/TypeScript frontend (port 3737)
  - **Archon-FastAPI**: Web crawling & document processing (port 8181)
  - **Archon-MCP**: Model Context Protocol interface (port 8051)
  - **Archon-Agents**: AI/ML operations & reranking (port 8052)
  - **Archon-Docs**: Optional documentation service (port 3838)

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Socket.IO
- **Backend**: Python 3.12+, FastAPI, MCP, Supabase
- **AI/ML**: OpenAI, Sentence Transformers, Pydantic AI
- **Infrastructure**: Docker, Docker Compose
- **Testing**: Vitest (frontend), Pytest (backend)
- **Linting**: ESLint (frontend), Ruff & Mypy (backend)