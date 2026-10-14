import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const screenshots = '/opt/cursor/artifacts/screenshots'

test('password login is shown when Clerk is off', async ({ page }) => {
  mkdirSync(screenshots, { recursive: true })
  await page.goto('/login')
  await expect(page.getByText('Hookbox', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Username')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByText('private')).toHaveCount(0)
  await page.screenshot({ path: path.join(screenshots, 'hookbox-login.png'), fullPage: true })
})
