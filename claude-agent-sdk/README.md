# Claude Agent SDK Workshop Examples

Three simple, well-documented examples demonstrating the Claude Agent SDK for Python:

1. **Simple Query** - Single stateless query (simplest possible example)
2. **Terminal CLI** - Interactive command-line chat with session persistence
3. **API Server** - OpenAI-compatible REST API endpoint

## 📋 Prerequisites

- Python 3.10 or higher
- An Anthropic account (for authentication)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Authentication

You have two options for authentication:

**Option A: Claude CLI OAuth (Recommended)**
```bash
claude auth login
```

**Option B: API Key**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

Get your API key from: https://console.anthropic.com/

## ⚡ Example 1: Simple Query (Stateless)

The absolute simplest way to use the Claude Agent SDK for one-off queries.

### Usage

```bash
python simple_query_example.py
```

This example uses the `query()` function which is perfect for:
- Single questions without conversation context
- Quick scripts and automations
- Learning the basics

For multi-turn conversations with state, see Example 2 (Terminal CLI).

## 💬 Example 2: Terminal CLI

A simple interactive terminal chat interface with conversation persistence.

### Features
- Streaming responses in real-time
- Session management (save/resume conversations)
- Simple, educational code
- Full access to Claude's tools (file operations, bash commands, etc.)

### Usage

Start a new conversation:
```bash
python simple_cli.py
```

Continue your last conversation:
```bash
python simple_cli.py --continue
```

### How It Works

1. **Session Persistence**: Session IDs are saved to `sessions/current_session.json`
2. **Streaming**: Messages are displayed in real-time as Claude generates them
3. **Message Types**: Handles text blocks, tool use, and results gracefully

### Example Session

```
============================================================
Claude Agent SDK - Simple Terminal Chat
============================================================
Type 'exit' or 'quit' to end the conversation

You: What files are in the current directory?

Claude: Let me check the current directory for you.

🔧 Bash

The current directory contains the following files:
- simple_cli.py
- api_server.py
- claude_sdk_wrapper.py
...
```

## 🌐 Example 3: API Server

OpenAI-compatible REST API powered by Claude Agent SDK.

### Features
- OpenAI `/v1/chat/completions` endpoint
- Streaming and non-streaming support
- Session management for conversation continuity
- CORS enabled for web clients
- Compatible with Obsidian Copilot and other OpenAI clients

### Usage

Start the server:
```bash
python api_server.py
```

The server will start on `http://localhost:8000` (configurable via `PORT` env var)

### API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Example Request (cURL)

**Streaming:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

**Non-streaming:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "What is 2+2?"}
    ],
    "stream": false
  }'
```

### Example Request (Python)

```python
import requests

response = requests.post(
    "http://localhost:8000/v1/chat/completions",
    json={
        "model": "claude-sonnet-4",
        "messages": [
            {"role": "user", "content": "Write a haiku about coding"}
        ],
        "stream": False
    }
)

print(response.json()["choices"][0]["message"]["content"])
```

### Using with Obsidian Copilot

1. Start the API server: `python api_server.py`
2. In Obsidian Copilot settings:
   - API Provider: Custom (OpenAI-compatible)
   - API URL: `http://localhost:8000/v1`
   - Model: `claude-sonnet-4`
3. Start chatting!

## 📁 Project Structure

```
claude-agent-sdk/
├── simple_query_example.py    # Simplest stateless example
├── simple_cli.py              # Terminal chat interface
├── api_server.py              # FastAPI server
├── openai_converter.py        # OpenAI format converter
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── README.md                 # This file
├── sessions/                 # CLI session storage
│   └── current_session.json
└── api_sessions/             # API session storage
    └── current.json
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available options:

- `ANTHROPIC_API_KEY` - Your Anthropic API key (optional if using CLI OAuth)
- `PORT` - API server port (default: 8000)
- `WORKING_DIRECTORY` - Custom working directory for file operations

### Claude Agent Options

Both examples support customization via `ClaudeAgentOptions`:

```python
options = ClaudeAgentOptions(
    cwd="/path/to/working/directory",
    system_prompt="You are a helpful assistant...",
    allowed_tools=["Read", "Write", "Bash"],  # Limit tools
    # resume="session_id_here"  # Resume a conversation
)
```

## 🎓 Learning Resources

### Key Concepts

1. **Two Interaction Methods**:
   - `query()`: Stateless, one-off queries (see `simple_query_example.py`)
   - `ClaudeSDKClient`: Stateful conversations with context (see `simple_cli.py`)

2. **Response Methods**:
   - `receive_response()`: Wait for complete response (recommended for turn-based chat)
   - `receive_messages()`: Stream messages in real-time (advanced use cases)

3. **Session Management**: Sessions maintain conversation context across multiple requests

4. **Streaming**: Responses are delivered incrementally as they're generated

5. **Tool Use**: Claude can use tools (file operations, bash commands, etc.)

6. **Message Types**:
   - `AssistantMessage`: Claude's responses
   - `TextBlock`: Text content
   - `ToolUseBlock`: Tool invocations
   - `ResultMessage`: Final message with session ID

### SDK Documentation

- Official docs: https://docs.claude.com/en/api/agent-sdk/python
- GitHub: https://github.com/anthropics/anthropic-sdk-python
