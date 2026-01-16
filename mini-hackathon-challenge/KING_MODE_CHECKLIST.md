# King Mode Development Checklist

> "Intentional minimalism is the ultimate sophistication"

## Before Adding ANY Element

### The "Why" Factor
- [ ] What problem does this solve?
- [ ] Could it be simpler?
- [ ] Is it unique or does it look like a template?
- [ ] Does it reinforce the cyberpunk × sunset aesthetic?
- [ ] Is it absolutely necessary?

---

## Anti-Generic Design Rules

### REJECT ❌
- [ ] Bootstrap grid layouts
- [ ] Standard card components (white bg, shadow-sm)
- [ ] Purple gradients on white background
- [ ] Inter/Roboto-only typography
- [ ] Centered hero sections without character
- [ ] Perfectly symmetric layouts
- [ ] Generic "feature" grids
- [ ] Stock placeholder images
- [ ] Fade animations without purpose
- [ ] "Lorem ipsum" placeholder text

### EMBRACE ✅
- [ ] Asymmetric layouts with intentional imbalance
- [ ] Overlapping elements with z-index layering
- [ ] Neon orange (#ff6b35) + teal (#00d9c0) + deep slate (#0a0e27)
- [ ] Bold, distinctive typography with glow effects
- [ ] Generous negative space (let elements breathe)
- [ ] Glass morphism + neon borders on hover
- [ ] Motion as information (guide attention, not decorate)
- [ ] Terminal/code aesthetic visual elements
- [ ] Gradient text with animated glow
- [ ] Meta, self-referential content

---

## Color Usage Guidelines

### Neon Orange (#ff6b35)
- [ ] Used for CTAs, accents, highlights
- [ ] NOT used everywhere (strategic placement)
- [ ] Glow effects for emphasis only
- [ ] Contrast ratio ≥ 7:1 with background

### Teal (#00d9c0)
- [ ] Complementary accent color
- [ ] Used for secondary actions
- [ ] Provides color contrast to orange
- [ ] Never dominant, always supportive

### Deep Slate (#0a0e27)
- [ ] Primary background
- [ ] Creates contrast for neon colors
- [ ] NOT pure black (#000000)
- [ ] Consistent across sections

---

## Typography Principles

### Display Text (H1, H2)
- [ ] Bold, impactful weights (600-700)
- [ ] Negative letter spacing (-0.01em to -0.02em)
- [ ] Tight line height (1.1-1.2)
- [ ] Gradient or glow effects for emphasis
- [ ] Responsive sizing using clamp()

### Body Text
- [ ] Comfortable line height (1.5-1.6)
- [ ] Muted colors (#a0aec0, #718096)
- [ ] Max width for readability (60-75 chars)
- [ ] NOT pure white (#ffffff) for long text

### Code/Technical Text
- [ ] Monospace font family
- [ ] Distinct background (#1a2133)
- [ ] Syntax highlighting (neon theme)
- [ ] Smaller size (0.875rem)

---

## Layout Patterns

### Asymmetric Composition
- [ ] Golden ratio proportions (1:1.618)
- [ ] Off-center focal points
- [ ] Varied column widths (not 50/50)
- [ ] Negative space used intentionally
- [ ] Overlapping elements (z-index layering)

### Section Alternation
- [ ] Deep Slate (#0a0e27) ↔ Slate Dark (#0f1529)
- [ ] Consistent padding (py-20, px-6)
- [ ] Container max-width (6xl = 1152px)
- [ ] Clear section transitions

---

## Animation Guidelines

### Purpose Over Decoration
- [ ] Every animation has a purpose
- [ ] Guides attention or indicates state
- [ ] NOT "just because it looks cool"
- [ ] Tested for performance (60fps target)

### Animation Types
- [ ] Scroll-triggered fade-ins (fade-in-up)
- [ ] Hover states with transform (scale, translate)
- [ ] Glow effects for emphasis
- [ ] Smooth transitions (300ms default)

### Performance
- [ ] Transform and opacity only
- [ ] No width/height animations
- [ ] Will-change property for heavy animations
- [ ] Reduced motion respected (@media prefers-reduced-motion)

---

## Component Patterns

### Hero Section
- [ ] Hybrid: Meta visual + strong statement + process hint
- [ ] Asymmetric layout
- [ ] Gradient text with neon glow
- [ ] Terminal/code aesthetic visual
- [ ] Clear CTA (not generic "Learn More")

### Content Cards
- [ ] Glass morphism effect
- [ ] Neon borders on hover
- [ ] Flip animations for tips/gotchas
- [ ] Generous internal padding
- [ ] Depth through shadows and layering

### Interactive Elements
- [ ] Clear hover states
- [ ] Focus indicators for accessibility
- [ ] Loading states for async actions
- [ ] Error states with helpful messages

---

## Responsive Design

### Mobile-First Approach
- [ ] Base styles for mobile (375px)
- [ ] Enhanced experience for tablet (768px)
- [ ] Full experience for desktop (1920px)
- [ ] Touch targets ≥ 44×44px

### Breakpoints
- [ ] Mobile: 375px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px+

### Content Adaptation
- [ ] Text scales appropriately (clamp())
- [ ] Layout stacks on mobile
- [ ] Navigation transforms (hamburger menu)
- [ ] Images scale and optimize

---

## Accessibility Standards

### WCAG AAA Compliance
- [ ] Color contrast ratio ≥ 7:1
- [ ] Keyboard navigation support
- [ ] ARIA labels for interactive elements
- [ ] Focus indicators on all interactive elements
- [ ] Screen reader testing

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Semantic elements (header, nav, main, section, footer)
- [ ] Alt text for images
- [ ] Labels for form inputs

---

## Performance Targets

### Core Web Vitals
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Build Optimization
- [ ] Build size < 200KB (gzipped)
- [ ] Code splitting implemented
- [ ] Images optimized and lazy-loaded
- [ ] CSS minified and purged

---

## Testing Protocol

### Before Committing
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes
- [ ] Manual testing on mobile (375px)
- [ ] Manual testing on tablet (768px)
- [ ] Manual testing on desktop (1920px)
- [ ] Lighthouse score > 90
- [ ] No console errors or warnings

### Playwright Tests
- [ ] Smoke tests pass (@smoke tag)
- [ ] Critical path tests pass (@critical tag)
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Multiple browsers tested (Chromium, Firefox, WebKit)

---

## Meta Story Integration

### Self-Referential Content
- [ ] References the creation process
- [ ] "This section was built using the PIV loop (3 iterations)"
- [ ] "The gradient you see? That was iteration 2"
- [ ] "I used PRP methodology to spec these animations"
- [ ] Specific prompts and examples from actual build

### Transparency
- [ ] Show the work, not just the result
- [ ] Include real prompts used
- [ ] Document iterations and decisions
- [ ] Share failures and learnings

---

## Git Commit Standards

Each commit must include:
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test:e2e`
- [ ] devlog.md updated with what was done
- [ ] Commit message follows conventional commits
- [ ] Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

### Commit Message Format
```
type(scope): description

[optional body explaining what and why]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Final Validation Questions

Before deploying, ask yourself:

1. **Is it distinctive?** Would someone recognize this as our project?
2. **Is it minimal?** Is every element absolutely necessary?
3. **Is it intentional?** Does every design decision have a reason?
4. **Is it performant?** Does it load fast and run smoothly?
5. **Is it accessible?** Can everyone use it?
6. **Is it tested?** Do all tests pass?

If you can answer "yes" to all six, you're in King Mode. 🚀

---

## King Mode Commands

```bash
# Run full test suite
npm run test:all

# Build and verify
npm run build && npm run test:e2e

# Check accessibility
npm run test:e2e -- --grep "@a11y"

# Visual regression
npm run test:e2e:visual

# Deploy to Render
git push origin main  # Auto-deploys
```

---

**Remember**: This page is proof of the process. Build it using PIV × PRP, document the journey, and show your work.

> "Reduction is the ultimate sophistication."
