import type { VariantTheme } from '../types'

export const v1Theme: VariantTheme = {
  id: 1,
  name: 'Neon Cinema',
  description: 'Late-night movie theater marquee — arcade, cinematic, nocturnal',
  colors: {
    bg: '#0a0a0a',
    bgSecondary: '#141414',
    fg: '#f0f0f0',
    fgMuted: '#888888',
    accent: '#00f0ff',
    accent2: '#ff00aa',
    accent3: '#f0ff00',
    muted: '#1a1a1a',
    border: '#00f0ff33',
    card: '#111111',
    cardFg: '#f0f0f0',
    correct: '#00ff88',
    incorrect: '#ff3333',
  },
  fonts: {
    heading: 'font-display-condensed',
    body: 'font-mono-brutal',
  },
  radius: '4px',
  shadow: '0 0 15px rgba(0, 240, 255, 0.15)',
  shadowLg: '0 0 30px rgba(0, 240, 255, 0.25)',
  animation: 'neon',
}
