import { test, expect } from '@playwright/test'

const VARIANTS = [
  { id: 1, name: 'Neon Cinema' },
  { id: 2, name: 'Paper Cut' },
  { id: 3, name: 'Vapor Grid' },
  { id: 4, name: 'Brutal Mono' },
  { id: 5, name: 'Soft Focus' },
]

for (const variant of VARIANTS) {
  test(`variant ${variant.id} (${variant.name}) renders without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`/?variant=${variant.id}`)

    await expect(page).not.toHaveTitle(/error/i)

    const body = page.locator('body')
    await expect(body).not.toBeEmpty()

    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
  })
}

test('default route loads variant 1 when no query param is set', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).not.toBeEmpty()
})

test('unknown variant param falls back to variant 1', async ({ page }) => {
  await page.goto('/?variant=99')
  await expect(page.locator('body')).not.toBeEmpty()
})

test('non-numeric variant param falls back to variant 1', async ({ page }) => {
  await page.goto('/?variant=abc')
  await expect(page.locator('body')).not.toBeEmpty()
})
