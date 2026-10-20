/** Story fixtures and DOM probes for the stacked web modal browser spec. */
import { expect, type Locator, type Page } from "@playwright/test";

import { WEB_MODAL_ROOT_ATTRIBUTE } from "../../src/modal/webModalRoot";

const STACKED_STORY = "/iframe.html?id=modal-examples--stacked-web-modals";
const AT_MOUNT_STORY = "/iframe.html?id=modal-examples--stacked-at-mount";
const POPOVER_STORY = "/iframe.html?id=modal-examples--dialog-from-popover";

/** The persistent `aria-live` regions that announce toasts. */
export const LIVE_REGIONS = '[aria-live="polite"], [aria-live="assertive"]';

/** Whether an element sits in an `aria-hidden` subtree, and in an inert one. */
export type Hiding = { hidden: boolean; inert: boolean };

/** Announced and operable: no `aria-hidden` and no `inert` ancestor. */
export const LIVE: Hiding = { hidden: false, inert: false };

/** Background under a dialog: hidden from assistive technology and inert. */
export const BACKGROUND: Hiding = { hidden: true, inert: true };

/**
 * The stories' dialogs and controls, found by role and name. `includeHidden`
 * lets a locator resolve while its dialog is hidden, so a test asserts the
 * hiding itself instead of failing to find the element.
 */
export function storyControls(page: Page) {
  const button = (name: string) =>
    page.getByRole("button", { exact: true, includeHidden: true, name });
  const dialog = (name: string) =>
    page.getByRole("dialog", { includeHidden: true, name });
  return {
    announcement: page
      .getByRole("status", { includeHidden: true })
      .filter({ hasText: "Account details are up to date." }),
    cancel: button("Cancel"),
    closeSettings: button("Close Account settings"),
    confirm: dialog("Delete your account?"),
    delete: button("Delete"),
    deleteAccount: button("Delete account"),
    dismissToast: button("Dismiss Changes saved"),
    displayName: page.getByRole("textbox", {
      includeHidden: true,
      name: "Display name",
    }),
    manageAccount: button("Manage account"),
    refreshAccount: button("Refresh account"),
    reopenBoth: button("Delete my account"),
    saveChanges: button("Save changes"),
    settings: dialog("Account settings"),
    toast: page
      .getByRole("status", { includeHidden: true })
      .filter({ hasText: "Changes saved" }),
  };
}

/** The controls of one loaded story. */
export type StoryControls = ReturnType<typeof storyControls>;

/** Opens the settings dialog from the page, then the confirmation over it. */
export async function openInTurn(page: Page): Promise<StoryControls> {
  const ui = storyControls(page);
  await page.goto(STACKED_STORY);
  await ui.manageAccount.click();
  await expect(ui.displayName).toBeFocused();
  await ui.deleteAccount.click();
  await expect(ui.confirm).toBeVisible();
  return ui;
}

/** Loads the story that opens both dialogs in its first render commit. */
export async function openAtMount(page: Page): Promise<StoryControls> {
  const ui = storyControls(page);
  await page.goto(AT_MOUNT_STORY);
  await expect(ui.confirm).toBeVisible();
  await expect(ui.settings).toBeVisible();
  return ui;
}

/** Announces from the page, so the announcer region exists before a dialog. */
export async function announceFromPage(page: Page): Promise<StoryControls> {
  const ui = storyControls(page);
  await page.goto(STACKED_STORY);
  await ui.refreshAccount.click();
  await expect(ui.announcement).toBeAttached();
  return ui;
}

/** Opens the settings dialog and raises a sticky toast from it. */
export async function raiseToastFromSettings(
  page: Page,
): Promise<StoryControls> {
  const ui = storyControls(page);
  await page.goto(STACKED_STORY);
  await ui.manageAccount.click();
  await ui.saveChanges.click();
  await expect(ui.toast).toBeVisible();
  return ui;
}

/**
 * Opens the "Rename book" dialog from the book options popover. The popover's
 * action closes the popover and opens the dialog in one update.
 */
export async function openDialogFromPopover(page: Page) {
  const button = (name: string) =>
    page.getByRole("button", { exact: true, includeHidden: true, name });
  const ui = {
    bookName: page.getByRole("textbox", {
      includeHidden: true,
      name: "Book name",
    }),
    closeRename: button("Close Rename book"),
    rename: page.getByRole("dialog", {
      includeHidden: true,
      name: "Rename book",
    }),
    trigger: button("Book options"),
  };
  await page.goto(POPOVER_STORY);
  await ui.trigger.click();
  await button("Rename book").click();
  await expect(ui.rename).toBeVisible();
  await expect(ui.bookName).toBeFocused();
  return ui;
}

/**
 * Polls the element's hiding through its ancestor chain until it matches, so
 * the check holds whichever node carries `inert` or `aria-hidden`.
 */
