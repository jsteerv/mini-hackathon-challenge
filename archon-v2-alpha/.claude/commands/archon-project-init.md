# Initialize Archon Project

Create a new Archon project with proper structure, initial PRPs, and task assignments for multi-agent execution.

## Project: $ARGUMENTS

Initialize a complete Archon project ready for PRP-driven development with agent coordination.

## Initialization Workflow

### 1. Project Creation
Use `archon-project-orchestrator` to:
- Create new Archon project with metadata
- Set up GitHub integration (if repo provided)
- Initialize project structure
- Configure agent permissions

### 2. Initial Planning
Gather project requirements:
- Project objectives and scope
- Key features to implement
- Technical constraints
- Success metrics

### 3. PRP Generation Strategy
Based on project scope, create initial PRPs:
- Architecture PRP (if greenfield project)
- Core feature PRPs (identified features)
- Infrastructure PRPs (CI/CD, testing, etc.)

### 4. Task Breakdown
For each PRP, create prioritized tasks:
```yaml
Task Priorities:
  10: Foundation (models, core architecture)
  8: Core services and logic
  6: APIs and integrations
  4: UI and user-facing features
  2: Testing and validation
  1: Documentation and polish
```

### 5. Agent Assignment
Match tasks to specialized agents:
- `prp-executor`: General implementation
- `archon-server-expert`: FastAPI and backend
- `archon-ui-expert`: React and frontend
- `archon-socketio-expert`: Real-time features
- `prp-validator`: All validation tasks

### 6. Project Structure
```
project/
├── PRPs/                 # Product Requirement Prompts
│   ├── architecture.md   # System architecture PRP
│   ├── feature-*.md      # Feature-specific PRPs
│   └── ...
├── docs/                 # Project documentation
├── tasks/                # Task tracking (in Archon)
└── .archon/             # Archon configuration
```

## Output Format

```yaml
Project Initialization Complete:
  Project:
    ID: {project_id}
    Title: {title}
    Repository: {github_url}
    
  PRPs Created:
    - Architecture: {doc_id}
    - {Feature 1}: {doc_id}
    - {Feature 2}: {doc_id}
    
  Tasks Generated:
    Total: {count}
    By Priority:
      Critical (10): {count}
      High (8): {count}
      Medium (6): {count}
      Low (2-4): {count}
      
  Agent Assignments:
    - prp-executor: {task_count} tasks
    - archon-server-expert: {task_count} tasks
    - archon-ui-expert: {task_count} tasks
    - prp-validator: {task_count} tasks
    
  Next Steps:
    1. Review PRPs in Archon UI
    2. Agents can start claiming tasks
    3. Monitor progress in real-time
    4. Validate completed features
```

## Success Criteria
- Project created with clear scope
- Initial PRPs cover core functionality
- All tasks properly prioritized
- Agents assigned based on expertise
- Clear execution path established

Remember: A well-initialized project sets the foundation for successful multi-agent collaboration and rapid feature delivery.