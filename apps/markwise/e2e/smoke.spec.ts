import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const screenshots = "/opt/cursor/artifacts/screenshots";

test("plan, practice, progress, and tutor render", async ({ page }) => {
  mkdirSync(screenshots, { recursive: true });
  await page.goto("/");
  await expect(page.getByText("Today", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Aisha/ })).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, "markwise-today.png"), fullPage: true });

  const task = page.locator("main a").first();
  await task.click();
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, "markwise-practice.png"), fullPage: true });

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, "markwise-progress.png"), fullPage: true });

  await page.goto("/tutor");
  await expect(page.getByRole("heading", { name: "Tutor" })).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, "markwise-tutor.png"), fullPage: true });
});
