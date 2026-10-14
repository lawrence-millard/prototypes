import { expect, test } from "@playwright/test"
import { mkdir } from "node:fs/promises"

const banned = ["todo", "fixme", "lorem", "vercel.app", "placeholder", "debug", "welcome", "click here"]

test("main screen", async ({ page }) => {
  const third: string[] = []
  page.on("request", (request) => {
    const url = request.url()
    if (!url.startsWith("http://127.0.0.1") && !url.startsWith("data:")) third.push(url)
  })
  const response = await page.goto("/")
  expect(response?.status()).toBe(200)
  expect(response?.headers()["x-frame-options"]).toBe("DENY")
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff")
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer")
  expect(response?.headers()["strict-transport-security"]).toContain("max-age=63072000")
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'")
  expect(response?.headers()["content-security-policy"]).toContain("https://clerk.millard.ink")
  expect(response?.headers()["content-security-policy"]).not.toContain("vercel.app")
  expect(response?.headers()["x-powered-by"]).toBeUndefined()
  await expect(page).toHaveTitle("paste")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("paste")
  await expect(page.getByText("Text that expires, kept with your account.")).toBeVisible()
  await expect(page.locator(".preview")).toBeVisible()
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible()
  const text = (await page.locator("body").innerText()).toLowerCase()
  for (const word of banned) expect(text).not.toContain(word)
  expect(third).toEqual([])
  await mkdir("/opt/cursor/artifacts", { recursive: true })
  await page.screenshot({ path: "/opt/cursor/artifacts/paste.png" })
})

test("keyboard, theme, and mobile", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "paste" })).toBeFocused()
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)
  expect(outline).not.toBe("none")
  await page.getByRole("button", { name: "theme" }).click()
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark")
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(0, 0, 0)")
  await page.reload()
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark")
  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(overflow).toBe(false)
})

test("save asks for sign in", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Sign in" }).click()
  await page.waitForURL("**/sign-in")
  await expect(page).toHaveTitle("sign in · paste")
  await expect(page.getByRole("link", { name: "sign up" })).toBeVisible()
})

