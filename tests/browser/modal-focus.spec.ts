/**
 * Browser coverage for the web modal: focus restore, the initial focus, the
 * header actions, and nested dropdowns.
 */
import { expect, test } from "@playwright/test";

test("web modal restores focus and allows nested dropdowns above the surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--centered-web-modal");

  await page.getByRole("button", { name: "Close Invite teammate" }).click();
  const openButton = page.getByRole("button", { name: "Open Invite teammate" });
  await openButton.click();
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeVisible();

  const textField = page.getByLabel("Modal text field");
  await textField.fill("Focus stays here");
  await expect(textField).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeHidden();
  await expect(openButton).toBeFocused();

  await openButton.click();
  const closeButton = page.getByRole("button", {
    name: "Close Invite teammate",
  });
  // Focus lands on the caller's first control, not the close button, and the
  // trap cycle then reaches the close button last on the way round.
  await expect(textField).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Nested selector, Standard" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textField).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(closeButton).toBeFocused();

  await page.getByRole("button", { name: "Nested selector, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  const modalBox = await page
    .getByRole("dialog", { name: "Invite teammate" })
    .boundingBox();
  const optionBox = await page.getByText("Cash accounting").boundingBox();
  expect(modalBox).not.toBeNull();
  expect(optionBox).not.toBeNull();
  expect(optionBox?.y).toBeGreaterThanOrEqual((modalBox?.y ?? 0) - 1);
});

test("a modal with no focusable body content opens on its footer action", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--confirm-web-modal");

  // `exact` matters: the close button is named "Close Publish changes", which a
  // substring match on "Publish" would also resolve to.
  const publish = page.getByRole("button", { name: "Publish", exact: true });
  const cancel = page.getByRole("button", { name: "Cancel", exact: true });
  const closeButton = page.getByRole("button", {
    name: "Close Publish changes",
  });

  // The body is text only, so the first caller-rendered control is the footer's
  // action button — focus falls through to it rather than to the close button.
  await expect(publish).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(publish).toBeFocused();

  // Focus is on the action, so Enter commits rather than dismissing.
  await page.keyboard.press("Enter");
  await expect(page.getByText("Published")).toBeVisible();
});

test("a dropdown inside a modal closes on Escape without closing the modal", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--centered-web-modal");
  const dialog = page.getByRole("dialog", { name: "Invite teammate" });
  await expect(dialog).toBeVisible();

  // Open the selector nested inside the modal.
  await page.getByRole("button", { name: "Nested selector, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  // Escape closes only the dropdown list (the top-most layer); the modal beneath
  // it stays open. This is the regression: Escape used to close both at once.
  await page.keyboard.press("Escape");
  await expect(page.getByText("Cash accounting")).toBeHidden();
  await expect(dialog).toBeVisible();

  // With no overlay above it, a second Escape now closes the modal itself.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("header actions sit left of Close and join the focus trap before it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--header-actions");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const bookName = page.getByLabel("Book name");
  const done = page.getByRole("button", { name: "Done", exact: true });
  const fullScreen = dialog.getByRole("button", { name: "Full screen" });
  const closeButton = dialog.getByRole("button", { name: "Close settings" });

  // Both header buttons follow the theme's ring indicator.
  await expect(fullScreen).toHaveAttribute("data-firna-focus-ring", "self");
  await expect(closeButton).toHaveAttribute("data-firna-focus-ring", "self");

  // The action is the first caller control in DOM order, so the default
  // initial focus lands on it. Close is still skipped.
  await expect(fullScreen).toBeFocused();
  await expect(fullScreen).toHaveAttribute("aria-pressed", "false");

  // The action comes before Close in DOM order, so the trap cycle runs
  // action → Close → field → footer → action, and back the same way.
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(bookName).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(done).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(fullScreen).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(done).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(fullScreen).toBeFocused();

  // The action sits directly left of Close, on the same row, at Close's size.
  const actionBox = await fullScreen.boundingBox();
  const closeBox = await closeButton.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(closeBox).not.toBeNull();
  if (!actionBox || !closeBox) {
    return;
  }
  expect(closeBox.x - (actionBox.x + actionBox.width)).toBe(4);
  expect(actionBox.y).toBe(closeBox.y);
  expect(actionBox.width).toBe(closeBox.width);
  expect(actionBox.height).toBe(closeBox.height);

  await page.keyboard.press("Enter");
  await expect(fullScreen).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByText("The dialog fills the window.")).toBeVisible();
});

test("header actions take the frame's focus indicator, as Close does", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=modal-examples--header-actions-outline-focus",
  );
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const fullScreen = dialog.getByRole("button", { name: "Full screen" });
  const closeButton = dialog.getByRole("button", { name: "Close settings" });

  // The frame sets `outline`, so neither button carries the ring marker.
  await expect(fullScreen).toBeVisible();
  await expect(fullScreen).not.toHaveAttribute("data-firna-focus-ring");
  await expect(closeButton).not.toHaveAttribute("data-firna-focus-ring");
});
