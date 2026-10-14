import { test, expect } from '@playwright/test'
import { expectFocusAndTheme, expectHeaders, expectShell, prepare } from './smoke'

test('cards', async ({ page }) => {
  await prepare(page)
  await page.goto('/')
  await expectShell(page, 'cards')
  await expect(page.getByText('no decks')).toBeVisible()
  await page.screenshot({ path: '/opt/cursor/artifacts/cards.png', fullPage: true })
  await page.getByLabel('name').fill('verbs')
  await page.getByRole('button', { name: 'add' }).click()
  await expect(page.locator('.err')).toHaveText('sign in required.')
  await expect(page.getByText('no decks')).toBeVisible()
  await expectFocusAndTheme(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expectShell(page, 'cards')
  const signIn = await page.goto('/sign-in')
  expect(signIn?.status()).toBeLessThan(500)
  await expect(page.getByRole('heading', { level: 1, name: 'cards' })).toBeVisible()
  await page.goto('/')
  await expectHeaders(page, 'strict-origin-when-cross-origin')
})
