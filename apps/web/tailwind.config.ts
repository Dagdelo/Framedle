import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './variants/**/*.{vue,ts}',
    './composables/**/*.ts',
    './app.vue',
    '../../packages/ui/src/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'display-condensed': ['Bebas Neue', 'sans-serif'],
        'handwritten': ['Caveat', 'cursive'],
        'serif-body': ['Lora', 'serif'],
        'geometric': ['Space Grotesk', 'sans-serif'],
        'mono-brutal': ['JetBrains Mono', 'monospace'],
        'sans-clean': ['Plus Jakarta Sans', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        variant: {
          bg: 'var(--variant-bg)',
          'bg-secondary': 'var(--variant-bg-secondary)',
          fg: 'var(--variant-fg)',
          'fg-muted': 'var(--variant-fg-muted)',
          accent: 'var(--variant-accent)',
          'accent-2': 'var(--variant-accent-2)',
          'accent-3': 'var(--variant-accent-3)',
          muted: 'var(--variant-muted)',
          border: 'var(--variant-border)',
          card: 'var(--variant-card)',
          'card-fg': 'var(--variant-card-fg)',
          correct: 'var(--variant-correct)',
          incorrect: 'var(--variant-incorrect)',
        },
      },
      borderRadius: {
        variant: 'var(--variant-radius)',
      },
      boxShadow: {
        variant: 'var(--variant-shadow)',
        'variant-lg': 'var(--variant-shadow-lg)',
      },
    },
  },
} satisfies Config
