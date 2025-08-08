## FEATURE:

LangGraph Workflow with Pydantic AI - AI News Aggregation Agent
Build a LangGraph workflow with 4 agents using Pydantic AI:

Agent 1: Using Perplexity for deep web research on different research topics that we get from our database on the latest AI news
Agent 2: Using RSS feeds to get articles on the latest AI news (RSS feeds come from the database)
Agent 3: Using the Supadata API to get the transcripts of recent YouTube videos from channels in our database and getting the latest news from those videos
Agent 4: Synthesizer agent - it gets all of the news items that the other agents put in the database and outputs the 5-10 more relevent news items based on mention count and how big of a deal the news seems

State Flow: Input → [Perplexity research → agent to insert news from web research || RSS feed fetching → agent to insert news from articles || Supadata YouTube video fetching and transcribing → agent to insert news from YouTube videos] → Synthesis Agent that outputs the 5-10 most relevant pieces of news.

All three research agents execute in parallel, streaming their findings without updating conversation history. The synthesis agent only runs after all three parallel agents complete, then reads all the news items put in the database and creates the output for the top 5-10.

## EXAMPLES AND DOCUMENTATION:

- <IMPORTANT>: Use the Archon MCP server for RAG (for Pydantic AI and LangGraph) and for task management. You'll have to create a new project in Archon for the tasks</IMPORTANT>
- <IMPORTANT>: @AI_News_Agent.json is the n8n prototype that shows you EXACTLY how to use Perplexity, extract articles from RSS feeds, and use the Supadata API to get transcripts from YouTube videos from the channels in the database. This prototype also shows how to use the database and the schema for the database, which is also in @sql/news_tables.sql. So use the prototype to see how we are pulling the research topics to put into Perplexity, how we are pulling the RSS feeds to extract the articles from, and then also how we are pulling the YouTube channels, feeding those into Supadata to get the different videos that we can then go back into Supadata to get the transcripts from. And then also seeing how we can feed all of the transcripts, the research from Perplexity, and the RSS articles into the agents that are responsible for filling the news items table in our database. The n8n prototype here should be guiding the entire process, you just have to translate this all into a LangGraph workflow.</IMPORTANT>
- <IMPORTANT>: The existing code base that we have here is another parallel agent architecture from a different project. And so what I want you to do is instead of creating this LangGraph workflow from scratch, I want you to edit in place everything that we already have here. So like within the graph folder, we have the state.py and the workflow.py. The API, you can pretty much leave as is because the LangGraph workflow that we create is not going to have to be invoked in a different way in our fast API endpoint. And so on. So you'll mostly just be making changes in the graph folder. And then also, all the Pydantic AI agents that we'll be using for the news agent should be in the agents folder. And so you can look at the existing implementations for agents that we have in the previous parallel agent architecture just to have inspiration for how I create my Pydantic AI agents, but you'll have to create brand new ones for each of the agents in this workflow. So yeah, definitely use the existing code base to understand our structure and use that as a starting point. Editing things in place versus creating things brand new.</IMPORTANT> 

## OTHER CONSIDERATIONS:

- All agents in the workflow need message history, but only the last agent will actually add on to the message history with the final result of the task being executed.
- Each parallel research agent will need to stream out text just saying that it is starting (hardcoded text) and then the final synthesis agent will need to stream out the final response based on all the research done
- Update the project structure in the README and basically do a big overhaul of the README after overhauling the existing codebase for the new graph.
- Virtual environment (venv_linux) has already been set up with the necessary dependencies.
- There is already a .env.example so go off of that, but add in Perplexity and Supadata
- Use python_dotenv and load_env() for environment variables.