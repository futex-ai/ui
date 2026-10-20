import { expect, test } from "@playwright/test";

import {
  BACKGROUND,
  LIVE,
  LIVE_REGIONS,
  backdropCounts,
  expectHiding,
  openAtMount,
  openInTurn,
  ownsItsCentre,
  paintsAbove,
  raiseToastFromSettings,
  silencedLiveRegions,
  stackPlacement,
} from "./modalStackHelpers";

/**
 * Stacked web dialogs, on the "Stacked web modals" and "Stacked at mount"
 * stories: an account settings dialog renders a delete confirmation inside its
 * own content, and raises toasts. The tests pin the web overlays protocol
 * (`docs/protocol/web-overlays.md`): one shared overlay root in stack order, a
 * live top dialog over an inert page and inert lower dialogs, Tab and Escape
 * for the top dialog only, ordered focus restore, one backdrop per dialog, and
 * toasts that stay announced and operable over dialogs.
 */

test("Tab moves from Cancel to Delete in the confirmation and back", async ({
  page,
}) => {
  const ui = await openInTurn(page);
  await expect(ui.cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(ui.delete, "Tab moves inside the top dialog").toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(ui.cancel).toBeFocused();
});

test("the confirmation is live while the settings dialog and the page are background", async ({
  page,
}) => {
  const ui = await openInTurn(page);
  await expectHiding(ui.confirm, LIVE, "the top dialog is live");
  await expectHiding(ui.settings, BACKGROUND, "the lower dialog is background");
  await expectHiding(ui.manageAccount, BACKGROUND, "the page is background");
});

test("Escape closes only the confirmation and returns focus to its opener", async ({
  page,
}) => {
  const ui = await openInTurn(page);
  await page.keyboard.press("Escape");
  await expect(ui.confirm).toBeHidden();
  await expect(ui.settings).toBeVisible();
  await expect(ui.deleteAccount).toBeFocused();
  await expectHiding(ui.settings, LIVE, "the settings dialog is live again");
  await page.keyboard.press("Tab");
  await expect(ui.saveChanges).toBeFocused();
});

test("closing the settings dialog restores the page and focuses its trigger", async ({
  page,
}) => {
  const ui = await openInTurn(page);
  await ui.cancel.click();
  await expect(ui.confirm).toBeHidden();
  await expect(ui.deleteAccount).toBeFocused();
  await expectHiding(
    ui.manageAccount,
    BACKGROUND,
    "the page stays background while a dialog is open",
  );
  await ui.closeSettings.click();
  await expect(ui.settings).toBeHidden();
  await expectHiding(ui.manageAccount, LIVE, "the page is live again");
  await expect(ui.manageAccount).toBeFocused();
});

test("Delete closes both dialogs and focuses the page trigger", async ({
  page,
}) => {
  const ui = await openInTurn(page);
  await ui.delete.click();
  await expect(ui.confirm).toBeHidden();
  await expect(ui.settings).toBeHidden();
  await expectHiding(ui.manageAccount, LIVE, "the page is live again");
  await expect(ui.manageAccount).toBeFocused();
});

test("each stacked dialog keeps its own backdrop", async ({ page }) => {
  const ui = await openInTurn(page);
  await expect
    .poll(() => backdropCounts(ui.settings, ui.confirm), {
      message: "each dialog draws one backdrop of its own",
    })
    .toEqual({ lower: 1, shared: 0, upper: 1 });
});

for (const [opening, open] of [
  ["opened in turn", openInTurn],
  ["opened at mount", openAtMount],
] as const) {
  test(`both dialogs sit in one shared overlay root in stack order (${opening})`, async ({
    page,
  }) => {
    const ui = await open(page);
    await expect
      .poll(() => stackPlacement(ui.settings, ui.confirm), {
        message: "one root under the body holds both layers, the top one last",
      })
      .toEqual({ rootUnderBody: true, sharedRoot: true, upperLayerLast: true });
  });
}

test("Stacked at mount leaves the confirmation live", async ({ page }) => {
  const ui = await openAtMount(page);
  await expectHiding(ui.confirm, LIVE, "the nested top dialog is live");
  await expectHiding(
    ui.settings,
    BACKGROUND,
    "the parent dialog is background",
  );
  await expectHiding(ui.manageAccount, BACKGROUND, "the page is background");
});

test("Stacked at mount puts the confirmation on top, on Cancel, and Escape closes only it", async ({
  page,
}) => {
  const ui = await openAtMount(page);
  await expect
    .poll(() => paintsAbove(ui.settings, ui.confirm), {
      message: "the nested dialog paints above its parent",
    })
    .toBe(true);
  await expect
    .poll(() => ownsItsCentre(ui.confirm), {
      message: "a pointer at the nested dialog's centre reaches it",
    })
    .toBe(true);
  await expect(ui.cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(ui.confirm).toBeHidden();
  await expect(ui.settings).toBeVisible();
  await expect(
    ui.displayName,
    "focus lands where the settings dialog opens, because the body had focus",
  ).toBeFocused();
});

test("Stacked at mount closes in stack order and reopens both in one update", async ({
  page,
}) => {
  const ui = await openAtMount(page);
  await page.keyboard.press("Escape");
  await expect(ui.confirm).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(ui.settings).toBeHidden();
  await expectHiding(ui.reopenBoth, LIVE, "the page is live once both close");
  await ui.reopenBoth.click();
  await expect(ui.confirm).toBeVisible();
  await expectHiding(ui.confirm, LIVE, "the nested top dialog is live");
  await expect(ui.cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(ui.displayName).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(ui.settings).toBeHidden();
  await expect(
    ui.reopenBoth,
    "the parent dialog takes over the opener of the nested one",
  ).toBeFocused();
});

test("a toast raised from the settings dialog stays announced and closes", async ({
  page,
}) => {
  const ui = await raiseToastFromSettings(page);
  await expect(page.locator(LIVE_REGIONS)).not.toHaveCount(0);
  await expect
    .poll(() => silencedLiveRegions(page), {
      message: "the toast live regions stay announced while a dialog is open",
    })
    .toEqual([]);
  await expectHiding(ui.toast, LIVE, "the toast is live");
  await ui.dismissToast.click();
  await expect(ui.toast).toBeHidden();
  await expect(ui.settings).toBeVisible();
});

test("a toast shown before the confirmation opened keeps a working close button", async ({
  page,
}) => {
  const ui = await raiseToastFromSettings(page);
  await ui.deleteAccount.click();
  await expect(ui.confirm).toBeVisible();
  await expectHiding(ui.dismissToast, LIVE, "the toast stays operable");
  await ui.dismissToast.click();
  await expect(ui.toast).toBeHidden();
  await expect(ui.confirm).toBeVisible();
  await expectHiding(ui.confirm, LIVE, "the confirmation stays the top dialog");
  await page.keyboard.press("Tab");
  await expect(
    ui.confirm.locator(":focus"),
    "Tab brings focus back into the top dialog",
  ).toHaveCount(1);
});
