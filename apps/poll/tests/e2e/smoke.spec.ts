import { expect, test } from "@playwright/test";

test("home is a landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "poll" })).toBeVisible();
  await expect(page.getByText("A question, then a shared link.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();
});

test("unknown poll is not found", async ({ page }) => {
  expect((await page.goto("/p/not-a-poll"))?.status()).toBe(404);
  await expect(page.getByText("Not found.")).toBeVisible();
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
