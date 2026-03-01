import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareButton from './ShareButton.vue'

// navigator.clipboard is not available in happy-dom — stub it.
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
})

describe('ShareButton — generateShareText()', () => {
  it('produces header with game mode name', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 850, guesses: 2, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('Framedle Daily Frame')
  })

  it('shows fraction guesses/maxGuesses when won', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 850, guesses: 2, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('2/6')
  })

  it('shows X/maxGuesses when lost', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 0, guesses: 6, maxGuesses: 6, won: false },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('X/6')
  })

  it('places a green square at the winning guess position', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 1000, guesses: 1, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('🟩')
    expect(text).toContain('⬛⬛⬛⬛⬛')
  })

  it('shows all red squares followed by green on last guess (won on guess 6)', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 100, guesses: 6, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('🟥🟥🟥🟥🟥🟩')
  })

  it('shows all red squares when lost', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 0, guesses: 6, maxGuesses: 6, won: false },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).not.toContain('🟩')
    expect(text).toContain('🟥')
  })

  it('always includes the framedle.wtf URL', () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 3, maxGuesses: 6 },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('https://framedle.wtf')
  })

  it('defaults gameMode to "Daily" when prop is not provided', () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 1, maxGuesses: 6 },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('Framedle Daily')
  })
})

describe('ShareButton — share() interaction', () => {
  beforeEach(() => writeTextMock.mockClear())

  it('calls clipboard.writeText with the share text on click', async () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6, gameMode: 'Daily Frame' },
    })
    await wrapper.find('button').trigger('click')
    expect(writeTextMock).toHaveBeenCalledOnce()
    const written: string = writeTextMock.mock.calls[0][0]
    expect(written).toContain('Framedle Daily Frame')
  })

  it('shows "Copied!" text immediately after a successful copy', async () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6 },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Copied!')
  })

  it('reverts to "Share Result" text after 2 seconds', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6 },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(2001)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Share Result')
    vi.useRealTimers()
  })
})
