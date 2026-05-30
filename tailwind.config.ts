import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        // To-lags kort-skygge fra GFGK-designsystemet (mer dybde)
        card: '0 1px 2px rgba(10,10,10,0.04), 0 4px 16px rgba(10,10,10,0.04)',
        'card-hover': '0 2px 4px rgba(10,10,10,0.06), 0 12px 32px rgba(10,10,10,0.10)',
        hero: '0 8px 32px rgba(10,10,10,0.12)',
        sheet: '0 -8px 40px rgba(10,10,10,0.12)',
        fab: '0 6px 16px rgba(10,10,10,0.24)',
        'gold-glow': '0 24px 64px rgba(255,204,0,0.22)',
      },
      colors: {
        gfgk: {
          // Merkefarger fra GFGK-designsystemet (sterkere, mer levende)
          black: '#0A0A0A',
          charcoal: '#1F1F1F',
          gold: '#FFCC00',
          'gold-deep': '#E6B800',
          'gold-light': '#FFFAEA',
          red: '#E04040',
          'red-deep': '#C42E2E',
          'red-light': '#FFF5F5',
          teal: '#0090A0',
          'teal-deep': '#00727F',
          'teal-light': '#F4FAFB',
          cream: '#FAFAF8',
          'cream-deep': '#F5F5F4',
          text: '#0A0A0A',
          'text-2': '#3D3D3D',
          'text-3': '#5E5E5E',
          border: '#E6E4E0',
          'border-strong': '#D4D1CB',
        },
      },
    },
  },
  plugins: [animate],
}

export default config
