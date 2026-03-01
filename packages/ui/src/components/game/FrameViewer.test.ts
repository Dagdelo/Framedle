import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FrameViewer from './FrameViewer.vue'

describe('FrameViewer', () => {
  it('renders the frame image when imageUrl is provided', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/frame.webp')
  })

  it('shows loading placeholder text when imageUrl is not provided', () => {
    const wrapper = mount(FrameViewer, { props: {} })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Loading frame...')
  })

  it('applies blur filter when blurLevel > 0', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp', blurLevel: 8 },
    })
    const img = wrapper.find('img')
    expect(img.attributes('style')).toContain('blur(8px)')
  })

  it('applies no blur when blurLevel is 0', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp', blurLevel: 0 },
    })
    const img = wrapper.find('img')
    expect(img.attributes('style')).toContain('blur(0px)')
  })

  it('shows round counter when round and totalRounds are both provided', () => {
    const wrapper = mount(FrameViewer, {
      props: {
        imageUrl: 'https://example.com/frame.webp',
        round: 2,
        totalRounds: 6,
      },
    })
    expect(wrapper.text()).toContain('2 / 6')
  })

  it('does not show round counter when round is not provided', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp' },
    })
    expect(wrapper.text()).not.toContain('/')
  })
})
