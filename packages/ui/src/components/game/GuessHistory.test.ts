import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuessHistory from './GuessHistory.vue'
import type { Guess } from './types'

const makeGuess = (overrides: Partial<Guess> = {}): Guess => ({
  id: Math.random().toString(36).slice(2),
  text: 'Some Video Title',
  correct: false,
  ...overrides,
})

describe('GuessHistory', () => {
  it('shows "No guesses yet" when the guesses array is empty', () => {
    const wrapper = mount(GuessHistory, { props: { guesses: [] } })
    expect(wrapper.text()).toContain('No guesses yet')
  })

  it('renders one row per guess', () => {
    const guesses = [makeGuess(), makeGuess(), makeGuess()]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.findAll('.flex.items-center').length).toBe(3)
  })

  it('shows a checkmark icon for correct guesses', () => {
    const guesses = [makeGuess({ correct: true, text: 'Right Answer' })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.text()).toContain('✓')
    expect(wrapper.text()).toContain('Right Answer')
  })

  it('shows an X icon for incorrect guesses', () => {
    const guesses = [makeGuess({ correct: false, text: 'Wrong Answer' })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.text()).toContain('✗')
    expect(wrapper.text()).toContain('Wrong Answer')
  })

  it('applies correct color class to correct guess rows', () => {
    const guesses = [makeGuess({ correct: true })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    const row = wrapper.find('.border-variant-correct\\/50')
    expect(row.exists()).toBe(true)
  })

  it('applies neutral border class to incorrect guess rows', () => {
    const guesses = [makeGuess({ correct: false })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    const row = wrapper.find('.border-variant-border')
    expect(row.exists()).toBe(true)
  })

  it('respects maxVisible and truncates the list', () => {
    const guesses = Array.from({ length: 6 }, () => makeGuess())
    const wrapper = mount(GuessHistory, { props: { guesses, maxVisible: 3 } })
    expect(wrapper.findAll('.flex.items-center').length).toBe(3)
  })

  it('defaults maxVisible to 6 when not provided', () => {
    const guesses = Array.from({ length: 8 }, () => makeGuess())
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.findAll('.flex.items-center').length).toBe(6)
  })
})
