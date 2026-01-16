import { useState, useEffect, useRef } from 'react'

export function Workflow() {
  const [activePhase, setActivePhase] = useState(null)
  const [visibleNodes, setVisibleNodes] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger reveal nodes
            const nodes = ['piv', 'prp', 'combine']
            nodes.forEach((node, index) => {
              setTimeout(() => {
                setVisibleNodes((prev) => [...prev, node])
              }, index * 300)
            })
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const phases = {
    piv: {
      title: 'PIV Loop',
      subtitle: 'Prompt • Iterate • Validate',
      description: 'Rapid iteration cycle for quick feedback and refinement.',
      steps: [
        { label: 'Prompt', icon: '⚡', desc: 'Clear, specific request' },
        { label: 'Iterate', icon: '🔄', desc: 'Refine through feedback' },
        { label: 'Validate', icon: '✅', desc: 'Test and verify' }
      ],
      color: '#ff6b35'
    },
    prp: {
      title: 'PRP Framework',
      subtitle: 'Product Requirement Prompt',
      description: 'Comprehensive context packet for first-pass success.',
      steps: [
        { label: 'Context', icon: '📋', desc: 'Files, docs, snippets' },
        { label: 'Blueprint', icon: '🏗️', desc: 'Tasks + pseudocode' },
        { label: 'Validation', icon: '🧪', desc: 'Tests + lint rules' }
      ],
      color: '#00d9c0'
    },
    combine: {
      title: 'PIV × PRP',
      subtitle: 'The Synergy',
      description: 'PRP provides the foundation, PIV powers the iteration.',
      steps: [
        { label: 'Ship Faster', icon: '🚀', desc: 'First-pass success' },
        { label: 'Iterate Less', icon: '⚡', desc: 'Quality from start' },
        { label: 'Validate More', icon: '🎯', desc: 'Confidence in code' }
      ],
      color: '#ff6b35'
    }
  }

  return (
    <section ref={sectionRef} className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-20 scroll-reveal">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 neon-text">
            The Workflow: PIV × PRP
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Two methodologies that combine to ship production-ready code on the first pass.
          </p>
        </div>

        {/* Interactive diagram */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* PIV Loop Card */}
          <div
            className={`transition-all duration-700 ${
              visibleNodes.includes('piv') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div
              className={`glass-card rounded-2xl p-8 h-full transition-all duration-300 cursor-pointer ${
                activePhase === 'piv' ? 'neon-border scale-105' : 'hover:scale-102'
              }`}
              style={{ borderLeftColor: phases.piv.color, borderLeftWidth: '4px' }}
              onClick={() => setActivePhase(activePhase === 'piv' ? null : 'piv')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${phases.piv.color}20` }}
                >
                  🔄
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: phases.piv.color }}>
                    {phases.piv.title}
                  </h3>
                  <p className="text-sm text-gray-400">{phases.piv.subtitle}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-8">{phases.piv.description}</p>

              <div className="space-y-4">
                {phases.piv.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0e27]/50 hover:bg-[#0a0e27] transition-colors"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{step.label}</h4>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activePhase === 'piv' && (
                <div className="mt-6 p-4 rounded-lg bg-[#ff6b35]/10 border border-[#ff6b35]/30">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#ff6b35]">Pro tip:</strong> Keep prompts specific and
                    iteration cycles short. 3-5 iterations max.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PRP Framework Card */}
          <div
            className={`transition-all duration-700 delay-300 ${
              visibleNodes.includes('prp') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div
              className={`glass-card rounded-2xl p-8 h-full transition-all duration-300 cursor-pointer ${
                activePhase === 'prp' ? 'neon-border scale-105' : 'hover:scale-102'
              }`}
              style={{ borderLeftColor: phases.prp.color, borderLeftWidth: '4px' }}
              onClick={() => setActivePhase(activePhase === 'prp' ? null : 'prp')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${phases.prp.color}20` }}
                >
                  📋
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: phases.prp.color }}>
                    {phases.prp.title}
                  </h3>
                  <p className="text-sm text-gray-400">{phases.prp.subtitle}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-8">{phases.prp.description}</p>

              <div className="space-y-4">
                {phases.prp.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0e27]/50 hover:bg-[#0a0e27] transition-colors"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{step.label}</h4>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activePhase === 'prp' && (
                <div className="mt-6 p-4 rounded-lg bg-[#00d9c0]/10 border border-[#00d9c0]/30">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#00d9c0]">Key insight:</strong> PRP is PRD +
                    curated codebase intelligence + validation. Minimum viable packet for AI.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Combined Card */}
          <div
            className={`transition-all duration-700 delay-600 ${
              visibleNodes.includes('combine') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div
              className={`glass-card rounded-2xl p-8 h-full transition-all duration-300 cursor-pointer relative overflow-hidden ${
                activePhase === 'combine' ? 'neon-border scale-105' : 'hover:scale-102'
              }`}
              onClick={() => setActivePhase(activePhase === 'combine' ? null : 'combine')}
            >
              {/* Gradient background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/10 to-[#00d9c0]/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl gradient-border">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold gradient-text">{phases.combine.title}</h3>
                    <p className="text-sm text-gray-400">{phases.combine.subtitle}</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-8">{phases.combine.description}</p>

                <div className="space-y-4">
                  {phases.combine.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg bg-[#0a0e27]/50 hover:bg-[#0a0e27] transition-colors"
                    >
                      <span className="text-2xl">{step.icon}</span>
                      <div>
                        <h4 className="font-semibold text-white">{step.label}</h4>
                        <p className="text-sm text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {activePhase === 'combine' && (
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#ff6b35]/10 to-[#00d9c0]/10 border border-[#ff6b35]/30">
                    <p className="text-sm text-gray-300">
                      <strong className="gradient-text">The magic:</strong> PRP gets you 90% there
                      on the first pass. PIV handles the final 10% with surgical precision.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visual flow diagram */}
        <div className="glass-card rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-center mb-12 neon-text">
            How They Work Together
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* PRP */}
            <div className="flex-1 text-center">
              <div className="inline-block p-6 rounded-xl bg-[#00d9c0]/10 border-2 border-[#00d9c0] mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h4 className="text-xl font-bold text-[#00d9c0] mb-2">PRP Foundation</h4>
              <p className="text-sm text-gray-400">Context + Blueprint + Validation</p>
            </div>

            {/* Arrow */}
            <div className="text-[#ff6b35] text-4xl animate-pulse">→</div>

            {/* First Pass */}
            <div className="flex-1 text-center">
              <div className="inline-block p-6 rounded-xl bg-[#ff6b35]/10 border-2 border-[#ff6b35] mb-4">
                <span className="text-4xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold text-[#ff6b35] mb-2">First Pass</h4>
              <p className="text-sm text-gray-400">Production-ready code</p>
            </div>

            {/* Arrow */}
            <div className="text-[#ff6b35] text-4xl animate-pulse">→</div>

            {/* PIV */}
            <div className="flex-1 text-center">
              <div className="inline-block p-6 rounded-xl bg-[#ff6b35]/10 border-2 border-[#ff6b35] mb-4">
                <span className="text-4xl">🔄</span>
              </div>
              <h4 className="text-xl font-bold text-[#ff6b35] mb-2">PIV Refinement</h4>
              <p className="text-sm text-gray-400">Iterate if needed</p>
            </div>

            {/* Arrow */}
            <div className="text-[#ff6b35] text-4xl animate-pulse">→</div>

            {/* Ship */}
            <div className="flex-1 text-center">
              <div className="inline-block p-6 rounded-xl bg-gradient-to-br from-[#ff6b35]/20 to-[#00d9c0]/20 border-2 border-[#ff6b35] mb-4 pulse-glow">
                <span className="text-4xl">✅</span>
              </div>
              <h4 className="text-xl font-bold gradient-text mb-2">Ship It</h4>
              <p className="text-sm text-gray-400">Done in minutes, not hours</p>
            </div>
          </div>

          {/* Meta note */}
          <div className="mt-12 p-6 rounded-lg bg-[#0a0e27] border border-white/10 text-center">
            <p className="text-sm text-gray-400">
              <span className="text-[#ff6b35] font-semibold">Meta:</span> This landing page was built
              using this exact workflow. PRP for structure, PIV for polish.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
