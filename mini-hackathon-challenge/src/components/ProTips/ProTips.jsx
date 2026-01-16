import { useState, useRef, useEffect } from 'react'

export function ProTips() {
  const [flippedCards, setFlippedCards] = useState({})
  const [visibleCards, setVisibleCards] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger reveal cards
            const allIds = [...tipCards.map(c => c.id), ...gotchaCards.map(c => c.id)]
            allIds.forEach((id, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, id])
              }, index * 150)
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

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const tipCards = [
    {
      id: 'context',
      icon: '📋',
      title: 'Context is King',
      front: 'Provide file paths, code snippets, and documentation references in every prompt.',
      back: 'LLMs generate higher-quality code when given direct references instead of broad descriptions. Use ai_docs/ directory to pipe in library docs.',
      color: '#00d9c0'
    },
    {
      id: 'validation',
      icon: '🧪',
      title: 'Validation Loops',
      front: 'Include executable tests and lint rules that the AI can run and fix.',
      back: 'Don\'t just describe what to validate. Provide exact commands like "ruff check src/ --fix" and "pytest tests/test_auth.py -v" for auto-correction.',
      color: '#ff6b35'
    },
    {
      id: 'density',
      icon: '💎',
      title: 'Information Density',
      front: 'Use keywords and patterns from your existing codebase in prompts.',
      back: 'Mention exact function names, variable patterns, and architectural decisions. This primes the AI to match your code style automatically.',
      color: '#00d9c0'
    },
    {
      id: 'progressive',
      icon: '📈',
      title: 'Progressive Success',
      front: 'Start simple, validate, then enhance. Don\'t build everything at once.',
      back: 'Ship a vertical slice first: basic feature → test it → enhance it. Prevents "works in isolation but fails in integration" issues.',
      color: '#ff6b35'
    },
    {
      id: 'iterate',
      icon: '🔄',
      title: '3-5 Iterations Max',
      front: 'If you\'re iterating more than 5 times, your prompts need work.',
      back: 'Each iteration should refine, not redesign. If you're making big changes, step back and improve your context and specificity.',
      color: '#00d9c0'
    },
    {
      id: 'meta',
      icon: '🎭',
      title: 'Meta-Prompt Your Workflow',
      front: 'Ask AI to analyze your prompting patterns and suggest improvements.',
      back: '"Review my last 5 prompts and suggest 3 ways I can get better results" - you\'ll discover blind spots you never knew you had.',
      color: '#ff6b35'
    }
  ]

  const gotchaCards = [
    {
      id: 'ambiguity',
      icon: '⚠️',
      title: 'Ambiguity Trap',
      front: 'Vague requests produce generic results.',
      back: '"Make it look good" → Bootstrap template\n"Cyberpunk theme with neon orange glow" → distinctive design',
      severity: 'high'
    },
    {
      id: 'context',
      icon: '🚫',
      title: 'Missing Context',
      front: 'Forgetting to share constraints leads to wasted iterations.',
      back: 'Always mention: tech stack, file structure, existing patterns, performance constraints, and accessibility requirements upfront.',
      severity: 'high'
    },
    {
      id: 'validation',
      icon: '⏳',
      title: 'No Validation Loop',
      front: 'Assuming it works without testing guarantees it doesn\'t.',
      back: 'Always include: "After implementing, run X command to verify" - otherwise you\'ll catch bugs in production, not development.',
      severity: 'medium'
    },
    {
      id: 'overload',
      icon: '📦',
      title: 'Prompt Overload',
      front: 'Cramming too many features into one prompt dilutes quality.',
      back: 'One focused prompt per feature. 3 focused prompts > 1 massive prompt. AI attention spans are real.',
      severity: 'medium'
    }
  ]

  return (
    <section ref={sectionRef} className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 neon-text">
            Pro Tips & Gotchas
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Hard-won lessons from building this page. Flip the cards to reveal the details.
          </p>
        </div>

        {/* Pro Tips Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00d9c0]/20 flex items-center justify-center text-xl">
              ✓
            </div>
            <h3 className="text-3xl font-bold text-[#00d9c0]">Pro Tips</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tipCards.map((card) => (
              <div
                key={card.id}
                className={`transition-all duration-700 ${
                  visibleCards.includes(card.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div
                  className="flip-card-container h-72 cursor-pointer"
                  onClick={() => toggleFlip(card.id)}
                >
                  <div
                    className={`flip-card ${flippedCards[card.id] ? 'flipped' : ''}`}
                    style={{
                      '--card-color': card.color
                    }}
                  >
                    {/* Front */}
                    <div className="flip-card-front glass-card rounded-2xl p-6 neon-border">
                      <div className="flex flex-col h-full">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4"
                          style={{ backgroundColor: `${card.color}20` }}
                        >
                          {card.icon}
                        </div>
                        <h4 className="text-xl font-bold text-white mb-3">{card.title}</h4>
                        <p className="text-gray-300 text-sm flex-1">{card.front}</p>
                        <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: card.color }}>
                          <span>Click to reveal</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className="flip-card-back rounded-2xl p-6 border-2"
                      style={{
                        backgroundColor: `${card.color}10`,
                        borderColor: card.color
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">{card.icon}</span>
                          <h4 className="text-xl font-bold" style={{ color: card.color }}>
                            {card.title}
                          </h4>
                        </div>
                        <p className="text-gray-300 text-sm flex-1 leading-relaxed">{card.back}</p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Click to flip back</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gotchas Grid */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/20 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <h3 className="text-3xl font-bold text-[#ff6b35]">Common Gotchas</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gotchaCards.map((card) => (
              <div
                key={card.id}
                className={`transition-all duration-700 ${
                  visibleCards.includes(card.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div
                  className="flip-card-container h-80 cursor-pointer"
                  onClick={() => toggleFlip(card.id)}
                >
                  <div className={`flip-card ${flippedCards[card.id] ? 'flipped' : ''}`}>
                    {/* Front */}
                    <div
                      className={`flip-card-front glass-card rounded-2xl p-6 border-2 ${
                        card.severity === 'high' ? 'border-red-500/50 glitch-hover' : 'border-orange-500/30'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl">{card.icon}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              card.severity === 'high'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {card.severity === 'high' ? 'HIGH IMPACT' : 'COMMON'}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3">{card.title}</h4>
                        <p className="text-gray-300 text-sm flex-1">{card.front}</p>
                        <div className="mt-4 text-xs text-gray-500">
                          Click to see example →
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className="flip-card-back rounded-2xl p-6"
                      style={{
                        background: card.severity === 'high'
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 107, 53, 0.1))'
                          : 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 159, 64, 0.1))',
                        border: '2px solid rgba(255, 107, 53, 0.3)'
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">{card.icon}</span>
                          <h4 className="text-lg font-bold text-white">{card.title}</h4>
                        </div>
                        <p className="text-gray-300 text-sm flex-1 leading-relaxed whitespace-pre-line">
                          {card.back}
                        </p>
                        <div className="mt-4 text-xs text-gray-500">
                          ← Click to flip back
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <div className="glass-card rounded-2xl p-8 md:p-12 neon-border">
            <h3 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Ready to Build Like A Pro?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              You've seen the workflow, the prompts, and the patterns. Now it's your turn.
              The next landing page you build could be the example someone else learns from.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#workflow"
                className="px-8 py-4 bg-[#ff6b35] text-[#0a0e27] font-bold rounded-lg hover:scale-105 transition-transform"
              >
                Revisit the Workflow
              </a>
              <a
                href="#prompts"
                className="px-8 py-4 glass-card rounded-lg font-semibold neon-border hover:scale-105 transition-transform"
              >
                Study the Prompts
              </a>
            </div>
          </div>
        </div>

        {/* Meta footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a0e27] border border-white/10">
            <span className="text-sm text-gray-400">
              This section built with <span className="text-[#00d9c0]">6 pro tips</span> and{' '}
              <span className="text-[#ff6b35]">4 gotchas</span> from 2.5 hours of iteration
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
