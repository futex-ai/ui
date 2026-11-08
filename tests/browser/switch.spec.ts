/** Browser coverage for the switch: toggling a binary setting. */
import { expect, test } from "@playwright/test";

test("switch toggles a binary setting", async ({ page }) => {
  await page.goto("/iframe.html?id=switch-examples--privacy-toggle");

  const toggle = page.getByRole("switch", { name: "Analytics cookies" });
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();

  // Enter must toggle exactly once. React Native Web's press responder presses
  // Enter on any role — on keyup — while the switch's own `onKeyDown` runs on
  // keydown, so a handler that also claims Enter toggles twice and the key
  // looks dead. Space is the mirror case: the responder binds it to `button`
  // roles only, so the switch has to own it.
  await page.keyboard.press("Enter");
  await expect(toggle).not.toBeChecked();
  await page.keyboard.press("Enter");
  await expect(toggle).toBeChecked();
});
