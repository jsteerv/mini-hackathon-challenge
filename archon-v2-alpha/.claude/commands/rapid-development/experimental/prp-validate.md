# Validate PRP

## PRP File: $ARGUMENTS

Pre-flight validation of a PRP using the specialized `prp-validator` agent to ensure all context and dependencies are available before execution.

## Agent-Based Validation Process

1. **Initial Analysis**
   - Read the specified PRP file
   - Determine feature scope (backend/frontend/full-stack)
   - Identify domain expertise requirements

2. **Domain Expert Review (if applicable)**
   - For backend PRPs: Use `silo-architect-django` to validate Django patterns
   - For frontend PRPs: Use `nextjs-15-expert` to validate React/Next.js patterns
   - Domain experts check for:
     - Architectural compliance
     - Pattern consistency
     - Integration compatibility

3. **Comprehensive Validation**
   - Use `prp-validator` agent to run full validation suite
   - The validator will:
     - Check all file references exist
     - Validate URLs are accessible
     - Verify dependencies are available
     - Test validation commands are executable
     - Assess implementation complexity
     - Identify potential issues

4. **Pre-Implementation Testing**
   - Run Level 1 validation (syntax/linting) on existing code
   - Verify test environment is ready
   - Check API keys and credentials
   - Validate external service connectivity

5. **Risk Assessment**
   - Combine findings from all agents
   - Generate confidence score
   - Identify critical blockers
   - Suggest mitigation strategies

## Validation Gates

### File References

```bash
# Check all referenced files exist
echo "Validating file references..."
for file in $(grep -o 'file: [^[:space:]]*' "$PRP_FILE" | cut -d' ' -f2); do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done
```

### URL Accessibility

```bash
# Check all referenced URLs are accessible
echo "Validating URL references..."
for url in $(grep -o 'url: [^[:space:]]*' "$PRP_FILE" | cut -d' ' -f2); do
    if curl -s --head "$url" > /dev/null; then
        echo "✅ Accessible: $url"
    else
        echo "⚠️  Cannot access: $url"
    fi
done
```

### Environment Dependencies

```bash
# Check environment setup
echo "Validating environment dependencies..."

# Check Python dependencies
if command -v python3 &> /dev/null; then
    echo "✅ Python3 available"

    # Check specific imports mentioned in PRP
    python3 -c "
import re
import sys
# Read PRP file and extract import statements
with open('$PRP_FILE', 'r') as f:
    content = f.read()
# Find import statements in code blocks
imports = re.findall(r'^(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)', content, re.MULTILINE)
unique_imports = set(imports)
failed_imports = []
for module in unique_imports:
    try:
        __import__(module)
        print(f'✅ Module available: {module}')
    except ImportError:
        failed_imports.append(module)
        print(f'⚠️  Module missing: {module}')
if failed_imports:
    print(f'❌ Missing modules: {failed_imports}')
    sys.exit(1)
"
else
    echo "❌ Python3 not available"
    exit 1
fi
```

### API Connectivity

```bash
# Check external API connectivity
echo "Validating API connectivity..."

# Check common APIs mentioned in PRP
if grep -q "api.openai.com" "$PRP_FILE"; then
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "✅ OpenAI API key configured"
    else
        echo "⚠️  OpenAI API key not set"
    fi
fi

if grep -q "api.anthropic.com" "$PRP_FILE"; then
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "✅ Anthropic API key configured"
    else
        echo "⚠️  Anthropic API key not set"
    fi
fi

# Add more API checks as needed
```

## Enhanced Validation Report

Generate a comprehensive validation report with agent findings:

1. **Domain Expert Assessment**
   - Architecture compliance: [PASS/FAIL]
   - Pattern consistency: [PASS/FAIL]
   - Integration risks: [LOW/MEDIUM/HIGH]

2. **Context Completeness Score** (0-100)
   - File references validated
   - Documentation completeness
   - Example code availability

3. **Dependency Readiness** (Ready/Issues/Blocked)
   - Framework dependencies
   - External services
   - API credentials

4. **Risk Assessment** (Low/Medium/High)
   - Implementation complexity
   - Potential blockers
   - Mitigation strategies

5. **Agent Recommendations**
   - Domain expert suggestions
   - Validator findings
   - Required pre-work

## Output Format

```
🔍 PRP Validation Report
========================
📁 Context Validation: [PASS/FAIL]
- Files referenced: X/X found
- URLs accessible: X/X responding
- Examples current: [YES/NO]
🔧 Dependencies: [READY/ISSUES/BLOCKED]
- Python modules: X/X available
- External services: X/X accessible
- API keys: X/X configured
⚠️  Risk Assessment: [LOW/MEDIUM/HIGH]
- Complexity score: X/10
- Failure patterns: X identified
- Mitigation strategies: X documented
📊 Readiness Score: XX/100
🎯 Recommended Actions:
[ ] Install missing dependencies
[ ] Configure missing API keys
[ ] Update stale examples
[ ] Review risk mitigation strategies
Status: [READY_TO_EXECUTE/NEEDS_ATTENTION/BLOCKED]
```

## Auto-Fix Suggestions

When validation fails, provide actionable suggestions:

```bash
# Auto-generate fixes where possible
if [ "$STATUS" != "READY_TO_EXECUTE" ]; then
    echo "🔧 Auto-fix suggestions:"
    echo "pip install missing-module-1 missing-module-2"
    echo "export MISSING_API_KEY=your_key_here"
    echo "git checkout HEAD -- outdated-example.py"
fi
```

## Integration with Execute Command

The validate command should be automatically called by execute-prp before starting implementation:

```bash
# In execute-prp.md, add this as step 0:
echo "Running pre-execution validation..."
validate-prp "$PRP_FILE"
if [ $? -ne 0 ]; then
    echo "❌ Validation failed. Please fix issues before execution."
    exit 1
fi
```
