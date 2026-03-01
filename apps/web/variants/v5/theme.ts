import type { VariantTheme } from '../types'

export const v5Theme: VariantTheme = {
  id: 5,
  name: 'Soft Focus',
  description: 'Premium streaming app / modern media player — premium, calm, polished',
  colors: {
    bg: '#1a1a2e',
    bgSecondary: '#16213e',
    fg: '#eaeaea',
    fgMuted: '#8a8a9a',
    accent: '#f4a261',
    accent2: '#e76f51',
    accent3: '#2a9d8f',
    muted: '#252540',
    border: 'rgba(255, 255, 255, 0.08)',
    card: 'rgba(255, 255, 255, 0.05)',
    cardFg: '#eaeaea',
    correct: '#2a9d8f',
    incorrect: '#e76f51',
  },
  fonts: {
    heading: 'font-sans-clean',
    body: 'font-inter',
  },
  radius: '16px',
  shadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
  shadowLg: '0 8px 48px rgba(0, 0, 0, 0.3)',
  animation: 'soft',
}
