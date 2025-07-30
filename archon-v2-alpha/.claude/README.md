# 🚀 Claude Code Agent Workflow for Archon Development

Welcome to the Archon development workflow powered by Claude Code's advanced agent swarm! This guide will help you leverage our PRP (Product Requirement Prompt) methodology integrated with Archon's project management to ship features efficiently.

## 🎯 Quick Start

### What is this workflow?
This repository uses specialized AI agents that work together to:
- 📋 Create comprehensive PRPs (Product Requirement Prompts) 
- 🔨 Implement features with proper architecture
- ✅ Validate code quality automatically
- 📊 Track progress in Archon's UI

### Key Concept: PRP = PRD + Code Intelligence + Agent Runbook
A PRP provides AI agents with **everything** needed to implement features successfully in one pass.

## 🤖 Available Agents

### Core PRP Agents
- **prp-creator** - Creates comprehensive PRPs with Archon integration
- **prp-executor** - Implements features following PRPs, manages task status
- **prp-validator** - Ensures code quality through validation loops
- **prp-context-researcher** - Gathers implementation context and documentation

### Archon Domain Experts
- **archon-server-expert** - FastAPI, Supabase, backend architecture
- **archon-ui-expert** - React, TypeScript, ShadCN UI components
- **archon-socketio-expert** - Real-time features, WebSocket events
- **archon-project-orchestrator** - Project lifecycle and multi-agent coordination
- **archon-task-manager** - Task status, dependencies, and handoffs

## 📚 Essential Commands

### Creating Features
```bash
# Create a comprehensive PRP for a new feature
/prp-base-create implement user notifications with email and in-app alerts

# Initialize a new Archon project
/archon-project-init notification system with real-time updates
```

### Executing Implementation
```bash
# Execute a PRP with full task tracking
/prp-base-execute PRPs/user-notifications.md

# Prime Claude with project context
/prime-core
```

### Code Review
```bash
# Review staged and unstaged changes
/review-staged-unstaged

# General code review
/review-general src/components/NotificationCenter.tsx
```

## 💡 Example Prompts for Common Tasks

### 1. Adding a New Feature
```
I need to add a real-time collaboration feature where users can see who's viewing the same document
```
Claude will:
- Use prp-creator to generate a comprehensive PRP
- Add it to your Archon project as a document
- Create prioritized tasks assigned to appropriate agents
- Begin implementation with proper task tracking

### 2. Fixing a Bug
```
The notification badge count isn't updating when messages are marked as read. Can you investigate and fix this?
```
Claude will:
- Research the issue using domain experts
- Create a focused PRP for the fix
- Implement with proper validation
- Ensure no regressions

### 3. Refactoring Code
```
The UserProfile component is getting too large and complex. Please refactor it into smaller, reusable components
```
Claude will:
- Analyze current structure
- Create refactoring PRP with migration plan
- Implement incrementally with validation
- Maintain backward compatibility

### 4. Adding API Endpoints
```
I need to add CRUD endpoints for managing user preferences with proper authentication and validation
```
Claude will:
- Use archon-server-expert for API design
- Create PRP with OpenAPI specs
- Implement with FastAPI best practices
- Add comprehensive tests

### 5. UI Component Development
```
Create a new dashboard widget that shows real-time metrics with charts and live updates
```
Claude will:
- Use archon-ui-expert for component design
- Integrate with ShadCN UI components
- Add Socket.IO for real-time updates
- Ensure responsive design

## 🔄 The Archon Workflow

### 1. PRP Creation Phase
```mermaid
User Request → Research → PRP Creation → Archon Document → Task Generation
```

### 2. Implementation Phase
```mermaid
Todo → Doing (Agent claims) → Implementation → Review → Validation → Done
```

### 3. Task Status Flow
- **todo**: Task created, waiting for agent
- **doing**: Agent actively working
- **review**: Implementation complete, awaiting validation
- **done**: Validation passed, task complete

## 🎨 Best Practices

### When Creating PRPs
1. **Be Specific**: "Add user authentication" → "Add JWT-based authentication with refresh tokens and role-based access"
2. **Include Context**: Mention existing patterns, constraints, or integration points
3. **Define Success**: What does "done" look like? Include metrics if applicable

### During Implementation
1. **One Task at a Time**: Agents claim one task, complete it, then move to next
2. **Progressive Enhancement**: Start simple, validate, then add complexity
3. **Validation First**: Every implementation includes tests and validation

### For Best Results
```
❌ Vague: "Make the app faster"
✅ Specific: "Optimize the task list loading time by implementing pagination and caching"

❌ Incomplete: "Add a new button"  
✅ Complete: "Add an export button to the task list that downloads tasks as CSV, including filters"

❌ No context: "Fix the bug"
✅ With context: "Fix the WebSocket reconnection issue where users lose real-time updates after network interruption"
```

## 🛠️ Advanced Usage

### Parallel Agent Execution
```
Implement a complete feature with UI, API, and real-time components working in parallel
```
Multiple agents will work simultaneously on independent tasks.

### Complex Refactoring
```
/refactor-simple UserService to use repository pattern with dependency injection
```

### Creating Pull Requests
```
/create-pr implement notification system with email and in-app alerts
```

## 📊 Monitoring Progress

1. **Archon UI**: View real-time task progress at `http://localhost:3000`
2. **Task Status**: See which agents are working on what
3. **Validation Results**: Track quality gates and test results
4. **Dependencies**: Visualize blocking tasks

## 🚨 Troubleshooting

### If tasks are stuck
```
Use the archon-task-manager to check task status and dependencies
```

### If validation keeps failing
```
The prp-validator will document specific failures. Check task notes in Archon.
```

### If you need to research first
```
Start with: "I need to understand how [feature] currently works before making changes"
```

## 🎯 Pro Tips

1. **Context is King**: The more context you provide, the better the implementation
2. **Trust the Process**: Let agents handle their specialized domains
3. **Validation Loops**: Failures are normal - agents will iterate until success
4. **Archon UI**: Keep it open to monitor real-time progress
5. **Batch Related Changes**: Group related features for better context

## 📝 Example Full Workflow

```
User: I need to add a comment system to tasks with real-time updates and notifications

Claude: I'll create a comprehensive PRP for the comment system and set up the implementation tasks.

[Creates PRP with prp-creator]
[Adds to Archon project]
[Generates tasks:]
- Create comment data models (prp-executor)
- Add comment API endpoints (archon-server-expert)  
- Implement Socket.IO events (archon-socketio-expert)
- Build comment UI components (archon-ui-expert)
- Add notification logic (prp-executor)
- Write tests (prp-executor)
- Validate implementation (prp-validator)

[Agents work in parallel where possible]
[Progress tracked in Archon UI]
[Automatic validation on completion]
```

## 🔗 Resources

- **PRP Templates**: `PRPs/templates/`
- **Example PRPs**: `PRPs/*.md`
- **Agent Definitions**: `.claude/agents/`
- **Commands**: `.claude/commands/`

---

Remember: This workflow is designed for **one-pass implementation success**. Provide comprehensive context, and let the agent swarm handle the rest! 🚀