import { useState, useRef, useEffect } from 'react'

export function PromptPatterns() {
  const [expandedPrompt, setExpandedPrompt] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(null)
  const sectionRef = useRef(null)
  const [visibleCards, setVisibleCards] = useState([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger reveal cards
            const cards = ['context', 'specific', 'iterate', 'meta']
            cards.forEach((card, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, card])
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(id)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  const prompts = [
    {
      id: 'context',
      category: 'Context Setting',
      title: 'Provide Context Upfront',
      icon: '📋',
      color: '#00d9c0',
      before: 'Build me a landing page',
      after: `I'm building a "meta" landing page called "Iterate Like A Pro" that showcases how to build frontends with AI.

Context:
- Visual theme: Cyberpunk/Neon with Cyber Orange (Sunset) colors
- Tech stack: React + Vite + Tailwind CSS v4
- Audience: Developers learning AI coding workflows
- Sections needed: Hero, Workflow diagram, Prompt patterns, Pro tips

Please build a Hero section with:
- Terminal typing effect showing npm run dev
- "Iterate Like A Pro" gradient heading
- Meta badge: "Built with AI, using AI"`,
      why: 'AI models generate better code when they understand the full context, not just the immediate task.',
      tips: [
        'Share project goals and audience',
        'Mention tech stack constraints',
        'Provide aesthetic direction',
        'List all required features upfront'
      ]
    },
    {
      id: 'specific',
      category: 'Specificity',
      title: 'Be Specific About Requirements',
      icon: '🎯',
      color: '#ff6b35',
      before: 'Add animations to the hero',
      after: `Add animations to the Hero section with these requirements:

1. Terminal typing effect:
   - Type 30ms per character
   - Start after 800ms delay
   - Include blinking cursor

2. Main content stagger:
   - Stagger children animations
   - 0.1s increments between elements
   - Fade in + translate Y from 20px

3. Floating badges:
   - "PIV Loop Active" (green dot)
   - "PRP Mode" (orange dot)
   - Float animation (3s ease-in-out infinite)

Use CSS animations for performance. No JS libraries.`,
      why: 'Ambiguity leads to generic results. Specific requirements produce tailored, production-ready code.',
      tips: [
        'Specify timing and delays',
        'Define animation types',
        'List all visual states',
        'Mention performance constraints'
      ]
    },
    {
      id: 'iterate',
      category: 'Iterative Refinement',
      title: 'Iterate with Precision',
      icon: '🔄',
      color: '#ff6b35',
      before: 'The design looks generic, fix it',
      after: `Iteration 2 - Hero visual polish:

Current state: Gradient heading looks flat and generic.

Request:
1. Add multi-layer neon glow text-shadow:
   - 0 0 10px rgba(255, 107, 53, 0.8)
   - 0 0 20px rgba(255, 107, 53, 0.6)
   - 0 0 40px rgba(255, 107, 53, 0.4)
   - 0 0 80px rgba(255, 107, 53, 0.2)

2. Update gradient to include teal accent:
   - 135deg, #ff6b35 → #ff8c61 → #00d9c0

3. Add ambient glow orbs behind content
   - Orange: top-1/4 left-1/4
   - Teal: bottom-1/4 right-1/4
   - Blur: 3xl, opacity: 0.10

Keep everything else unchanged.`,
      why: 'Targeted feedback on specific elements leads to focused improvements without breaking what works.',
      tips: [
        'Reference current state',
        'Describe what\'s not working',
        'Provide exact values where possible',
        'Preserve what works'
      ]
    },
    {
      id: 'meta',
      category: 'Meta Prompts',
      title: 'Use Meta Prompting',
      icon: '🎭',
      color: '#00d9c0',
      before: 'Help me write better prompts',
      after: `Meta-Prompt: Act as a prompt engineering expert

I'm building this landing page using AI. Review my approach and suggest improvements.

My current workflow:
1. Provide detailed context upfront
2. Specify exact requirements
3. Reference design principles from CLAUDE.md
4. Iterate with precision

What am I missing? How can I:
- Reduce iteration cycles?
- Get more specific results?
- Better leverage my design docs?

Analyze the prompts I've used so far and suggest 3 concrete improvements.`,
      why: 'Meta prompts help you reflect on your prompting strategy and discover patterns you might miss.',
      tips: [
        'Ask AI to analyze your workflow',
        'Request pattern recognition',
        'Seek strategic improvements',
        'Learn from your own prompt history'
      ]
    }
  ]

  return (
    <section ref={sectionRef} className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 neon-text">
            Prompt Patterns Deep-Dive
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real prompts from this project. See what works, why it works, and how to apply it.
          </p>
        </div>

        {/* Prompt cards */}
        <div className="space-y-6">
          {prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className={`transition-all duration-700 ${
                visibleCards.includes(prompt.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="glass-card rounded-2xl overflow-hidden">
                {/* Card header */}
                <div
                  className="p-6 cursor-pointer transition-all hover:bg-white/5"
                  onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ backgroundColor: `${prompt.color}20` }}
                      >
                        {prompt.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
                            style={{
                              backgroundColor: `${prompt.color}20`,
                              color: prompt.color
                            }}
                          >
                            {prompt.category}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{prompt.title}</h3>
                        <p className="text-gray-400 text-sm">{prompt.why}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">
                        {expandedPrompt === prompt.id ? 'Click to collapse' : 'Click to expand'}
                      </span>
                      <div
                        className={`transition-transform duration-300 ${
                          expandedPrompt === prompt.id ? 'rotate-180' : ''
                        }`}
                      >
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedPrompt === prompt.id && (
                  <div className="border-t border-white/10">
                    <div className="p-6 space-y-6">
                      {/* Before/After comparison */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Before */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-red-400">❌</span>
                            <h4 className="font-semibold text-red-400">Before (Vague)</h4>
                          </div>
                          <div className="relative">
                            <div className="terminal text-sm p-4 rounded-lg overflow-x-auto">
                              <code className="text-gray-300 whitespace-pre-wrap">
                                {prompt.before}
                              </code>
                            </div>
                            <button
                              onClick={() => copyToClipboard(prompt.before, `${prompt.id}-before`)}
                              className="absolute top-2 right-2 p-2 rounded bg-black/50 hover:bg-black/70 transition-colors"
                              title="Copy to clipboard"
                            >
                              {copiedPrompt === `${prompt.id}-before` ? (
                                <span className="text-green-400 text-sm">✓</span>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* After */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-green-400">✓</span>
                            <h4 className="font-semibold text-green-400">After (Specific)</h4>
                          </div>
                          <div className="relative">
                            <div className="terminal text-sm p-4 rounded-lg overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
                              <code className="text-gray-300 whitespace-pre-wrap text-xs">
                                {prompt.after}
                              </code>
                            </div>
                            <button
                              onClick={() => copyToClipboard(prompt.after, `${prompt.id}-after`)}
                              className="absolute top-2 right-2 p-2 rounded bg-black/50 hover:bg-black/70 transition-colors"
                              title="Copy to clipboard"
                            >
                              {copiedPrompt === `${prompt.id}-after` ? (
                                <span className="text-green-400 text-sm">✓</span>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="p-4 rounded-lg bg-[#0a0e27] border border-white/10">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="text-xl">💡</span>
                          Key Principles
                        </h4>
                        <ul className="space-y-2">
                          {prompt.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-3 text-sm text-gray-300">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: prompt.color }}
                              />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Meta note */}
        <div className="mt-16 p-8 rounded-2xl glass-card text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff6b35]/10 border border-[#ff6b35]/30 mb-4">
            <span className="w-2 h-2 bg-[#ff6b35] rounded-full pulse-glow" />
            <span className="text-sm text-[#ff6b35] font-semibold">Meta</span>
          </div>
          <p className="text-gray-300 mb-4">
            Every prompt example above was used in building this landing page.
          </p>
          <p className="text-sm text-gray-400">
            The "After" prompts are the actual prompts I wrote. The results speak for themselves.
          </p>
        </div>
      </div>
    </section>
  )
}
