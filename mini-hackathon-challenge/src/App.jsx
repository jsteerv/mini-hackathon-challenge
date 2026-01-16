import { Section } from './components/common/Section'
import { Container } from './components/common/Container'

function App() {
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <Section className="flex items-center justify-center">
        <Container>
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text">
              ITERATE LIKE A PRO
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              How I Built This Page With AI (While Building It With AI)
            </p>
            <p className="text-lg text-teal max-w-2xl mx-auto">
              Discover the PIV × PRP workflow that ships production-ready code on the first pass.
            </p>
          </div>
        </Container>
      </Section>

      {/* Workflow Section */}
      <Section id="workflow" className="bg-[#0f1529]">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center neon-text">
            The Workflow: PIV × PRP
          </h2>
          <div className="text-center text-gray-400">
            <p>Interactive process diagram coming soon...</p>
          </div>
        </Container>
      </Section>

      {/* Prompt Patterns Section */}
      <Section id="prompts">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center neon-text">
            Prompt Patterns Deep-Dive
          </h2>
          <div className="text-center text-gray-400">
            <p>Real prompts and examples coming soon...</p>
          </div>
        </Container>
      </Section>

      {/* Pro Tips Section */}
      <Section id="tips" className="bg-[#0f1529]">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center neon-text">
            Pro Tips & Gotchas
          </h2>
          <div className="text-center text-gray-400">
            <p>Cards with tips and warnings coming soon...</p>
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default App
