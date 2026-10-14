import { test, expect } from '@playwright/test'
import { expectFocusAndTheme, expectHeaders, expectShell, prepare } from './smoke'

test('soon', async ({ page }) => {
  await prepare(page)
  await page.goto('/')
  await expectShell(page, 'soon')
  await expect(page.getByText('A date, a countdown, a page you can send.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()
  await page.screenshot({ path: '/opt/cursor/artifacts/soon.png', fullPage: true })
  await expectFocusAndTheme(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expectShell(page, 'soon')
  const signIn = await page.goto('/sign-in')
  expect(signIn?.status()).toBeLessThan(500)
  await page.goto('/e/not-a-real-slug')
  await expect(page.getByRole('heading', { level: 1, name: 'soon' })).toBeVisible()
  await expect(page.getByText(/could not load|not found/)).toBeVisible()
  await page.goto('/')
  await expectHeaders(page, 'strict-origin-when-cross-origin')
})
