# Archon MCP Tool Usage Guide

## CRITICAL: Proper MCP Tool Invocation

**All agents MUST use MCP tools directly, not through bash commands.**

### Correct MCP Tool Syntax

```python
# Project Management
mcp__archon__manage_project(action="create", title="Project Name", github_repo="https://github.com/user/repo")
mcp__archon__manage_project(action="list")
mcp__archon__manage_project(action="get", project_id="550e8400-e29b-41d4-a716-446655440000")

# Task Management
mcp__archon__manage_task(action="create", project_id="uuid", title="Implement feature X", assignee="prp-executor", task_order=1)
mcp__archon__manage_task(action="list", filter_by="status", filter_value="todo", project_id="uuid")
mcp__archon__manage_task(action="update", task_id="uuid", update_fields={"status": "doing"})
mcp__archon__manage_task(action="get", task_id="uuid")

# Document Management
mcp__archon__manage_document(action="add", project_id="uuid", document_type="prp", title="PRP: Feature X", content={...})
mcp__archon__manage_document(action="list", project_id="uuid")

# Knowledge Base Search
mcp__archon__perform_rag_query(query="authentication patterns", match_count=5)
mcp__archon__search_code_examples(query="JWT implementation", match_count=3)
mcp__archon__get_available_sources()

# Session Info
mcp__archon__health_check()
mcp__archon__session_info()
```

### Common Mistakes to Avoid

**NEVER do this:**
```bash
# ❌ WRONG - These launch new Claude instances
claude /mcp__archon__manage_project create "My Project"
bash -c "claude mcp__archon__manage_task"
/usr/bin/claude --mcp archon:manage_project
```

### Agent Context Requirements

When receiving tasks from agent-organizer:
1. Always run `mcp__serena__initial_instructions()` first
2. Use the provided `project_id` for all operations
3. Update task status when starting work: `mcp__archon__manage_task(action="update", task_id="xxx", update_fields={"status": "doing"})`
4. Update task status when completing: `mcp__archon__manage_task(action="update", task_id="xxx", update_fields={"status": "review"})`

### Task Priority System

- `task_order`: Lower number = higher priority (1 is highest)
- Tasks execute in priority order: 1, 2, 3, etc.
- Parallel tasks can have same priority number