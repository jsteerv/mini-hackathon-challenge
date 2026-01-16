/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonOrange: '#ff6b35',
        teal: '#00d9c0',
        deepSlate: '#0a0e27',
        slateDark: '#0f1529',
        slateLight: '#1a2133',
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'glow': {
          from: { textShadow: '0 0 10px rgba(255, 107, 53, 0.5)' },
          to: { textShadow: '0 0 20px rgba(255, 107, 53, 0.8), 0 0 30px rgba(255, 107, 53, 0.6)' },
        },
      },
    },
  },
}
