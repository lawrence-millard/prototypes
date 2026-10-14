import { test, expect } from '@playwright/test'
import { expectFocusAndTheme, expectHeaders, expectShell, prepare } from './smoke'

const id = 'abcdefghijklmnop'
const key = 'A'.repeat(43)

test('secret', async ({ page }) => {
  await prepare(page)
  await page.goto('/')
  await expectShell(page, 'secret')
  await expect(page.getByText('no links')).toBeVisible()
  await page.screenshot({ path: '/opt/cursor/artifacts/secret.png', fullPage: true })
  await page.getByLabel('secret').fill('one time')
  await page.getByRole('button', { name: 'create' }).click()
  await expect(page.locator('.err')).toHaveText('sign in required.')
  await expectFocusAndTheme(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expectShell(page, 'secret')
  const signIn = await page.goto('/sign-in')
  expect(signIn?.status()).toBeLessThan(500)
  await page.goto(`/v/${id}`)
  await expect(page.getByText('missing key.')).toBeVisible()
  await page.goto('about:blank')
  await page.goto(`/v/${id}#${key}`)
  await expect(page.getByRole('button', { name: 'open' })).toBeVisible()
  await page.getByRole('button', { name: 'open' }).click()
  await expect(page.locator('.err')).toHaveText(/could not open|gone/)
  await page.goto('/')
  await expectHeaders(page, 'no-referrer')
})
