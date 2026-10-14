import { expect, type Page } from '@playwright/test'

export async function prepare(page: Page) {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
}

export async function expectShell(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/TODO|placeholder|lorem|vercel\.app/i)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  expect(overflow).toBe(true)
}

export async function expectFocusAndTheme(page: Page) {
  await page.keyboard.press('Tab')
  const outlined = await page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body) return false
    const style = getComputedStyle(element)
    return style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
  })
  expect(outlined).toBe(true)
  await page.getByRole('button', { name: 'Theme' }).click()
  await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await page.getByRole('button', { name: 'Theme' }).click()
}

export async function expectHeaders(page: Page, referrer: string) {
  const response = await page.goto(page.url())
  expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  expect(response?.headers()['x-frame-options']).toBe('DENY')
  expect(response?.headers()['referrer-policy']).toBe(referrer)
  const csp = response?.headers()['content-security-policy'] ?? ''
  expect(csp).toContain('https://clerk.millard.ink')
  expect(csp).not.toContain('vercel.app')
  expect(csp).not.toContain('clerk-telemetry')
  expect(response?.headers()['x-powered-by']).toBeUndefined()
}
