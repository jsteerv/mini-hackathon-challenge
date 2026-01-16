# Design Principles - "Iterate Like A Pro"

## Aesthetic Philosophy: Intentional Cyberpunk Minimalism

### Core Concept
This landing page embodies the fusion of **retro-futuristic cyberpunk** aesthetics with **intentional minimalism**. Every element exists for a purpose, every animation serves a function, and every design choice reinforces the meta narrative.

### Visual Language

#### Color Strategy
**Dominant:** Deep Slate (#0a0e27) - Creates depth, focus
**Accent:** Neon Orange (#ff6b35) - Glow, CTAs, emphasis
**Secondary:** Teal (#00d9c0) - Complementary balance, highlights

**Rule:** Neon orange for what matters. Teal for subtle guidance. Slate for everything else.

#### Typography Hierarchy
- **H1 (Hero):** 6-8rem, bold, gradient text with neon glow
- **H2 (Sections):** 4-5rem, neon text effect
- **Body:** 1-1.125rem, readable, gray-300 for secondary
- **Code:** Monospace, syntax highlighted, neon theme

**Font Philosophy:**
- Display fonts should be bold, impactful, memorable
- Body fonts should be clean, readable, unobtrusive
- Avoid overused fonts (Inter, Roboto, Arial) - make distinctive choices

#### Space & Layout
- **Generous padding:** `py-20` for sections, `px-6` for containers
- **Negative space:** Let elements breathe, create visual rhythm
- **Asymmetry:** Break the grid intentionally, overlap elements
- **Depth:** Layered transparencies, shadows, glass morphism

**Section Pattern:**
```jsx
<Section className="bg-[alternating-color]">
  <Container>
    <h2>Neon-text heading</h2>
    <Content />
  </Container>
</Section>
```

### Motion as Information

#### Animation Principles
1. **Purpose-driven:** Every animation conveys information or guides attention
2. **Performance-first:** CSS transforms and opacity only
3. **Progressive enhancement:** Works without JavaScript
4. **Scroll-driven:** Animate based on scroll position

#### Key Animations
- **Page load:** Staggered fade-in from bottom (0.1s increments)
- **Scroll reveal:** Fade in + translateY(20px → 0)
- **Hover:** Scale, glow, border reveal
- **Hero:** Typing effect, gradient animation, floating elements

**CSS Pattern:**
```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-on-scroll {
  animation: fade-in-up 0.6s ease-out forwards;
}
```

### Component Design Patterns

#### Glass Card
```jsx
<div className="glass-card p-6 neon-border hover:scale-105 transition-all">
  {content}
</div>
```

#### Neon Button
```jsx
<button className="
  bg-neonOrange text-deepSlate font-bold px-6 py-3
  hover:shadow-lg hover:shadow-orange-500/50
  transition-all duration-300
">
  {label}
</button>
```

#### Gradient Heading
```jsx
<h1 className="gradient-text neon-text">
  ITERATE LIKE A PRO
</h1>
```

### Accessibility Standards

#### Visual
- Color contrast ratio ≥ 7:1 (AAA)
- No color-only indicators (add icons, text)
- Focus visible on all interactive elements

#### Semantic HTML
```jsx
<header>
  <nav>
    <ul>
      <li><a href="#workflow">Workflow</a></li>
    </ul>
  </nav>
</header>

<main>
  <section aria-labelledby="workflow-heading">
    <h2 id="workflow-heading">The Workflow: PIV × PRP</h2>
  </section>
</main>

<footer>
  <p>Built with AI, using AI</p>
</footer>
```

#### Keyboard Navigation
- Tab order follows visual layout
- Skip links for main content
- Escape closes modals/dropdowns

### Performance Guidelines

#### Critical Rendering Path
- Inline critical CSS
- Defer non-critical JS
- Lazy load images/components
- Preload fonts

#### Budget
- HTML: < 15KB gzipped
- CSS: < 30KB gzipped
- JS: < 100KB gzipped
- Total: < 200KB gzipped

### Anti-Patterns (What to Avoid)

❌ **Generic AI Aesthetics:**
- Purple gradients on white backgrounds
- Inter/Roboto as only fonts
- Bootstrap-like layouts
- Cookie-cutter cards
- Predictable spacing

❌ **Over-Engineering:**
- Complex animations without purpose
- Heavy libraries for simple effects
- Unnecessary abstractions
- Premature optimization

❌ **Under-Designing:**
- No visual hierarchy
- Everything has equal weight
- No breathing room
- Boring, flat design

### Meta Design Layer

This page references its own creation:
- "This section used the PIV loop (3 iterations)"
- "The gradient? Iteration 2"
- "These cards? PRP-specified"

**Implementation:**
```jsx
<div className="relative group">
  <p>{content}</p>
  <div className="absolute -top-8 -right-8 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
    Built using PIV iteration #3
  </div>
</div>
```

### Responsive Strategy

#### Breakpoints
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

#### Patterns
```jsx
// Mobile-first approach
<div className="
  text-2xl md:text-4xl lg:text-6xl
  p-4 md:p-8 lg:p-12
  flex-col md:flex-row
">
  {content}
</div>
```

### Testing Checklist

Before committing:
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test:e2e`
- [ ] Responsive at 375px, 768px, 1920px
- [ ] No console errors
- [ ] Animations are smooth (60fps)
- [ ] Keyboard navigation works
- [ ] Color contrast passes
- [ ] Lighthouse score > 90

---

**Remember:** Intentional minimalism > accidental complexity. Every pixel has a purpose.
