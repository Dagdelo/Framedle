import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreDisplay from './ScoreDisplay.vue'

describe('ScoreDisplay — formatTime rendering', () => {
  it('displays 0:00 for 0 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 0, maxTime: 60 } })
    expect(wrapper.text()).toContain('0:00')
  })

  it('displays 1:00 for 60 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 60, maxTime: 120 } })
    expect(wrapper.text()).toContain('1:00')
  })

  it('displays 0:09 for 9 seconds (zero-pads seconds)', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 9, maxTime: 60 } })
    expect(wrapper.text()).toContain('0:09')
  })

  it('displays 10:00 for 600 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 600, maxTime: 600 } })
    expect(wrapper.text()).toContain('10:00')
  })

  it('displays 1:30 for 90 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 90, maxTime: 180 } })
    expect(wrapper.text()).toContain('1:30')
  })
})

describe('ScoreDisplay — conditional rendering', () => {
  it('renders score when score prop is provided', () => {
    const wrapper = mount(ScoreDisplay, { props: { score: 850 } })
    expect(wrapper.text()).toContain('850')
  })

  it('does not render score section when score prop is absent', () => {
    const wrapper = mount(ScoreDisplay, { props: {} })
    expect(wrapper.text()).not.toContain('Score')
  })

  it('renders streak when streak > 0', () => {
    const wrapper = mount(ScoreDisplay, { props: { streak: 5 } })
    expect(wrapper.text()).toContain('5')
  })

  it('does not render streak section when streak is 0', () => {
    const wrapper = mount(ScoreDisplay, { props: { streak: 0 } })
    expect(wrapper.text()).not.toContain('Streak')
  })

  it('does not render streak section when streak prop is absent', () => {
    const wrapper = mount(ScoreDisplay, { props: {} })
    expect(wrapper.text()).not.toContain('Streak')
  })

  it('renders time section when timeRemaining is provided', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 30, maxTime: 60 } })
    expect(wrapper.text()).toContain('Time')
  })

  it('applies urgent class when timeRemaining < 10', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 9, maxTime: 60 } })
    const timeEl = wrapper.find('.text-variant-incorrect')
    expect(timeEl.exists()).toBe(true)
  })

  it('does not apply urgent class when timeRemaining >= 10', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 10, maxTime: 60 } })
    const timeEl = wrapper.find('.text-variant-incorrect')
    expect(timeEl.exists()).toBe(false)
  })
})
