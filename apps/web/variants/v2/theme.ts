import type { VariantTheme } from '../types'

export const v2Theme: VariantTheme = {
  id: 2,
  name: 'Paper Cut',
  description: 'Handcrafted paper collage / scrapbook — warm, tactile, analog nostalgia',
  colors: {
    bg: '#faf3e0',
    bgSecondary: '#f5ead0',
    fg: '#2d2416',
    fgMuted: '#7a6d5c',
    accent: '#c46d3e',
    accent2: '#6b7c4e',
    accent3: '#6b8fad',
    muted: '#e8dcc8',
    border: '#c4a97d',
    card: '#ffffff',
    cardFg: '#2d2416',
    correct: '#5a8a4e',
    incorrect: '#c44040',
  },
  fonts: {
    heading: 'font-handwritten',
    body: 'font-serif-body',
  },
  radius: '2px',
  shadow: '3px 3px 0px rgba(0, 0, 0, 0.08)',
  shadowLg: '6px 6px 0px rgba(0, 0, 0, 0.1)',
  animation: 'paper',
}
