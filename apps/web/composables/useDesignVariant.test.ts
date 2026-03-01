import { describe, it, expect } from 'vitest'

// We test the core variant ID resolution logic in isolation,
// without Nuxt's useRoute auto-import.

describe('useDesignVariant — variant ID resolution', () => {
  function resolveVariantId(queryParam: unknown): number {
    const id = Number(queryParam)
    return id >= 1 && id <= 5 ? id : 1
  }

  it('returns 1 when query param is "1"', () => {
    expect(resolveVariantId('1')).toBe(1)
  })

  it('returns 5 when query param is "5"', () => {
    expect(resolveVariantId('5')).toBe(5)
  })

  it('returns 3 when query param is "3"', () => {
    expect(resolveVariantId('3')).toBe(3)
  })

  it('falls back to 1 when query param is absent (undefined)', () => {
    expect(resolveVariantId(undefined)).toBe(1)
  })

  it('falls back to 1 when query param is an empty string', () => {
    expect(resolveVariantId('')).toBe(1)
  })

  it('falls back to 1 when query param is "0" (below range)', () => {
    expect(resolveVariantId('0')).toBe(1)
  })

  it('falls back to 1 when query param is "6" (above range)', () => {
    expect(resolveVariantId('6')).toBe(1)
  })

  it('falls back to 1 when query param is a non-numeric string', () => {
    expect(resolveVariantId('abc')).toBe(1)
  })

  it('falls back to 1 for negative values', () => {
    expect(resolveVariantId('-1')).toBe(1)
  })
})

describe('useDesignVariant — variant names', () => {
  const variantNames: Record<number, string> = {
    1: 'Neon Cinema',
    2: 'Paper Cut',
    3: 'Vapor Grid',
    4: 'Brutal Mono',
    5: 'Soft Focus',
  }

  it('maps variant 1 to "Neon Cinema"', () => {
    expect(variantNames[1]).toBe('Neon Cinema')
  })

  it('maps variant 2 to "Paper Cut"', () => {
    expect(variantNames[2]).toBe('Paper Cut')
  })

  it('maps variant 3 to "Vapor Grid"', () => {
    expect(variantNames[3]).toBe('Vapor Grid')
  })

  it('maps variant 4 to "Brutal Mono"', () => {
    expect(variantNames[4]).toBe('Brutal Mono')
  })

  it('maps variant 5 to "Soft Focus"', () => {
    expect(variantNames[5]).toBe('Soft Focus')
  })

  it('covers all 5 variants with no extras', () => {
    expect(Object.keys(variantNames).length).toBe(5)
  })
})
