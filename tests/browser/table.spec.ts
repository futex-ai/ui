/**
 * Browser coverage for the table: row activation, disabled rows, and rich
 * cells.
 */
import { expect, test } from "@playwright/test";

test("table row opens on click and reports the opened row", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // With onRowPress, each row is a button named by its rowLabel.
  const paid = page.getByRole("button", { name: "Open invoice INV-0007" });
  await expect(paid).toBeVisible();
  await paid.click();
  await expect(page.getByText("Opened INV-0007")).toBeVisible();
});

test("table row activates from the keyboard", async ({ page }) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // The button-role row is keyboard operable via the web backend's Pressable.
  const overdue = page.getByRole("button", { name: "Open invoice INV-0008" });
  await overdue.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Opened INV-0008")).toBeVisible();
});

test("table disabled row is exposed as a non-pressable button", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // The draft row is marked non-pressable via rowDisabled.
  await expect(
    page.getByRole("button", { name: "Open invoice INV-0009" }),
  ).toBeDisabled();
});

test("table rich cells render and the per-row Open action fires", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--rich-cells");

  // Rich cells render: a two-line name cell and a toned status badge.
  await expect(page.getByText("Maya Okafor")).toBeVisible();
  await expect(page.getByText("Leaving 31 May")).toBeVisible();

  // The per-row action button (in the headerless action column) fires.
  await page.getByRole("button", { name: "Open Maya Okafor" }).click();
  await expect(page.getByText("Opened Maya Okafor")).toBeVisible();
});
