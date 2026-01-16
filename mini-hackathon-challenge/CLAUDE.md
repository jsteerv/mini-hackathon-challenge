# CLAUDE.md - Project-Specific Guidelines for Claude

## Project Overview

**"Iterate Like A Pro"** - A meta landing page showcasing how to build beautiful frontends with AI coding agents, using that exact workflow to create it.

## Core Principles

### 1. Intentional Minimalism (King Mode Protocol)
- **Anti-Generic**: Reject standard "bootstrapped" layouts. If it looks like a template, it's wrong.
- **Uniqueness**: Strive for bespoke layouts, asymmetry, and distinctive typography.
- **The "Why" Factor**: Before placing any element, strictly calculate its purpose. If it has no purpose, delete it.
- **Reduction**: Minimalism is the ultimate sophistication.

### 2. Design Philosophy: Cyberpunk × Sunset
**Aesthetic Direction**: Retro-futuristic with warm sunset tones
- **Primary**: Neon Orange (#ff6b35) - Glow, accents, CTAs
- **Secondary**: Teal (#00d9c0) - Complementary accent, highlights
- **Background**: Deep Slate (#0a0e27) - Primary background
- **Support**: Slate Dark (#0f1529), Slate Light (#1a2133) - Section alternation

**Typography**:
- Display: Bold, impactful headings with neon glow effects
- Body: Clean, readable, Inter (or similar) for readability
- Code: Monospace with syntax highlighting (neon theme)

### 3. Visual Hierarchy & Space
- **Generous negative space** - Let elements breathe
- **Asymmetric layouts** - Break the grid intentionally
- **Overlap & depth** - Layered transparencies, shadows
- **Motion as information** - Animate to guide attention, not decorate

## Technical Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS v4
- **Animation**: CSS-first, Framer Motion if needed
- **Testing**: Playwright (E2E, responsive, accessibility)

## Component Guidelines

### DO:
- Create reusable components in `src/components/common/`
- Feature components in section-specific folders
- Use semantic HTML
- Implement responsive design (mobile-first)
- Add loading states and error boundaries

### DON'T:
- Use generic AI aesthetics (purple gradients, Inter-only typography)
- Copy standard Bootstrap/Tailwind component patterns
- Over-engineer simple components
- Add animations without purpose

## Development Workflow

### 1. Build Phase (PIV Loop)
1. **Prompt**: Claude generates component based on requirements
2. **Iterate**: Review, refine, improve through feedback
3. **Validate**: Test with Playwright, check responsive, verify accessibility

### 2. Testing Protocol
Before committing, run:
```bash
# Start dev server
npm run dev

# In another terminal, run Playwright tests
npm run test:e2e
```

### 3. Commit Standards
Each commit must:
- Build successfully: `npm run build`
- Pass tests: `npm run test:e2e`
- Update devlog.md with what was done
- Include git diff in commit message

## Design Patterns

### Hero Section
- Hybrid approach: Meta visual + strong statement + process hint
- Asymmetric layout with overlapping elements
- Gradient text with neon glow
- Terminal/code aesthetic visual

### Section Structure
- Alternating backgrounds (Deep Slate ↔ Slate Dark)
- Consistent section padding: `px-6 py-20`
- Container: `max-w-6xl mx-auto`
- Scroll-triggered animations

### Cards & Content
- Glass morphism effect: `bg-[#1a2133]/80 backdrop-blur-sm`
- Neon borders on hover
- Flip animations for tips/gotchas
- Generous internal padding

## Animation Strategy

### CSS-First (Preferred)
```css
/* Scroll-driven fade-in */
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
```

### JavaScript (When Needed)
- Use Intersection Observer for scroll triggers
- Keep animations performant (transform, opacity)
- Test on mobile (60fps target)

## Accessibility Standards

- WCAG AAA compliance where possible
- Keyboard navigation support
- ARIA labels for interactive elements
- Focus indicators on all interactive elements
- Color contrast ratio ≥ 7:1

## Performance Targets

- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Build size < 200KB (gzipped)

## Content Guidelines

### Tone
- Professional but approachable
- Technical but accessible
- Meta and self-referential
- Specific examples from actual build process

### Meta Story Integration
Reference the creation process throughout:
- "This section was built using the PIV loop (3 iterations)"
- "The gradient you see? That was iteration 2"
- "I used PRP methodology to spec these animations"

## Troubleshooting

**Build fails?**
- Check Tailwind v4 syntax: `@import "tailwindcss"`
- Verify all imports have proper extensions

**Animations not working?**
- Check z-index stacking context
- Verify transform origin
- Test in browser dev tools

**Responsive issues?**
- Mobile-first approach
- Test at 375px, 768px, 1920px breakpoints
- Use Tailwind's `md:` and `lg:` prefixes

## Success Metrics

- [ ] Visually impressive (distinctive cyberpunk/orange aesthetic)
- [ ] 3+ sections explaining workflow
- [ ] Deployed with shareable URL
- [ ] Specific, actionable insights
- [ ] Interactive process diagram
- [ ] Mobile responsive (375px - 1920px)
- [ ] Real prompts and examples from this project
- [ ] Playwright tests passing
- [ ] Lighthouse score > 90

---

**Remember**: This page is proof of the process. Build it using PIV × PRP, document the journey, and show your work.
