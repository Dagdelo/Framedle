import type { VariantTheme } from '~/variants/types'
import { v1Theme } from '~/variants/v1/theme'
import { v2Theme } from '~/variants/v2/theme'
import { v3Theme } from '~/variants/v3/theme'
import { v4Theme } from '~/variants/v4/theme'
import { v5Theme } from '~/variants/v5/theme'

const themes: Record<number, VariantTheme> = {
  1: v1Theme,
  2: v2Theme,
  3: v3Theme,
  4: v4Theme,
  5: v5Theme,
}

export const variantNames: Record<number, string> = {
  1: 'Neon Cinema',
  2: 'Paper Cut',
  3: 'Vapor Grid',
  4: 'Brutal Mono',
  5: 'Soft Focus',
}

export function useDesignVariant() {
  const route = useRoute()
  const { activeVariantId } = useTheme()

  const variantId = computed(() => {
    // Query param override for preview
    const param = route.query.variant
    const id = Number(param)
    if (id >= 1 && id <= 5) return id
    // Fall back to API-configured theme
    return activeVariantId.value
  })

  const theme = computed(() => themes[variantId.value])
  const variantName = computed(() => variantNames[variantId.value])

  const cssVariables = computed(() => {
    const t = theme.value
    return {
      '--variant-bg': t.colors.bg,
      '--variant-bg-secondary': t.colors.bgSecondary,
      '--variant-fg': t.colors.fg,
      '--variant-fg-muted': t.colors.fgMuted,
      '--variant-accent': t.colors.accent,
      '--variant-accent-2': t.colors.accent2,
      '--variant-accent-3': t.colors.accent3,
      '--variant-muted': t.colors.muted,
      '--variant-border': t.colors.border,
      '--variant-card': t.colors.card,
      '--variant-card-fg': t.colors.cardFg,
      '--variant-correct': t.colors.correct,
      '--variant-incorrect': t.colors.incorrect,
      '--variant-radius': t.radius,
      '--variant-shadow': t.shadow,
      '--variant-shadow-lg': t.shadowLg,
    }
  })

  return {
    variantId,
    theme,
    variantName,
    cssVariables,
  }
}
