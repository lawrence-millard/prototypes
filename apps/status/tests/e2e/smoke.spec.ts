import { expect, test } from "@playwright/test";

test("home renders the check form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "status" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "URL" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
});

test("rejects a private address before sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "URL" }).fill("http://127.0.0.1/");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p.error")).toHaveText("That URL is not allowed.");
});

test("rejects a non-http url", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "URL" }).fill("not a url");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p.error")).toHaveText("Enter an http or https URL.");
});

test("asks for sign-in before saving a public url", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "URL" }).fill("https://example.com");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p.error")).toHaveText("Sign in required.");
});

test("refresh asks for sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.locator("p.error")).toHaveText("Sign in required.");
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
