import type { VariantTheme } from '../types'

export const v4Theme: VariantTheme = {
  id: 4,
  name: 'Brutal Mono',
  description: 'Developer terminal / brutalist web — raw, functional, anti-design',
  colors: {
    bg: '#ffffff',
    bgSecondary: '#f5f5f5',
    fg: '#000000',
    fgMuted: '#666666',
    accent: '#0066ff',
    accent2: '#ff3333',
    accent3: '#000000',
    muted: '#eeeeee',
    border: '#000000',
    card: '#ffffff',
    cardFg: '#000000',
    correct: '#00aa00',
    incorrect: '#ff0000',
  },
  fonts: {
    heading: 'font-mono-brutal',
    body: 'font-mono-brutal',
  },
  radius: '0px',
  shadow: '4px 4px 0px #000000',
  shadowLg: '8px 8px 0px #000000',
  animation: 'brutal',
}
