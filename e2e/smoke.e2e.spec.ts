import { test, expect } from '@playwright/test'

test('smoke: runner executes and returns', async ({ page }) => {
  await page.setContent('<!doctype html><html><body><h1>Gleaned</h1></body></html>')
  await expect(page.locator('h1')).toHaveText('Gleaned')
})

