import { expect, test } from "@playwright/test";

test("home renders the poll form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "poll" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Question" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Option 1" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Option 2" })).toBeVisible();
});

test("add option reveals a third field", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add option" }).click();
  await expect(page.getByRole("textbox", { name: "Option 3" })).toBeVisible();
});

test("two options are required", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Question" }).fill("Lunch?");
  await page.getByRole("textbox", { name: "Option 1" }).fill("Soup");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("p.error")).toHaveText("Add two options.");
});

test("creating a valid poll asks for sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Question" }).fill("Lunch?");
  await page.getByRole("textbox", { name: "Option 1" }).fill("Soup");
  await page.getByRole("textbox", { name: "Option 2" }).fill("Salad");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("p.error")).toHaveText("Sign in required.");
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
