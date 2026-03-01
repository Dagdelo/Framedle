import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useAnimations } from './useAnimations'
import type { AnimationStyle } from './useAnimations'

describe('useAnimations — preset selection', () => {
  const styles: AnimationStyle[] = ['neon', 'paper', 'vapor', 'brutal', 'soft']

  it.each(styles)('returns a preset for style "%s"', (style) => {
    const { preset } = useAnimations(style)
    expect(preset.value).toBeDefined()
    expect(preset.value.entrance).toBeDefined()
    expect(preset.value.exit).toBeDefined()
    expect(preset.value.hover).toBeDefined()
    expect(typeof preset.value.stagger).toBe('number')
    expect(typeof preset.value.spring.stiffness).toBe('number')
    expect(typeof preset.value.spring.damping).toBe('number')
  })

  it('accepts a string literal directly', () => {
    const { preset } = useAnimations('neon')
    expect(preset.value.stagger).toBe(0.08)
  })

  it('accepts a reactive ref and reflects changes', () => {
    const style = ref<AnimationStyle>('brutal')
    const { preset } = useAnimations(style)
    expect(preset.value.stagger).toBe(0)
    style.value = 'soft'
    expect(preset.value.stagger).toBe(0.1)
  })

  it('neon preset has a higher spring stiffness than paper (more responsive)', () => {
    const { preset: neon } = useAnimations('neon')
    const { preset: paper } = useAnimations('paper')
    expect(neon.value.spring.stiffness).toBeGreaterThan(paper.value.spring.stiffness)
  })

  it('brutal preset has zero stagger (no animation delay)', () => {
    const { preset } = useAnimations('brutal')
    expect(preset.value.stagger).toBe(0)
  })

  it('returns derived computed refs for entrance, exit, hover, stagger, spring', () => {
    const { entrance, exit, hover, stagger, spring } = useAnimations('soft')
    expect(entrance.value).toBeDefined()
    expect(exit.value).toBeDefined()
    expect(hover.value).toBeDefined()
    expect(typeof stagger.value).toBe('number')
    expect(spring.value).toHaveProperty('stiffness')
    expect(spring.value).toHaveProperty('damping')
  })
})
