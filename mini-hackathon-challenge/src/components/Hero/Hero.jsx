import { useState, useEffect } from 'react'

export function Hero() {
  const [typedText, setTypedText] = useState('')
  const [showTerminal, setShowTerminal] = useState(false)
  const fullText = '$ npm run dev\n> iterate-like-a-pro@1.0.0 dev\n> vite\n\n  VITE v7.3.1  ready in 123 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose\n  ➜  press h + enter to show help'

  useEffect(() => {
    // Start terminal after heading animations
    const terminalTimer = setTimeout(() => setShowTerminal(true), 800)
    return () => clearTimeout(terminalTimer)
  }, [])

  useEffect(() => {
    if (!showTerminal) return

    let index = 0
    const typingSpeed = 30

    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, typingSpeed)

    return () => clearInterval(timer)
  }, [showTerminal])

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden grid-bg">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-3xl float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d9c0]/10 rounded-full blur-3xl float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Main content */}
          <div className="stagger-children">
            {/* Meta badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
              <span className="w-2 h-2 bg-[#ff6b35] rounded-full pulse-glow" />
              <span className="text-sm text-gray-300">Built with AI, using AI</span>
            </div>

            {/* Main heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Iterate</span>
              <br />
              <span className="neon-text text-white">Like A Pro</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              How I Built This Page With AI
              <span className="text-[#ff6b35]"> (While Building It With AI)</span>
            </p>

            {/* Subheading */}
            <p className="text-lg text-gray-400 mb-12 max-w-xl leading-relaxed">
              Discover the <span className="text-[#00d9c0] font-semibold">PIV × PRP</span>{' '}
              workflow that ships production-ready code on the first pass.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#workflow"
                className="group relative px-8 py-4 bg-[#ff6b35] text-[#0a0e27] font-bold rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50"
              >
                <span className="relative z-10">Explore the Workflow</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff8c61] to-[#00d9c0] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href="#tips"
                className="px-8 py-4 glass-card rounded-lg font-semibold transition-all hover:scale-105 neon-border"
              >
                Pro Tips
              </a>
            </div>
          </div>

          {/* Right: Terminal/Process visual */}
          <div className="relative">
            {/* Terminal window */}
            <div
              className={`transition-all duration-1000 ${
                showTerminal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="glass-card rounded-lg overflow-hidden neon-border">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0f1529] border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="ml-4 text-sm text-gray-400 font-mono">~/mini-hackathon-challenge</span>
                </div>

                {/* Terminal body */}
                <div className="p-6 font-mono text-sm leading-relaxed min-h-[300px]">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    <span className="text-[#ff6b35]">{typedText}</span>
                    <span className="typing-cursor"></span>
                  </pre>
                </div>
              </div>
            </div>

            {/* Floating process indicators */}
            <div className="absolute -top-4 -right-4 glass-card px-4 py-2 rounded-lg float" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-300">PIV Loop Active</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 rounded-lg float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff6b35] rounded-full" />
                <span className="text-xs text-gray-300">PRP Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
          <span className="text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[#ff6b35] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
