/**
 * Design Tokens for "Iterate Like A Pro"
 * Cyberpunk × Sunset aesthetic
 */

export const tokens = {
  colors: {
    // Primary palette
    neonOrange: '#ff6b35',
    teal: '#00d9c0',

    // Backgrounds
    deepSlate: '#0a0e27',
    slateDark: '#0f1529',
    slateLight: '#1a2133',

    // Semantic colors
    text: {
      primary: '#ffffff',
      secondary: '#a0aec0',
      muted: '#718096',
    },
  },

  spacing: {
    section: '5rem', // py-20
    container: '1.5rem', // px-6
  },

  typography: {
    h1: {
      size: 'clamp(2.5rem, 5vw, 4.5rem)',
      weight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    h2: {
      size: 'clamp(2rem, 4vw, 3rem)',
      weight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '1.5rem',
      weight: '600',
      lineHeight: '1.3',
    },
    body: {
      size: '1rem',
      weight: '400',
      lineHeight: '1.6',
    },
    code: {
      size: '0.875rem',
      weight: '400',
      lineHeight: '1.5',
    },
  },

  effects: {
    glow: {
      subtle: '0 0 10px rgba(255, 107, 53, 0.3)',
      medium: '0 0 20px rgba(255, 107, 53, 0.5)',
      strong: '0 0 30px rgba(255, 107, 53, 0.7)',
    },
    glass: {
      bg: 'rgba(26, 33, 51, 0.8)',
      blur: 'backdrop-blur-sm',
      border: 'border border-white/10',
    },
  },

  animations: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '600ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export default tokens;
