# Custom Skill-Based Pydantic AI Agent

A framework-agnostic skill system for AI agents that implements **progressive disclosure** - a powerful pattern for managing context efficiently. This project demonstrates how to extract successful patterns from proprietary AI systems (like Claude Skills) and implement them in open frameworks like Pydantic AI.

## Key Features

- **Progressive Disclosure**: Skills load instructions and resources on-demand, eliminating context window constraints
- **Framework Agnostic**: Skills work with any AI framework, not locked to a specific vendor
- **Type Safe**: Full Pydantic models and type hints throughout
- **Extensible**: Easy to add new skills by following a simple directory structure
- **Production Ready**: Includes comprehensive testing patterns and examples

## What is Progressive Disclosure?

Progressive disclosure is a technique for managing AI context efficiently. Instead of loading all possible instructions into the system prompt, skills are loaded in three levels:

```
Level 1: Metadata (~100 tokens per skill)
    - Name and brief description in system prompt
    - Agent decides which skill might be relevant

Level 2: Full Instructions (loaded on-demand)
    - Complete SKILL.md with detailed instructions
    - Only loaded when agent chooses to use the skill

Level 3: Resources (loaded on-demand)
    - Reference files, scripts, and other resources
    - Only loaded when instructions reference them
```

This pattern allows an agent to have access to potentially hundreds of skills without overwhelming the context window.

## Architecture

```
custom-skill-agent/
|-- src/                      # Core agent implementation
|   |-- agent.py              # Pydantic AI agent with skill tools
|   |-- skill_loader.py       # Skill discovery and metadata parsing
|   |-- skill_tools.py        # Progressive disclosure tools
|   |-- http_tools.py         # HTTP request tools
|   |-- dependencies.py       # Agent dependencies
|   |-- providers.py          # LLM provider configuration
|   |-- settings.py           # Pydantic Settings configuration
|   |-- prompts.py            # System prompt templates
|   +-- cli.py                # Rich-based CLI interface
|
|-- skills/                   # Skill library
|   |-- weather/              # Simple weather skill
|   |   |-- SKILL.md          # Skill instructions
|   |   +-- references/       # API documentation
|   |       +-- api_reference.md
|   |
|   +-- code_review/          # Advanced code review skill
|       |-- SKILL.md          # Multi-step review workflow
|       |-- references/       # Extensive documentation (~45KB)
|       |   |-- best_practices.md
|       |   |-- security_checklist.md
|       |   +-- common_antipatterns.md
|       +-- scripts/          # Helper scripts
|           +-- lint_patterns.py
|
|-- tests/                    # Test suite
|   |-- test_skill_loader.py  # Skill loader tests
|   |-- test_skill_tools.py   # Tool tests
|   +-- test_agent.py         # Agent integration tests
|
+-- examples/                 # Reference implementations (MongoDB RAG)
```

## Quick Start

### Prerequisites

- Python 3.10 or higher
- An API key for an LLM provider (OpenRouter, OpenAI, Anthropic, etc.)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd custom-skill-agent
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate

# On Unix/macOS
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt

# Or if using uv:
uv pip install -e .
```

4. Configure environment variables:

Create a `.env` file in the project root:

```bash
# LLM Provider Configuration
LLM_PROVIDER=openrouter
LLM_API_KEY=sk-or-v1-your-api-key-here
LLM_MODEL=anthropic/claude-sonnet-4
LLM_BASE_URL=https://openrouter.ai/api/v1

# Skills Configuration
SKILLS_DIR=skills

# Application Settings
APP_ENV=development
LOG_LEVEL=INFO
```

### Running the Agent

Start the CLI agent:

```bash
python -m src.cli
```

You'll see a Rich-based interface where you can interact with the agent. Try asking:
- "What's the weather in New York?"
- "Can you review this code for best practices?"

## Included Skills

### Weather Skill

A simple skill demonstrating Level 2 and Level 3 progressive disclosure:

- **Level 2**: Full instructions for getting weather data
- **Level 3**: API reference documentation for Open-Meteo

Example interaction:
```
User: What's the weather in Tokyo?
Agent: [loads weather skill] [loads API reference] The current weather in Tokyo is...
```

### Code Review Skill

An advanced skill demonstrating extensive Level 3 resources (~45KB total):

- Multi-step review workflow
- Three reference files:
  - `best_practices.md` (~18KB) - Coding standards
  - `security_checklist.md` (~24KB) - OWASP-based security review
  - `common_antipatterns.md` (~34KB) - Code smell detection

Example interaction:
```
User: Review this authentication code for security issues
Agent: [loads code_review skill] [loads security_checklist]
       I'll analyze this against security best practices...
