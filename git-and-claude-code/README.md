# 🧪 Git + Claude Code Workshop Checklist (Python Project)

Follow this step-by-step to walk through all key Git and Claude workflows during the workshop.

Be sure to install Claude Code first by following [this guide](https://docs.anthropic.com/en/docs/claude-code/setup).
See `install_claude_code_windows.md` for help with installing Claude Code on Windows with WSL.

---

## ✅ PHASE 1: INIT & CONNECT TO GITHUB

1. **Create project folder & initialize:**
```bash
mkdir ai-agent && cd ai-agent
git init
```

2. **Add your files - create main.py and add:**
```python
print("Good morning, agent!")
```

**Then create README.md and add:**
```
# AI Agent
```

3. **First commit:**
```bash
git add .
git commit -m "Initial Python agent setup"
```

You may also need to run the commands (just one time):

```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

4. **Create your personal access token for GitHub authentication**

1. Go to https://github.com/settings/profile
2. Developer settings (scroll down)
3. Personal access tokens -> Tokens (classic)
4. Generate new access token
5. Make sure the token has 'repo' permissions at a minimum

Back in the terminal:

```bash
git config --global credential.helper store
```

5. **Create GitHub repo manually in your browser, then link it:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/workshop-ai-agent.git
git branch -M main
git push -u origin main
```

This will prompt you for your GitHub username and then a personal access token. But thanks to the git config command we ran above, we won't need to enter it again, so Claude Code can do a push for us without us having to intervene and enter a password.

---

## ✅ PHASE 2: COMMITTING WITH CLAUDE

5. **Start Claude in terminal:**
```bash
claude
```

6. **Make a code change:**
```python
# Edit main.py
print("Welcome, agent.")
```

7. **Use Claude to commit and push:**
> “Stage and commit the updated welcome message, then push to GitHub”

✅ Confirm with `git log` or check GitHub.

---

## ✅ PHASE 3: REVERT A COMMIT

8. **Make a test change:**
```bash
echo "temporary code" >> notes.txt
git add . && git commit -m "accidental debug file"
```

9. **Revert manually:**
```bash
git revert HEAD # Goes back one commit
git revert HEAD~2..HEAD # Goes back three commits
```

10. **OR revert with Claude:**
> “Revert the last commit and push the correction”

✅ Use `git log --oneline` to confirm.

---

## ✅ PHASE 4: FEATURE BRANCH (Simple Python Edit)

11. **Create a branch manually:**
```bash
git checkout -b feature-greeting
```

12. **Edit main.py:**
```python
print("Good morning, agent!")
```

13. **Commit and push manually:**
```bash
git add main.py
git commit -m "Update greeting message"
git push origin feature-greeting
```

✅ OR with Claude:
> “Create a branch called feature-greeting, update the greeting, commit it, and push to GitHub”

---

## ✅ PHASE 5: PARALLEL WORKTREES + CLAUDE AGENTS

### 🪴 Worktree 1: `feature-logging`

14. From main directory:
```bash
git worktree add -b feature-logging ./trees/feature-logging
cd trees/feature-logging
claude
```

> “Add a line to log when the script starts. Commit and push.”

---

### 🪴 Worktree 2: `feature-goodbye`

15. In another terminal:
```bash
git worktree add -b feature-goodbye ./trees/feature-goodbye
cd trees/feature-goodbye
claude
```

> “Add a print statement that says ‘Goodbye, agent!’ at the end of the script. Commit and push.”

✅ You now have two branches running Claude in isolation.

---

## ✅ PHASE 6: MERGE BACK TO MAIN

16. From root project directory:
```bash
cd ../ai-agent
git checkout main
git merge feature-logging
```

**Optional: preview changes before merge**
```bash
git diff main..feature-logging
```

✅ OR ask Claude:
> “Merge the feature-logging branch into main and push the update”

---

## ✅ PHASE 7: CLEANUP

17. **Remove one finished worktree manually:**
```bash
git worktree remove ./trees/feature-goodbye
git branch -d feature-goodbye
```

Repeat this for any other worktrees.
-D is required instead of -d if you are removing a worktree you haven't merged.

✅ OR ask Claude:
> “Remove the feature-logging worktree and delete the branch”

---

## ✅ PHASE 8: REVIEW & TEST

18. **Ask Claude to summarize commits:**
> “Summarize the last three commits”

19. **Use `git diff` and ask Claude to explain:**
```bash
git diff HEAD~1 HEAD
```
> “Explain this diff and why the changes were made”

---

## ✅ PHASE 9: CLAUDE GITHUB PR & ISSUE WORKFLOWS

### [Follow these instructions first to set up Claude in GitHub.](https://docs.anthropic.com/en/docs/claude-code/github-actions)

20. **Within an issue in GitHub:**
> "@claude Please fix this issue!"

21. **Review a PR:**
> "@claude Review this PR and implement fix XYZ."

22. **Respond to issue with Claude without a commit:**
> "@claude Suggest a fix for this issue."

---

## ✅ BONUS PHASE 10: AUTOMATED PARALLEL CODING AGENTS

1. Familiarize yourself with the commands in `.claude/commands`. Any markdown file in this folder can be used as a "slash" command in Claude code like:

```bash
/prep-parallel "[FEATURE_NAME]" "[NUMBER_OF_PARALLEL_WORKTREES]"
```

Where the parameters in brackets are what you define when you run the command.

2. Within Claude Code, execute the command:

```bash
/prep-parallel simple-cli 3
```

This will create three folders in `trees/` - `simple-cli-1`, `simple-cli-2`, and `simple-cli-3`

3. Create a markdown file (like `plan.md`) next to `main.py` that describes the feature you want implemented. We are about to use Claude Code to spin up multiple agents in parallel (all in the same terminal now!) that will all attempt to implement the same feature. This is great because AI coding assistants make mistakes often, so giving Claude Code multiple tries at something in parallel is a great way to build faster. We can pick the best implementation and merge it back into main.

4. Execute the command in Claude Code:

```bash
/execute-parallel simple-cli plan.md 3
```

Claude Code will now kick off multiple agents in parallel tackling different versions of the same feature. Each version will be different simply because LLMs are not deterministic. The instructions are the same for each worktree, but the output will always be different for more than extremely simple features.

5. The process for merging back into main and cleaning up the worktrees is the same as before.

---

## ✅ BONUS PHASE 11: CLAUDE CODE HOOKS

Claude Code Hooks are a powerful feature that allows you to configure shell commands that execute automatically in response to specific events during Claude Code tool calls. This is particularly useful when combined with Git actions for automated workflows.

### Setting Up Hooks

1. **Create a settings file** (if it doesn't exist):
```bash
mkdir -p ~/.config/claude-code/
touch ~/.config/claude-code/settings.json
```

2. **Configure hooks in your settings.json**:
```json
{
  "hooks": {
    "beforeToolCall": {
      "command": "echo 'About to execute: $TOOL_NAME'",
      "enabled": true
    },
    "afterToolCall": {
      "command": "git status",
      "enabled": true
    },
    "beforeGitCommit": {
      "command": "npm run lint && npm run test",
      "enabled": true
    }
  }
}
```

### Common Hook Use Cases

- **Pre-commit validation**: Run linting, formatting, or tests before commits
- **Post-commit actions**: Trigger deployments or notifications
- **File monitoring**: Watch for changes and trigger rebuilds
- **Security scanning**: Automatically scan code changes

### Example: Automated Testing Hook

```json
{
  "hooks": {
    "beforeGitCommit": {
      "command": "python -m pytest tests/ && python -m flake8 .",
      "enabled": true,
      "description": "Run tests and linting before commits"
    }
  }
}
```

This ensures your code is always tested and properly formatted before being committed by Claude Code.

### Managing Hooks

- Use `claude config hooks list` to see configured hooks
- Use `claude config hooks disable <hook-name>` to temporarily disable
- Use `claude config hooks enable <hook-name>` to re-enable

Hooks make Claude Code even more powerful by automating your development workflow and ensuring code quality standards are maintained throughout your Git operations.