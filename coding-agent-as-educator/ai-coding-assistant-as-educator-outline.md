# AI Coding Assistant as Educator

## The Core Problem

Beginners (and even experienced developers in unfamiliar territory) face the **"unknown unknowns"** problem. They can't ask good questions because they don't know what they don't know.

This workshop provides a **question toolkit** mapped to specific steps in the development process.

---

## The Mindset Shift

> **You're not asking questions because you're reliant - you're asking questions because that's how you stay in the driver's seat.**

The AI has no ego. It will happily explain, re-explain, and justify every decision. Not using that capability is leaving education on the table.

---

## Phase 1: Before Writing Any Code

### Questions to Ask

```
What are my options for implementing this? Give me pros/cons and your recommendation.
```

```
What concepts or patterns should I understand before we start?
```

```
What are the risks or gotchas with this type of project?
```

```
Do web research to validate these approaches against current best practices.
```

### The Meta-Question (Attacks Unknown Unknowns)

```
What should I be asking about that I'm not asking?
```

### Why This Matters

This is where you establish the "roundtable" - you're not just accepting the first solution, you're seeing the landscape of possibilities. Education through exposure to alternatives.

---

## Phase 2: Architecture & Design Decisions

### Questions to Ask

```
Explain this architecture in terms of: modularity, efficiency, security, simplicity.
```

```
What happens when this scales to 10x users? 100x?
```

```
If requirements change to X, how painful would that modification be?
```

```
What are the trade-offs you made here, and what did we give up?
```

### The Power Question

```
If a senior developer reviewed this, what would they question or critique?
```

This forces the AI to role-play the skeptic and surface concerns it might not volunteer otherwise.

---

## Phase 3: After Code Is Generated (Before Accepting)

### Questions to Ask

```
Walk me through this code. What does each part do and why?
```

```
What assumptions is this code making that could break?
```

```
What are the edge cases this doesn't handle?
```

```
How would I debug this if it breaks in production?
```

### The Learning Question

```
What patterns or concepts in this code should I learn more about to really understand it?
```

This turns every code generation into a learning opportunity.

---

## Phase 4: Validation & Testing

### Questions to Ask

```
What did you do to validate this works correctly?
```

```
What testing should we add? Unit? Integration? E2E?
```

```
Show me how to manually test this feature.
```

```
What could go wrong that tests wouldn't catch?
```

### The Self-Reflection Prompt

```
Did you cut any corners on validation? What would a thorough validation look like?
```

Sometimes the AI knows it skipped things but won't say unless asked.

---

## Phase 5: When Things Break

### Questions to Ask

```
What's your hypothesis for why this failed?
```

```
Walk me through your debugging process step by step.
```

```
What did this error teach us about how the code works?
```

```
How can we prevent this class of bug in the future?
```

### The Educational Reframe

Bugs are learning opportunities. Instead of just "fix it," ask "teach me what happened."

---

## Phase 6: After Completing a Feature/Project

### Retrospective Questions

```
What patterns from this project should I remember for future work?
```

```
What would you do differently if we started over?
```

```
Summarize the key concepts I learned during this project.
```

```
What should go into my PRD/guidelines for future projects based on what worked well here?
```

This extracts good patterns so you can explicitly request them next time, addressing the probabilistic nature of LLMs.

---

## Quick Reference: Question Toolkit

| Moment | Question Type | Example |
|--------|---------------|---------|
| Starting | Options | "What are my options? Pros/cons?" |
| Starting | Unknown Unknowns | "What should I be asking that I'm not?" |
| Design | Trade-offs | "What did we give up with this approach?" |
| Design | Future-proofing | "How painful to change if X?" |
| Code Generated | Explanation | "Explain in terms of modularity, efficiency, security, simplicity" |
| Code Generated | Skeptic | "What would a senior dev critique?" |
| Code Generated | Learning | "What concepts should I study to understand this?" |
| Testing | Validation | "What did you do to validate this?" |
| Testing | Gaps | "What could go wrong that tests won't catch?" |
| Broken | Teaching | "Teach me what happened and why" |
| Done | Extraction | "What patterns should I remember?" |

---

## The Four Lenses for Code Explanation

When asking for explanations, use these four aspects:

1. **Modularity** - How is this organized? Can pieces be reused or replaced?
2. **Efficiency** - Is this performant? Are there unnecessary operations?
3. **Security** - What vulnerabilities could exist? What inputs are trusted?
4. **Simplicity** - Is this the simplest solution? Could it be clearer?

---

## The Roundtable Model

When making decisions, you have access to multiple perspectives:

1. **The AI Coding Assistant** - Its knowledge and recommendations
2. **Web Research Sources** - Current best practices and community opinions
3. **You** - The final decision-maker in the driver's seat

Always ask for options, always verify with research, always make the final call yourself.

---

## Key Takeaways

1. **Ask for options, not solutions** - See the landscape before committing
2. **Use the meta-question** - "What should I be asking that I'm not?"
3. **Role-play the skeptic** - "What would a senior dev critique?"
4. **Extract patterns** - Learn from each project to set better expectations next time
5. **Bugs are teachers** - Ask "teach me what happened" not just "fix it"
6. **Validate explicitly** - Ask what validation was done and what's missing
7. **Stay in the driver's seat** - You make the final decisions, the AI informs them
