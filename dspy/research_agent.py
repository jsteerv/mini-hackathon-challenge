"""
Multi-Hop Research Agent with DSPy
Demonstrates optimization and clear improvement metrics
"""

import dspy
from dspy.datasets import HotPotQA
from dspy.teleprompt import BootstrapFewShot
from dspy.evaluate import Evaluate
import os
from dotenv import load_dotenv
from anthropic import Anthropic

# Load environment variables
load_dotenv()

# Initialize Anthropic client for LLM-as-a-judge
judge_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

print("=" * 80)
print("MULTI-HOP RESEARCH AGENT WITH DSPY")
print("=" * 80)

# Step 1: Configure the language model
print("\n[1/6] Configuring language model...")
lm = dspy.LM("anthropic/claude-haiku-4-5-20251001")
dspy.configure(lm=lm)
print("[OK] Using Claude 4.5 Haiku")

# Step 2: Load HotPotQA dataset
print("\n[2/6] Loading HotPotQA dataset...")
dataset = HotPotQA(
    train_seed=1,
    train_size=20,      # Small for quick demo
    eval_seed=2023,
    dev_size=50,
    test_size=0
)

# Mark input fields
trainset = [x.with_inputs('question') for x in dataset.train]
devset = [x.with_inputs('question') for x in dataset.dev]

print(f"[OK] Loaded {len(trainset)} training examples")
print(f"[OK] Loaded {len(devset)} dev examples")

# Show example question
print(f"\nExample question: {trainset[0].question}")
print(f"Expected answer: {trainset[0].answer}")

# Step 3: Define the Research Agent signature with granular control
print("\n[3/6] Defining Multi-Hop Research Agent signature...")


class MultiHopResearch(dspy.Signature):
    """You are a research agent analyzing complex questions that require multiple reasoning steps.

    Follow this process:
    1. Identify what sub-questions need to be answered
    2. Break down the problem into logical steps
    3. Reason through each step carefully
    4. Synthesize findings into a clear, factual answer

    Be precise and cite your reasoning. Do not make assumptions."""

    question: str = dspy.InputField(
        desc="A complex question that may require connecting multiple pieces of information"
    )

    reasoning_steps: str = dspy.OutputField(
        desc="Break down your thinking process. Show what sub-questions you need to answer "
             "and how they connect to reach the final answer. Be explicit and methodical."
    )

    answer: str = dspy.OutputField(
        desc="The final answer to the question. Should be concise (1-3 sentences) and "
             "directly address what was asked. Must be factual and based on your reasoning."
    )


print("[OK] Signature defined with detailed instructions and field descriptions")

# Step 4: Create the baseline agent
print("\n[4/6] Creating baseline (unoptimized) agent...")
baseline_agent = dspy.ChainOfThought(MultiHopResearch)
print("[OK] Baseline agent created using ChainOfThought module")

# Step 5: Test baseline agent on a sample
print("\n[5/6] Testing baseline agent...")
test_example = devset[0]
print(f"\nTest Question: {test_example.question}")
print(f"Expected Answer: {test_example.answer}")

result = baseline_agent(question=test_example.question)
print(f"\nBaseline Agent Answer: {result.answer}")
print(f"Reasoning: {result.reasoning_steps[:200]}...")  # First 200 chars


# Define validation metric using LLM-as-a-judge
def validate_answer(example, pred, trace=None):
    """
    Validate if the predicted answer is correct using Claude 4.5 Haiku as a judge.
    Fast and accurate semantic evaluation.
    """
    expected_answer = example.answer
    predicted_answer = pred.answer

    # Simple LLM-as-a-judge prompt
    judge_prompt = f"""You are evaluating whether a predicted answer matches the expected answer semantically.

Expected Answer: {expected_answer}
Predicted Answer: {predicted_answer}

Does the predicted answer convey the same meaning as the expected answer? Consider:
- Semantic equivalence (not just exact word matching)
- Both answers could be correct if they mean the same thing
- Minor phrasing differences are okay

Respond with ONLY "YES" or "NO"."""

    try:
        response = judge_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            temperature=0,
            messages=[{"role": "user", "content": judge_prompt}]
        )

        judgment = response.content[0].text.strip().upper()
        return judgment == "YES"

    except Exception as e:
        print(f"\nWarning: LLM judge failed ({e}), falling back to substring match")
        # Fallback to simple substring matching if API fails
        return expected_answer.lower() in predicted_answer.lower()


print("\n" + "=" * 80)
print("EVALUATING BASELINE AGENT")
print("=" * 80)
print("\nUsing LLM-as-a-judge (Claude 4.5 Haiku) for accurate semantic evaluation...")

# Evaluate baseline
evaluator = Evaluate(
    devset=devset[:20],  # Use first 20 for quick evaluation
    metric=validate_answer,
    num_threads=1,
    display_progress=True,
    display_table=0  # Don't show full table
)

print("\nRunning baseline evaluation (this may take a minute)...")
baseline_result = evaluator(baseline_agent)
# The evaluator returns a decimal between 0-1, so convert to percentage
baseline_score = baseline_result if isinstance(baseline_result, (int, float)) else float(baseline_result.score)
print(f"\n{'='*80}")
print(f"BASELINE ACCURACY: {baseline_score * 100:.1f}%")
print(f"{'='*80}")

