import { expect, test } from "@playwright/test";

test("home is a landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "split" })).toBeVisible();
  await expect(page.getByText("Who paid, and who settles.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();
});

test("a group link asks for sign-in", async ({ page }) => {
  await page.goto("/g/00000000-0000-4000-8000-000000000000");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await expect(page.getByRole("heading", { name: "split" })).toBeVisible();
});

test("a bad group id is not found", async ({ page }) => {
  expect((await page.goto("/g/nope"))?.status()).toBe(404);
  await expect(page.getByText("Not found.")).toBeVisible();
});

test("theme, focus, and mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);
});
