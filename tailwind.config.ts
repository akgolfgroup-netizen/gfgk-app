import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      colors: {
        gfgk: {
          black: '#0A0A0A',
          charcoal: '#1F1F1F',
          gold: '#F5C518',
          'gold-deep': '#D9A800',
          'gold-light': '#FFF4D6',
          red: '#E94B3C',
          'red-deep': '#C43A2C',
          'red-light': '#FCE9E5',
          teal: '#2BA8B0',
          'teal-deep': '#1F8089',
          'teal-light': '#DCF1F2',
          cream: '#FAF7EE',
          'cream-deep': '#F2EDE0',
          text: '#1B1B1B',
          'text-2': '#5A5A5A',
          'text-3': '#9C9C9C',
          border: '#E5E0D6',
          'border-strong': '#C9C2B3',
        },
      },
    },
  },
  plugins: [animate],
}

export default config