# Step 6: Optimize the agent
print("\n[6/6] Optimizing agent with BootstrapFewShot...")
print("This will generate high-quality examples automatically...")
print("NOTE: Optimization can sometimes hurt performance due to:")
print("  - Small training set (20 examples)")
print("  - Simple validation metric")
print("  - Random variation in eval set")
print("  - Overfitting to training patterns\n")

optimizer = BootstrapFewShot(
    metric=validate_answer,
    max_bootstrapped_demos=8,  # Increased from 4 - more examples
    max_labeled_demos=2,        # Reduced from 4 - less overfitting
    max_rounds=2,               # Increased from 1 - better bootstrapping
)

print("Compiling optimized agent (this may take 2-3 minutes)...")
optimized_agent = optimizer.compile(
    baseline_agent,
    trainset=trainset  # Use full training set
)

print("[OK] Optimization complete!")
print(f"The optimizer generated demonstrations based on {len(trainset)} training examples")

# Evaluate optimized agent
print("\n" + "=" * 80)
print("EVALUATING OPTIMIZED AGENT")
print("=" * 80)

print("\nRunning optimized evaluation (this may take a minute)...")
optimized_result = evaluator(optimized_agent)
optimized_score = optimized_result if isinstance(optimized_result, (int, float)) else float(optimized_result.score)
print(f"\n{'='*80}")
print(f"OPTIMIZED ACCURACY: {optimized_score * 100:.1f}%")
print(f"{'='*80}")

# Show comparison
print("\n" + "=" * 80)
print("OPTIMIZATION RESULTS")
print("=" * 80)
print(f"\n>> Baseline Accuracy:  {baseline_score * 100:.1f}%")
print(f">> Optimized Accuracy: {optimized_score * 100:.1f}%")
improvement = optimized_score - baseline_score
print(f"\n>> Improvement: {improvement * 100:+.1f} percentage points")

if improvement > 0:
    relative_improvement = (improvement / baseline_score) * 100 if baseline_score > 0 else 0
    print(f"   ({relative_improvement:.1f}% relative gain)")

# Show side-by-side comparison on a test example
print("\n" + "=" * 80)
print("SIDE-BY-SIDE COMPARISON")
print("=" * 80)

comparison_example = devset[5]  # Pick a different example
print(f"\nQuestion: {comparison_example.question}")
print(f"\nExpected Answer: {comparison_example.answer}")

baseline_result = baseline_agent(question=comparison_example.question)
optimized_result = optimized_agent(question=comparison_example.question)

print(f"\n--- BASELINE AGENT ---")
print(f"Answer: {baseline_result.answer}")

print(f"\n--- OPTIMIZED AGENT ---")
print(f"Answer: {optimized_result.answer}")

# Check which one is correct
baseline_correct = validate_answer(comparison_example, baseline_result)
optimized_correct = validate_answer(comparison_example, optimized_result)

print(f"\n[>] Baseline: {'CORRECT' if baseline_correct else 'INCORRECT'}")
print(f"[>] Optimized: {'CORRECT' if optimized_correct else 'INCORRECT'}")

print("\n" + "=" * 80)
print("DEMO COMPLETE!")
print("=" * 80)
print("\nKey Takeaways:")
print("1. DSPy automatically optimized prompts using BootstrapFewShot")
print(f"2. Final accuracy changed by {improvement * 100:+.1f} percentage points")
print("3. Improvement is measurable and transparent")

print("\n" + "=" * 80)
print("ANALYSIS: Why Did Optimization", "Improve" if improvement > 0 else "Hurt", "Performance?")
print("=" * 80)

if improvement <= 0:
    print("\nOptimization can sometimes hurt performance due to:")
    print("\n1. SMALL DATASET ISSUE:")
    print(f"   - Only {len(trainset)} training examples")
    print("   - Need 50-100+ examples for reliable optimization")
    print("   - BootstrapFewShot might overfit to small patterns")

    print("\n2. BASELINE ALREADY STRONG:")
    print(f"   - Baseline achieved {baseline_score * 100:.1f}% accuracy")
    print("   - Claude 4.5 Haiku is already quite capable")
    print("   - Hard to improve on strong zero-shot performance")

    print("\n3. STATISTICAL VARIATION:")
    print(f"   - Only {len(devset[:20])} test examples evaluated")
    print("   - Small sample = high variance")
    print("   - Need larger eval set for reliable comparison")

    print("\n4. TO IMPROVE OPTIMIZATION:")
    print("   - Increase training set size (50-200 examples)")
    print("   - Try different optimizers (MIPRO, BetterTogether)")
    print("   - Improve the validation metric")
    print("   - Use a larger eval set")
    print("   - Experiment with hyperparameters")
else:
    print(f"\nSuccess! Optimization improved accuracy by {improvement * 100:.1f} percentage points")
    print("This shows DSPy's automatic prompt optimization is working effectively.")
