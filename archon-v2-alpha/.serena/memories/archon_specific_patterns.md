# Archon-Specific Patterns and Guidelines

## MCP (Model Context Protocol) Integration
- Archon uses MCP for AI assistant integration
- MCP tools are defined in `python/src/mcp/tools/`
- Each tool follows a specific pattern with proper error handling
- Tools communicate with other services via HTTP APIs

## PRP (Product Requirement Plan) System
- PRPs are JSON documents with specific structure
- Must include metadata: title, version, author, date, status, document_type
- Content sections: why, goal, what, context, validation, implementation_blueprint
- Version control automatically creates snapshots on updates
- PRPViewer expects JSON format, not raw markdown

## Task Management Integration
- Tasks are managed through Archon MCP tools
- Task workflow: todo → doing → review → done
- Always update task status when progressing
- Tasks can be assigned to: User, Archon, AI IDE Agent
- Feature association helps organize related tasks

## Real-time Updates
- Socket.IO used for real-time communication
- Events broadcast for document updates, task changes
- Frontend automatically syncs with backend changes

## Knowledge Base Features
- Supports web crawling with sitemap detection
- Document processing for PDFs, Word, Markdown
- RAG (Retrieval Augmented Generation) for smart search
- Vector embeddings stored in Supabase

## Development Workflow
1. Always check current tasks before coding
2. Research using RAG queries before implementation
3. Use Serena MCP tools for code operations
4. Update task status as you progress
5. Run validation commands before marking complete

## Security Considerations
- JWT authentication for API endpoints
- Service-to-service communication uses internal APIs
- Environment variables for sensitive configuration
- Never commit .env files or API keys