import { expect, test } from "@playwright/test";

test("home renders the bookmark form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "marks" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "URL" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});

test("rejects a url that is not http", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "URL" }).fill("not a url");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p.error")).toHaveText("Enter an http or https URL.");
});

test("asks for sign-in before saving a link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "URL" }).fill("https://example.com/docs");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p.error")).toHaveText("Sign in required.");
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

test("sign-in and unknown routes", async ({ page }) => {
  const signIn = await page.goto("/sign-in");
  expect(signIn?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "marks" })).toBeVisible();
  const missing = await page.goto("/missing");
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("Not found.")).toBeVisible();
});
