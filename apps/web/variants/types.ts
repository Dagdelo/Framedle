export interface VariantTheme {
  id: number
  name: string
  description: string
  colors: {
    bg: string
    bgSecondary: string
    fg: string
    fgMuted: string
    accent: string
    accent2: string
    accent3: string
    muted: string
    border: string
    card: string
    cardFg: string
    correct: string
    incorrect: string
  }
  fonts: {
    heading: string
    body: string
  }
  radius: string
  shadow: string
  shadowLg: string
  animation: 'neon' | 'paper' | 'vapor' | 'brutal' | 'soft'
}
