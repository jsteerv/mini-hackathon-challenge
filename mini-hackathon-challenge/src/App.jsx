import { Hero } from './components/Hero/Hero'
import { Workflow } from './components/Workflow/Workflow'
import { Section } from './components/common/Section'

function App() {
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <Hero />

      {/* Workflow Section */}
      <Section id="workflow" className="bg-[#0f1529]">
        <Workflow />
      </Section>

      {/* Prompt Patterns Section */}
      <Section id="prompts">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center neon-text">
            Prompt Patterns Deep-Dive
          </h2>
          <div className="text-center text-gray-400">
            <p className="terminal">
              Real prompts and examples coming soon...
            </p>
          </div>
        </div>
      </Section>

      {/* Pro Tips Section */}
      <Section id="tips" className="bg-[#0f1529]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center neon-text">
            Pro Tips & Gotchas
          </h2>
          <div className="text-center text-gray-400">
            <p className="terminal">
              Cards with tips and warnings coming soon...
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default App
