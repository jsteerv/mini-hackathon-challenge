## FEATURE:

A want to build a RAG voice agent with LiveKit that can search through my knowledge base that I have in Postgres with PGVector. I already have the RAG pipeline created in the ingestion folder. So I want you to take a look at the ingestion folder so you understand the structure for how we're getting everything chunked and embedded and put in the knowledge base. And then also look at the schema.sql that we have in the SQL folder so you know the tables that we have for documents and chunks. That doesn't have to be recreated. We just need to create the LiveKit agent that has a single tool to interact and search through this knowledge base with RAG. 

## TOOLS:

We need a single tool to use the match_chunks function to search through the knowledge based on a query that the agent decides to get the best answer for the user.

## SYSTEM PROMPT(S)

Come up with the system prompt.

## EXAMPLES:

- **examples/basic_voice_assistant.py** - Simple conversational agent with weather, time, and calculation tools
- **examples/realtime_multimodal.py** - OpenAI Realtime API for ultra-low latency and Gemini Live for vision
- **examples/custom_tools.py** - Database access, API integration, dynamic tool creation, MCP servers
- **examples/agent_handoffs.py** - Multi-agent system with routing, escalation, and context preservation
- **examples/telephony_integration.py** - SIP/phone calls, voicemail detection, IVR, call transfers
- **examples/mcp_server_integration.py** - MCP tool discovery, multi-server orchestration, Archon integration

Use the basic voice assistant as your primary example.

## DOCUMENTATION:

### LiveKit Official Documentation:
- **LiveKit Agents Overview**: https://docs.livekit.io/agents/
- **Voice AI Quickstart**: https://docs.livekit.io/agents/start/voice-ai/
- **Building Voice Agents**: https://docs.livekit.io/agents/build/
- **Turn Detection**: https://docs.livekit.io/agents/build/turns/
- **Tool Integration**: https://docs.livekit.io/agents/build/tools/

## VOICE PIPELINE CONFIGURATION:

### Speech-to-Text (STT)
**Recommended: Deepgram Nova-3 for best balance of speed, accuracy, and cost**

- [X] **Deepgram** (Recommended)
  - [ ] nova-2 (General purpose, fast)
  - [ ] nova-2-phonecall (Optimized for telephony)
  - [X] nova-3 (Latest, highest accuracy)
- [ ] **AssemblyAI**
  - [ ] universal-streaming (Best for voice agents)
  - [ ] slam-1 (Superior context understanding)
- [ ] **OpenAI Whisper**
  - [ ] whisper-large (High accuracy, higher latency)
  - [ ] whisper-medium (Balanced)
- [ ] **Azure Speech Services**
  - [ ] Standard (Real-time transcription)
- [ ] **Google Speech-to-Text**
  - [ ] Chirp 2 (Latest model)

### Large Language Model (LLM)
**Recommended: OpenAI gpt-4.1-mini for best balance of capability and cost**

- [X] **OpenAI**
  - [X] gpt-4.1-mini (Recommended - fast, capable, cost-effective)
  - [ ] gpt-4.1 (More capable, higher cost)
- [ ] **Anthropic**
  - [ ] claude-3.5-haiku (Fast, efficient)
  - [ ] claude-4-sonnet (Balanced)
  - [ ] claude-4-opus (Most capable)
- [ ] **Google**
  - [ ] gemini-2.5-flash (Fast, efficient)
  - [ ] gemini-2.5-pro (More capable)
- [ ] **Groq** (Ultra-fast inference)
  - [ ] llama-3.3-70b (Open source, fast)
  - [ ] mixtral-8x7b (Efficient MoE)
- [ ] **Together AI**
  - [ ] meta-llama/Llama-3.3-70B (Open source)
  - [ ] mistralai/Mixtral-8x7B (MoE architecture)

### Text-to-Speech (TTS)
**Recommended: OpenAI TTS for best balance of quality and latency**

- [X] **OpenAI** (Recommended)
  - [X] echo (Natural, versatile)
  - [ ] alloy (Neutral, clear)
  - [ ] shimmer (Warm, friendly)
  - [ ] onyx (Deep, authoritative)
  - [ ] nova (Energetic)
  - [ ] fable (Expressive, British)
  - [ ] ash (Warm, versatile)
- [ ] **Cartesia**
  - [ ] sonic-english (90ms latency, very fast)
  - [ ] Custom voices (Voice cloning available)
- [ ] **ElevenLabs**
  - [ ] eleven_flash_v2 (75ms latency, recommended for agents)
  - [ ] eleven_multilingual_v2 (Maximum realism)
  - [ ] Custom voices (Professional voice cloning)
- [ ] **Azure Speech Services**
  - [ ] Neural voices (Multiple languages)
  - [ ] Custom neural voice (Enterprise)

### Additional Options:

**Voice Activity Detection (VAD):**
- [x] Silero VAD (Default, recommended)

**Turn Detection:**
- [x] Multilingual Model (Recommended for natural conversation)
- [ ] Semantic Model (English only, context-aware)
- [ ] VAD-based (Faster, less contextual)
- [ ] STT Endpoint (Uses STT provider's detection)

**Noise Cancellation (keep off if you want simple):**
- [ ] Enable Krisp noise cancellation
- [ ] Use telephony-optimized (for phone calls)

## OTHER CONSIDERATIONS:

- Python 3.9+ required - all methods must be `async`
- Use multilingual detection for natural conversation
- Test locally first with `uv run python agent.py console`
- Keep agents simple - add complexity gradually