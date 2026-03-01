import type { VariantTheme } from '../types'

export const v3Theme: VariantTheme = {
  id: 3,
  name: 'Vapor Grid',
  description: 'Retro-futurism / vaporwave / CRT monitor — synthwave, nostalgic future',
  colors: {
    bg: '#1a0030',
    bgSecondary: '#250048',
    fg: '#ffffff',
    fgMuted: '#b8a0d0',
    accent: '#ff6b9d',
    accent2: '#c44dff',
    accent3: '#4d79ff',
    muted: '#2a1050',
    border: '#c44dff44',
    card: '#200040',
    cardFg: '#ffffff',
    correct: '#00ff99',
    incorrect: '#ff4444',
  },
  fonts: {
    heading: 'font-orbitron',
    body: 'font-geometric',
  },
  radius: '8px',
  shadow: '0 4px 20px rgba(196, 77, 255, 0.2)',
  shadowLg: '0 8px 40px rgba(196, 77, 255, 0.3)',
  animation: 'vapor',
}
