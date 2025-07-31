# Archon Task Management Workflow

## Standard Development Workflow with Archon

### 1. Initial Setup (All Agents)
```python
# First command for EVERY agent
mcp__serena__initial_instructions()

# Check for existing projects
projects = mcp__archon__manage_project(action="list")
```

### 2. Task Lifecycle

**Before Starting Work:**
```python
# Get assigned tasks
tasks = mcp__archon__manage_task(
    action="list", 
    filter_by="status", 
    filter_value="todo",
    project_id="provided-project-id"
)

# Get specific task details
task = mcp__archon__manage_task(action="get", task_id="assigned-task-id")

# Mark task as in progress
mcp__archon__manage_task(
    action="update",
    task_id="task-id",
    update_fields={"status": "doing"}
)
```

**During Work:**
```python
# Research patterns
results = mcp__archon__perform_rag_query(query="implementation pattern", match_count=5)
examples = mcp__archon__search_code_examples(query="specific feature", match_count=3)
```

**After Completing Work:**
```python
# Mark for review
mcp__archon__manage_task(
    action="update",
    task_id="task-id",
    update_fields={"status": "review"}
)
```

### 3. Project Document Management

**Adding PRPs and Documentation:**
```python
# Add PRP document
mcp__archon__manage_document(
    action="add",
    project_id="uuid",
    document_type="prp",
    title="PRP: Feature Name",
    content={
        "document_type": "prp",
        "goal": "...",
        "why": [...],
        "what": {...},
        "context": {...},
        "implementation_blueprint": {...},
        "validation": {...}
    }
)
```

### 4. Context Passing Between Agents

**From agent-organizer to sub-agents:**
- MUST provide: `project_id`
- MAY provide: `task_id`, `feature_name`
- MUST instruct: "Run mcp__serena__initial_instructions() first"
- MUST clarify: "Use mcp__archon__* tools directly"

**Sub-agents receiving context:**
- NEVER create new projects if project_id provided
- ALWAYS use provided project_id for all operations
- UPDATE task status appropriately
- COORDINATE through shared project/task context