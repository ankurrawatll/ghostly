/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./sidepanel.html",
    "./offscreen.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#07080B',
        base: '#0B0C10',
        card: '#12131A',
        cardHover: '#181922',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassBorderHover: 'rgba(255, 255, 255, 0.16)',
        plasma: {
          violet: '#8B5CF6',
          fuchsia: '#D946EF',
          indigo: '#6366F1',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'glow-violet': '0 0 35px -5px rgba(139, 92, 246, 0.3)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.3)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.3)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backgroundImage: {
        'plasma-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #6366F1 100%)',
        'aurora-gradient': 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
        'spark-gradient': 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)'
      }
    },
  },
  plugins: [],
}
