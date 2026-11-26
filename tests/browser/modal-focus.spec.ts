/**
 * Browser coverage for the web modal: focus restore, the initial focus, the
 * surface initial focus mode, and nested dropdowns.
 */
import { expect, test } from "@playwright/test";

import { DEFAULT_GLOW, expectGlow } from "./focusRingHelpers";

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

test('initialFocus="surface" opens on the dialog surface and Tab enters at the initialFocusRef', async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--surface-initial-focus");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const opener = page.getByRole("button", { name: "Open settings" });
  const book = page.getByRole("button", { name: "Northwind Books" });

  // The named dialog itself has focus, so a screen reader announces it, and no
  // control has focus to show a ring.
  await expect(dialog).toBeFocused();

  // Reopen from the keyboard: Chrome then matches `:focus-visible` on the
  // programmatic focus, which is the case that drew a ring on a control.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeFocused();
  expect(
    await dialog.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  await expect(dialog).toHaveCSS("outline-style", "none");
  expect(
    await dialog.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toContain(DEFAULT_GLOW);

  // The first Tab skips the name field before the chip, because the chip is
  // the initialFocusRef, and the chip shows the shared glow.
  await page.keyboard.press("Tab");
  await expect(book).toBeFocused();
  await expectGlow(book);

  // The trap and the focus restore work as in the default mode.
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test('initialFocus="surface" sends Shift+Tab from the surface to the last control', async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--surface-initial-focus");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Billing" })).toBeFocused();
});

test('initialFocus="surface" without an initialFocusRef sends Tab to the first caller control', async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=modal-examples--surface-initial-focus&args=bookTarget:!false",
  );
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeFocused();

  // The close button comes first in DOM order, but Tab skips it, as the
  // default initial focus does.
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Display name")).toBeFocused();
});

test('initialFocus="surface" sends Tab to the first caller control when the initialFocusRef cannot take focus', async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=modal-examples--surface-initial-focus&args=bookDisabled:!true",
  );
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeFocused();

  // The disabled chip cannot take focus. Tab goes to the default entry
  // control and still skips the close button.
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Display name")).toBeFocused();
});

test('initialFocus="surface" sends Tab past a caller control in a hidden container', async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=modal-examples--surface-initial-focus&args=bookTarget:!false;nameHidden:!true",
  );
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeFocused();

  // The name field is the first caller control in DOM order, but its
  // container is hidden. Tab goes to the next caller control.
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Northwind Books" }),
  ).toBeFocused();
});

test("closing a dialog whose opener is gone focuses the entry control of the surface-mode dialog beneath", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--surface-initial-focus");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await expect(settings).toBeFocused();

  await page.getByRole("button", { name: "Remove book" }).click();
  const confirm = page.getByRole("dialog", { name: "Remove Northwind Books?" });
  await expect(confirm).toBeVisible();

  // Remove deletes the book chip, the initialFocusRef, and the Remove book
  // button, the opener. Focus goes to the default entry control of Settings,
  // not to its surface.
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByLabel("Display name")).toBeFocused();
});
