import { test, expect } from '@playwright/test'

test('compare page renders at /compare', async ({ page }) => {
  await page.goto('/compare')
  await expect(page).not.toHaveTitle(/error/i)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('compare page contains links to all 5 variants', async ({ page }) => {
  await page.goto('/compare')
  for (let i = 1; i <= 5; i++) {
    const link = page.locator(`[href*="variant=${i}"]`).first()
    await expect(link).toBeVisible()
  }
})

test('compare page is server-side rendered (content in initial HTML)', async ({ page }) => {
  const response = await page.goto('/compare')
  const html = await response!.text()
  expect(html).toContain('Neon Cinema')
  expect(html).toContain('Paper Cut')
  expect(html).toContain('Vapor Grid')
  expect(html).toContain('Brutal Mono')
  expect(html).toContain('Soft Focus')
})
