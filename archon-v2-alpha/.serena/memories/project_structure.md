# Archon Project Structure

## Root Directory
```
archon-v2-alpha/
├── archon-ui-main/          # React frontend application
├── python/                  # Python backend services
├── docs/                    # Documentation (Docusaurus)
├── PRPs/                    # Product Requirement Plans
│   ├── templates/          # PRP templates
│   ├── scripts/            # PRP-related scripts
│   └── ai_docs/            # AI-generated documentation
├── migration/              # Database migration scripts
├── docker-compose.yml      # Main Docker configuration
├── docker-compose.docs.yml # Documentation service config
├── .env.example           # Environment variables template
├── CLAUDE.md              # Claude AI instructions
└── README.md              # Project documentation
```

## Frontend Structure (archon-ui-main)
```
archon-ui-main/
├── src/
│   ├── components/        # React components
│   │   ├── prp/          # PRP viewer components
│   │   ├── project-tasks/ # Task management components
│   │   └── portal/       # Portal components
│   ├── services/         # API and Socket.IO services
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── public/               # Static assets
├── test/                 # Test files
└── package.json         # Dependencies and scripts
```

## Backend Structure (python)
```
python/
├── src/
│   ├── server/          # FastAPI server
│   ├── mcp/            # MCP server implementation
│   ├── agents/         # AI agents service
│   ├── models/         # Data models
│   ├── services/       # Business logic
│   └── utils/          # Utility modules
├── tests/              # Test files
├── docs/               # Python documentation
└── pyproject.toml      # Python project configuration
```

## Key Integration Points
- Frontend communicates with backend via REST APIs and WebSocket
- MCP server provides tool access for AI assistants
- All services coordinate through Supabase database
- Docker Compose orchestrates the entire stack