```

## Creating Your Own Skill

### 1. Create the Skill Directory

```bash
mkdir -p skills/my_skill/references
```

### 2. Create SKILL.md

Every skill must have a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my_skill
description: Brief description for agent discovery (1-2 sentences)
version: 1.0.0
author: Your Name
---

# My Skill

Detailed description of what this skill does.

## When to Use

- Scenario 1
- Scenario 2

## Available Operations

1. Operation 1: Description
2. Operation 2: Description

## Instructions

Step-by-step instructions for using this skill...

## Resources

- `references/guide.md` - Detailed guide
- `scripts/helper.py` - Helper script

## Examples

### Example 1
User asks: "..."
Response approach: ...
```

### 3. Add Reference Files (Optional)

Place any supporting documentation in the `references/` directory:

```markdown
# skills/my_skill/references/guide.md

Detailed documentation that the agent can load when needed...
```

### 4. Test Your Skill

Verify your skill is discovered:

```python
from src.skill_loader import SkillLoader
from pathlib import Path

loader = SkillLoader(Path("skills"))
skills = loader.discover_skills()

for skill in skills:
    print(f"- {skill.name}: {skill.description}")
```

## How the Agent Uses Skills

### System Prompt (Level 1)

The agent's system prompt includes a summary of all available skills:

```
Available Skills:
- **weather**: Get weather information for locations using Open-Meteo API.
- **code_review**: Review code for quality, security, and best practices.
```

### Loading Skills (Level 2)

When the agent decides a skill is relevant, it calls `load_skill_tool`:

```python
# Agent automatically calls this when needed
instructions = await load_skill_tool(ctx, skill_name="weather")
# Returns: Full SKILL.md content (without frontmatter)
```

### Loading Resources (Level 3)

When instructions reference a file, the agent calls `read_skill_file_tool`:

```python
# Agent loads specific resources as needed
api_docs = await read_skill_file_tool(
    ctx,
    skill_name="weather",
    file_path="references/api_reference.md"
)
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest tests/ -v

# Run specific test files
pytest tests/test_skill_loader.py -v
pytest tests/test_skill_tools.py -v
pytest tests/test_agent.py -v
```

Note: If you encounter pytest plugin conflicts, you can run tests directly:

```bash
python -c "
import asyncio
from pathlib import Path
from src.skill_loader import SkillLoader

loader = SkillLoader(Path('skills'))
skills = loader.discover_skills()
print(f'Discovered {len(skills)} skills: {[s.name for s in skills]}')
assert len(skills) >= 2, 'Expected at least 2 skills'
print('PASSED')
"
```

## Project Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Provider name (openrouter, openai, anthropic) | openrouter |
| `LLM_API_KEY` | API key for the LLM provider | Required |
| `LLM_MODEL` | Model identifier | anthropic/claude-sonnet-4 |
| `LLM_BASE_URL` | Base URL for API requests | Provider default |
| `SKILLS_DIR` | Directory containing skills | skills |
| `LOG_LEVEL` | Logging level | INFO |

### Pydantic Settings

Settings are loaded from environment variables and `.env` file:

```python
from src.settings import load_settings

settings = load_settings()
print(f"Skills directory: {settings.skills_dir}")
print(f"Model: {settings.llm_model}")
```

## Workshop Context

This project was created for a workshop demonstrating:

1. **Pattern Extraction**: How to identify and extract successful patterns from proprietary AI systems
2. **Framework Independence**: Building portable, framework-agnostic components
3. **Context Management**: Using progressive disclosure to scale beyond context limits
4. **Type-Safe Agents**: Building maintainable agents with Pydantic AI

### Key Takeaways

- Progressive disclosure eliminates context window constraints
- Skills are portable across any AI framework
- Type safety and testing are essential for production agents
- Simple implementations beat over-engineered abstractions

## Available Tools

The agent has access to these tools:

| Tool | Description |
|------|-------------|
| `load_skill_tool` | Load full instructions for a skill (Level 2) |
| `read_skill_file_tool` | Read a file from a skill's directory (Level 3) |
| `list_skill_files_tool` | List available files in a skill |
| `http_get_tool` | Make HTTP GET requests |
| `http_post_tool` | Make HTTP POST requests |

## Troubleshooting

### Skills Not Found

Ensure your skill has:
- A `SKILL.md` file in the skill directory
- Valid YAML frontmatter with `name` and `description` fields
- Properly formatted YAML (check for syntax errors)

### API Errors

Check that:
- Your `.env` file exists and contains valid API credentials
- The `LLM_API_KEY` environment variable is set
- The model you specified is available from your provider

### Import Errors

If you see import errors:
- Ensure you've activated your virtual environment
- Run `pip install -r requirements.txt` to install dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything passes
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
