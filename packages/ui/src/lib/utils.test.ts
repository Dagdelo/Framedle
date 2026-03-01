import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn()', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple classes into a single string', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('resolves Tailwind conflicts by keeping the last class', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('resolves padding conflicts by keeping the last value', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('conditionally includes a class when the condition is true', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('omits a class when the condition is false', () => {
    expect(cn('base', false && 'hidden')).toBe('base')
  })

  it('omits undefined values without throwing', () => {
    expect(cn('base', undefined)).toBe('base')
  })

  it('omits null values without throwing', () => {
    expect(cn('base', null)).toBe('base')
  })

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center')
  })

  it('handles object inputs where truthy keys are included', () => {
    expect(cn({ flex: true, hidden: false, 'text-sm': true })).toBe('flex text-sm')
  })
})
