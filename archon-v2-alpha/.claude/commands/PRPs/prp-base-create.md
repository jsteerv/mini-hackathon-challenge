# Create BASE PRP

## Feature: $ARGUMENTS

Generate a complete PRP for feature implementation with deep and thorough research. Ensure rich context is passed to the AI through the PRP to enable one pass implementation success through self-validation and iterative refinement.

The AI agent only gets the context you are appending to the PRP and its own training data. Assume the AI agent has access to the codebase and the same knowledge cutoff as you, so its important that your research findings are included or referenced in the PRP. The Agent has Websearch capabilities, so pass urls to documentation and examples.

## Research Process

> During the research process, leverage specialized sub-agents for deeper, more focused research. The better the research, the higher the chance of one-pass implementation success.

1. **Domain Analysis (When Applicable)**
   - For backend features: Use `silo-architect-django` agent to understand Django patterns and API structure
   - For frontend features: Use `nextjs-15-expert` agent to analyze React/Next.js patterns and components
   - For full-stack features: Use both domain experts in parallel
   - Domain experts will identify WHERE to look and WHAT patterns to follow

2. **Comprehensive Context Research**
   - Use `prp-context-researcher` agent with domain expert findings
   - The researcher will gather:
     - All necessary file references and code patterns
     - Library documentation with specific URLs
     - Implementation examples from the codebase
     - External best practices and common pitfalls
     - Known gotchas and workarounds
   - For critical documentation, add .md files to PRPs/ai_docs

3. **Parallel Research Strategy**
   - Use batch tools to run multiple research tasks simultaneously
   - Coordinate findings from all agents
   - Ask for user clarification if needed

## PRP Generation

Use `prp-creator` agent with all gathered context to generate the PRP following PRPs/templates/prp_base.md:

### Critical Context at minimum to Include and pass to the AI agent as part of the PRP

- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from codebase
- **Gotchas**: Library quirks, version issues
- **Patterns**: Existing approaches to follow
- **Best Practices**: Common pitfalls found during research

### Implementation Blueprint

- Start with pseudocode showing approach
- Reference real files for patterns
- Include error handling strategy
- List tasks to be completed to fulfill the PRP in the order they should be completed, use the pattern in the PRP with information dense keywords

### Validation Gates (Must be Executable by the AI agent)

```bash
# Syntax/Style
ruff check --fix && mypy .

# Unit Tests
uv run pytest tests/ -v

```

The more validation gates the better, but make sure they are executable by the AI agent.
Include tests, mcp servers, and any other relevant validation gates. Get creative with the validation gates.

**_ CRITICAL AFTER YOU ARE DONE RESEARCHING AND EXPLORING THE CODEBASE BEFORE YOU START WRITING THE PRP _**

**_ ULTRATHINK ABOUT THE PRP AND PLAN YOUR APPROACH IN DETAILED TODOS THEN START WRITING THE PRP _**

## Output

Save as: `PRPs/{feature-name}.md`

## Quality Checklist

- [ ] All necessary context included
- [ ] Validation gates are executable by AI
- [ ] References existing patterns
- [ ] Clear implementation path
- [ ] Error handling documented

Score the PRP on a scale of 1-10 (confidence level to succeed in one-pass implementation using claude codes)

Remember: The goal is one-pass implementation success through comprehensive context.
