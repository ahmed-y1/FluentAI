import { test, expect } from "@playwright/test";

test("session page: camera feed is visible", async ({ page }) => {
  await page.goto("/session");
  await expect(page.locator("video")).toBeVisible();
  await expect(page.getByRole("button", { name: /start/i })).toBeVisible();
});

test("session page: start changes to stop", async ({ page }) => {
  await page.goto("/session");
  await page.getByRole("button", { name: /start/i }).click();
  await expect(page.getByRole("button", { name: /stop/i })).toBeVisible({ timeout: 5000 });
});

test("dashboard: loads without error", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText(/progress/i).first()).toBeVisible();
});