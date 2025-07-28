# Archon Project Structure

```
archon/
├── python/                    # Backend services
│   ├── src/
│   │   ├── server/           # FastAPI main service
│   │   │   ├── fastapi/      # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── config/       # Configuration
│   │   │   └── utils/        # Utilities
│   │   ├── mcp/              # MCP server implementation
│   │   └── agents/           # AI/ML agents service
│   ├── tests/                # Test suites
│   └── Dockerfile.*          # Service-specific Dockerfiles
├── archon-ui-main/           # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API clients
│   │   └── types/            # TypeScript types
│   └── package.json          # Frontend dependencies
├── migration/                # Database migrations
│   ├── complete_setup.sql    # Initial DB setup
│   └── RESET_DB.sql         # Database reset script
├── docs/                     # Documentation (optional)
├── docker-compose.yml        # Main services config
├── docker-compose.docs.yml   # Documentation service
└── .env.example             # Environment template
```

## Service Ports
- Archon-UI: 3737
- Archon-Server: 8181
- Archon-MCP: 8051
- Archon-Agents: 8052
- Archon-Docs: 3838 (optional)