/**
 * Browser coverage for toasts: announcements, actions, timing, placement, and
 * the controller.
 */
import { expect, test } from "@playwright/test";

test("toast appears on trigger, announces its tone, and dismisses on close", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--tones");

  await page.getByRole("button", { name: "Show success" }).click();
  const success = page.getByText("Saved", { exact: true });
  await expect(success).toBeVisible();
  // The success toast is a polite status region.
  await expect(
    page.getByRole("status").filter({ hasText: "Saved" }),
  ).toBeVisible();

  // Errors render as an assertive alert and stack alongside the success toast.
  await page.getByRole("button", { name: "Show error" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Save failed" }),
  ).toBeVisible();
  await expect(success).toBeVisible();

  // The close control dismisses just its own toast.
  await page.getByRole("button", { name: "Dismiss Saved" }).click();
  await expect(success).toBeHidden();
  await expect(
    page
      .getByRole("region", { name: "Notifications" })
      .getByText("Save failed"),
  ).toBeVisible();
});

test("toast action runs and dismisses the toast", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--with-action");

  await page.getByRole("button", { name: "Delete invoice" }).click();
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Invoice deleted");
  await expect(toast).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toBeHidden();
});

test("toast auto-dismisses after its duration elapses", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--auto-dismiss");

  await page.getByRole("button", { name: "Copy link" }).click();
  // Move the pointer off the toast so hover does not pause the countdown.
  await page.mouse.move(0, 0);
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Copied to clipboard");
  await expect(toast).toBeVisible();
  // Duration is 2s; allow margin for the auto-dismiss to fire.
  await expect(toast).toBeHidden({ timeout: 5000 });
});

test("top-center toast pins to the top of the viewport", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--top-center");

  await page.getByRole("button", { name: "Show info" }).click();
  const heading = page.getByText("Heads up", { exact: true });
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.y ?? Number.MAX_SAFE_INTEGER).toBeLessThan(200);
});

test("solid toast variant can be triggered through the controller", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--solid-bottom-center");

  await page.getByRole("button", { name: "Show solid error" }).click();
  const toast = page
    .getByRole("alert")
    .filter({ hasText: "Couldn't move this transaction. Try again." });
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dismiss Couldn't move/ }),
  ).toHaveCount(0);

  const background = await toast.evaluate(
    (node) => window.getComputedStyle(node as HTMLElement).backgroundColor,
  );
  expect(background).toBe("rgb(168, 79, 69)");

  const box = await toast.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    const toastCenter = box.x + box.width / 2;
    expect(box.width).toBeGreaterThan(260);
    expect(box.height).toBeLessThan(80);
    expect(Math.abs(toastCenter - viewport.width / 2)).toBeLessThan(20);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
  }

  await page.getByRole("button", { name: "Show description" }).click();
  const descriptionToast = page
    .getByRole("alert")
    .filter({ hasText: "Transaction not moved" });
  await expect(descriptionToast).toContainText(
    "Check the category and try again.",
  );

  await page.getByRole("button", { name: "Show action" }).click();
  const actionToast = page
    .getByRole("alert")
    .filter({ hasText: "Move failed" });
  await expect(actionToast).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(actionToast).toBeHidden();

  await page.getByRole("button", { name: "Show close" }).click();
  const closeToast = page
    .getByRole("status")
    .filter({ hasText: "Saved as draft" });
  await expect(closeToast).toBeVisible();
  await page.getByRole("button", { name: "Dismiss Saved as draft" }).click();
  await expect(closeToast).toBeHidden();
});

test("solid toast accepts a custom icon for compact progress feedback", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--icon-bottom-center");

  await page.getByRole("button", { name: "Show saving status" }).click();
  const toast = page
    .getByRole("status")
    .filter({ hasText: "Saving payslips to your device • 3 of 5" });
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dismiss Saving payslips/ }),
  ).toHaveCount(0);

  const background = await toast.evaluate(
    (node) => window.getComputedStyle(node as HTMLElement).backgroundColor,
  );
  expect(background).toBe("rgb(28, 31, 29)");

  const box = await toast.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    const toastCenter = box.x + box.width / 2;
    expect(box.width).toBeGreaterThan(360);
    expect(box.height).toBeGreaterThanOrEqual(60);
    expect(Math.abs(toastCenter - viewport.width / 2)).toBeLessThan(20);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
  }
});

test("toast controller is registered before descendant mount effects", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--controller-on-mount");

  const toast = page
    .getByRole("status")
    .filter({ hasText: "Mounted through controller" });
  await expect(toast).toBeVisible();
});

test("hovering a toast pauses its auto-dismiss countdown", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--auto-dismiss");

  await page.getByRole("button", { name: "Copy link" }).click();
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Copied to clipboard");
  await expect(toast).toBeVisible();

  // Hold the pointer over the 2s toast well past its duration; the pause keeps
  // it alive instead of letting the countdown fire.
  await toast.hover();
  await page.waitForTimeout(2600);
  await expect(toast).toBeVisible();

  // Releasing the hover resumes the (now nearly elapsed) countdown.
  await page.mouse.move(0, 0);
  await expect(toast).toBeHidden();
});

test("non-dismissible toast has no close control and dismissAll clears the queue", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--queue-and-dismiss-all");

  await page.getByRole("button", { name: "Start upload" }).click();
  await page.getByRole("button", { name: "Start upload" }).click();
  const uploading = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Uploading…");
  await expect(uploading.first()).toBeVisible();
  // A non-dismissible toast renders no close control.
  await expect(
    page.getByRole("button", { name: /Dismiss Uploading/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Dismiss all" }).click();
  await expect(
    page.getByRole("region", { name: "Notifications" }).getByText("Uploading…"),
  ).toHaveCount(0);
});
