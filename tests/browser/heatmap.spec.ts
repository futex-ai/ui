/** Browser coverage for the heatmap: month labels and cell presses. */
import { expect, test } from "@playwright/test";

test("heatmap labels the months across a full-year range", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-year");

  // A year range labels every month at the column where it begins.
  await expect(page.getByText("Jan", { exact: true })).toBeVisible();
  await expect(page.getByText("Jul", { exact: true })).toBeVisible();
  await expect(page.getByText("Dec", { exact: true })).toBeVisible();
});

test("heatmap reports the pressed cell to its handler", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-interactive");

  await expect(page.getByText("None selected")).toBeVisible();
  // Each in-range cell is a button named by its accessible date + value label.
  await page.getByRole("button", { name: "15 Jan 2024: 8 (high)" }).click();
  await expect(page.getByText("Selected: 2024-01-15 (8)")).toBeVisible();
});
