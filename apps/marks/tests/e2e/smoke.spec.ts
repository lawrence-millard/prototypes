import { expect, test } from "@playwright/test";

test("home is a landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "marks" })).toBeVisible();
  await expect(page.getByText("Links you can find again.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();
});

test("sign in opens the sign-in page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).last().click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: "marks" })).toBeVisible();
});

test("theme persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("keyboard focus is visible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");
});

test("mobile layout does not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);
});

test("unknown routes", async ({ page }) => {
  const missing = await page.goto("/missing");
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("Not found.")).toBeVisible();
});
