import { Hero } from './components/Hero/Hero'
import { Workflow } from './components/Workflow/Workflow'
import { PromptPatterns } from './components/PromptPatterns/PromptPatterns'
import { ProTips } from './components/ProTips/ProTips'

function App() {
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <Hero />

      {/* Workflow Section */}
      <section id="workflow" className="bg-[#0f1529]">
        <Workflow />
      </section>

      {/* Prompt Patterns Section */}
      <section id="prompts">
        <PromptPatterns />
      </section>

      {/* Pro Tips Section */}
      <section id="tips" className="bg-[#0f1529]">
        <ProTips />
      </section>
    </div>
  )
}

export default App