export async function expectHiding(
  locator: Locator,
  expected: Hiding,
  message: string,
): Promise<void> {
  const hiding = () =>
    locator.evaluate((element) => ({
      hidden: element.closest('[aria-hidden="true"]') !== null,
      inert: element.closest("[inert]") !== null,
    }));
  await expect.poll(hiding, { message }).toEqual(expected);
}

/** The politeness of each toast live region in a hidden or inert subtree. */
export function silencedLiveRegions(page: Page): Promise<string[]> {
  return page
    .locator(LIVE_REGIONS)
    .evaluateAll((regions) =>
      regions
        .filter((region) => region.closest('[aria-hidden="true"], [inert]'))
        .map((region) => region.getAttribute("aria-live") ?? ""),
    );
}

/**
 * Whether hit testing at the surface's centre lands inside the surface, so a
 * pointer reaches the dialog there. Hit testing skips inert nodes, so this
 * cannot show the paint order under an inert dialog; {@link paintsAbove} can.
 */
export function ownsItsCentre(surface: Locator): Promise<boolean> {
  return surface.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return hit !== null && element.contains(hit);
  });
}

/**
 * Whether the upper surface paints above the lower one. It compares the two
 * surfaces' ancestors that are siblings, by the CSS rule for sibling layers:
 * the higher z-index paints above, and on a tie the later sibling does.
 */
export async function paintsAbove(
  lower: Locator,
  upper: Locator,
): Promise<boolean> {
  const upperSurface = await upper.elementHandle();
  try {
    return await lower.evaluate((below, above) => {
      let aboveLayer: Element | null = above;
      while (aboveLayer && !aboveLayer.parentElement?.contains(below)) {
        aboveLayer = aboveLayer.parentElement;
      }
      const siblings = Array.from(aboveLayer?.parentElement?.children ?? []);
      const belowLayer = siblings.find((sibling) => sibling.contains(below));
      if (!aboveLayer || !belowLayer || belowLayer === aboveLayer) {
        return false;
      }
      const zIndex = (layer: Element) =>
        Number.parseInt(getComputedStyle(layer).zIndex, 10) || 0;
      const later = siblings.indexOf(aboveLayer) > siblings.indexOf(belowLayer);
      return (
        zIndex(aboveLayer) > zIndex(belowLayer) ||
        (zIndex(aboveLayer) === zIndex(belowLayer) && later)
      );
    }, upperSurface);
  } finally {
    await upperSurface?.dispose();
  }
}

/**
 * Where two dialogs' layers sit: whether one shared root under the body holds
 * both, and whether the upper dialog's layer comes after the lower one.
 */
export async function stackPlacement(lower: Locator, upper: Locator) {
  const [below, above] = await Promise.all([
    layerPosition(lower),
    layerPosition(upper),
  ]);
  return {
    rootUnderBody: below.rootUnderBody && above.rootUnderBody,
    sharedRoot: below.root >= 0 && below.root === above.root,
    upperLayerLast: below.layer >= 0 && above.layer > below.layer,
  };
}

/** The surface's root among the document's roots, and its layer's index. */
function layerPosition(surface: Locator) {
  return surface.evaluate((element, rootSelector) => {
    const root = element.closest(rootSelector);
    const roots = Array.from(document.querySelectorAll(rootSelector));
    const layers = root ? Array.from(root.children) : [];
    return {
      layer: layers.findIndex((layer) => layer.contains(element)),
      root: root ? roots.indexOf(root) : -1,
      rootUnderBody: root?.parentElement === document.body,
    };
  }, `[${WEB_MODAL_ROOT_ATTRIBUTE}]`);
}

/**
 * Counts the backdrops beside each of two dialogs, and those they share. The
 * frame gives its backdrop no test hook, and this spec does not own the frame,
 * so a backdrop is found the way the frame draws it: an `aria-hidden` element
 * that covers the viewport with a fill, in the same layer as the surface.
 */
export async function backdropCounts(lower: Locator, upper: Locator) {
  const [below, above] = await Promise.all([
    backdropsBeside(lower),
    backdropsBeside(upper),
  ]);
  return {
    lower: below.length,
    shared: below.filter((index) => above.includes(index)).length,
    upper: above.length,
  };
}

/** Document-order indexes of the backdrops in the surface's own layer. */
function backdropsBeside(surface: Locator): Promise<number[]> {
  return surface.evaluate((element) => {
    const backdrops = Array.from(
      document.querySelectorAll('[aria-hidden="true"]'),
    ).filter((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return (
        rect.left <= 0 &&
        rect.top <= 0 &&
        rect.right >= window.innerWidth &&
        rect.bottom >= window.innerHeight &&
        getComputedStyle(candidate).backgroundColor !== "rgba(0, 0, 0, 0)"
      );
    });
    return backdrops.flatMap((backdrop, index) =>
      backdrop.parentElement?.contains(element) ? [index] : [],
    );
  });
}
