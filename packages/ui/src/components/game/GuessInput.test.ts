import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuessInput from './GuessInput.vue'

describe('GuessInput — submission', () => {
  it('emits "submit" with the typed value when form is submitted', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('My Guess')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['My Guess']])
  })

  it('trims whitespace before emitting', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('  Padded Guess  ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['Padded Guess']])
  })

  it('clears the input after submission', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('Something')
    await wrapper.find('form').trigger('submit')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('does not emit when the input is empty', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('does not emit when the input is only whitespace', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})

describe('GuessInput — disabled state', () => {
  it('disables the input field when disabled prop is true', () => {
    const wrapper = mount(GuessInput, { props: { disabled: true } })
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('disables the submit button when disabled prop is true', () => {
    const wrapper = mount(GuessInput, { props: { disabled: true } })
    expect((wrapper.find('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables the submit button when input is empty', () => {
    const wrapper = mount(GuessInput, { props: {} })
    expect((wrapper.find('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('GuessInput — suggestions dropdown', () => {
  it('shows suggestions list when suggestions are provided and input is focused', async () => {
    const wrapper = mount(GuessInput, {
      props: { suggestions: ['Option A', 'Option B', 'Option C'] },
    })
    await wrapper.find('input').trigger('focus')
    const buttons = wrapper.findAll('button[type="button"]')
    expect(buttons.length).toBe(3)
    expect(buttons[0].text()).toBe('Option A')
  })

  it('emits "submit" with suggestion text when a suggestion is clicked', async () => {
    const wrapper = mount(GuessInput, {
      props: { suggestions: ['Option A', 'Option B'] },
    })
    await wrapper.find('input').trigger('focus')
    await wrapper.findAll('button[type="button"]')[1].trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['Option B']])
  })

  it('hides suggestions list when no suggestions are provided', async () => {
    const wrapper = mount(GuessInput, { props: { suggestions: [] } })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })

  it('uses the placeholder prop when provided', () => {
    const wrapper = mount(GuessInput, {
      props: { placeholder: 'Type a video title...' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Type a video title...')
  })

  it('uses the default placeholder when placeholder prop is not provided', () => {
    const wrapper = mount(GuessInput, { props: {} })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Guess the video...')
  })
})
