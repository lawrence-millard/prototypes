import { expect, test } from "@playwright/test";

test("home is a landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "status" })).toBeVisible();
  await expect(page.getByText("Whether a URL is up.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();
});

test("sign in opens the sign-in page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).last().click();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("theme, focus, and mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);
});

test("sign-in and unknown routes", async ({ page }) => {
  expect((await page.goto("/sign-in"))?.status()).toBe(200);
  expect((await page.goto("/missing"))?.status()).toBe(404);
  await expect(page.getByText("Not found.")).toBeVisible();
});
