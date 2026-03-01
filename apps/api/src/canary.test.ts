import { describe, it, expect } from 'vitest'
describe('test toolchain', () => {
  it('vitest is configured and running in apps/api', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
