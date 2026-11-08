/**
 * Browser coverage for the dropdown selector: opening, keyboard navigation,
 * width, scrolling rows, and its trigger name.
 */
import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_DROPDOWN_MAX_WIDTH } from "../../src/dropdown/dropdownGeometry";

test("dropdown selector opens, navigates with keyboard, and closes outside", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-selector-default",
  );

  await page.getByRole("button", { name: "Scheme, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Scheme, Cash accounting" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Scheme, Cash accounting" }).click();
  await expect(page.getByText("Flat rate")).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByText("Flat rate")).toBeHidden();
});

test("async form focuses its first dropdown after hydration", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--async-form-focus&viewMode=story",
  );

  await expect(page.getByTestId("async-selector-skeleton")).toBeVisible();

  const firstField = page.getByRole("button", {
    name: "Holiday year starts, April",
  });
  await expect(firstField).toBeVisible();
  await expect(firstField).toBeFocused();

  // Enter now operates the first field instead of the formerly focused Close
  // button, so the modal remains open and its month options are available.
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Holiday rules" }),
  ).toBeVisible();
});

test("dropdown selector grows for wider options and stops at its default cap", async ({
  page,
}) => {
  await page.setViewportSize({ height: 720, width: 800 });
  await page.goto("/iframe.html?id=dropdown-examples--content-width-selector");

  const trigger = page.getByRole("button", { name: "Compare with baseline" });
  const triggerBox = await trigger.boundingBox();
  await trigger.click();

  const listbox = page.getByRole("listbox");
  const surface = listbox.locator("..");
  const surfaceBox = await surface.boundingBox();
  const runLabelBox = await page
    .getByText("main-97dbf3f070bd", { exact: true })
    .boundingBox();
  const gitRefBox = await page
    .getByText("97dbf3f070bda07611b771bf55ce37f6a859e02d", { exact: true })
    .boundingBox();

  expect(triggerBox).not.toBeNull();
  expect(surfaceBox).not.toBeNull();
  expect(runLabelBox).not.toBeNull();
  expect(gitRefBox).not.toBeNull();
  expect(surfaceBox?.width ?? 0).toBeGreaterThan((triggerBox?.width ?? 0) + 20);
  expect(surfaceBox?.width).toBeCloseTo(DEFAULT_DROPDOWN_MAX_WIDTH, 0);
  expect(runLabelBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
    20,
  );
  expect(gitRefBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(17);

  await page.setViewportSize({ height: 720, width: 320 });
  await expect
    .poll(async () => (await surface.boundingBox())?.width ?? 0)
    .toBeLessThan(DEFAULT_DROPDOWN_MAX_WIDTH);
  const narrowSurfaceBox = await surface.boundingBox();
  expect(narrowSurfaceBox).not.toBeNull();
  expect(narrowSurfaceBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(
    (narrowSurfaceBox?.x ?? Number.POSITIVE_INFINITY) +
      (narrowSurfaceBox?.width ?? Number.POSITIVE_INFINITY),
  ).toBeLessThanOrEqual(320);
});

test("dropdown keyboard navigation keeps the active option in view", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--long-dropdown-selector");

  await page.getByRole("button", { name: "Long list, Long option 01" }).click();
  await expect(
    page.getByRole("option", { exact: true, name: "Long option 01" }),
  ).toBeVisible();

  for (let step = 0; step < 15; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  await expect
    .poll(() => dropdownScrollState(page, "Long option 16"))
    .toMatchObject({
      activeInView: true,
      scrolled: true,
    });
});

test("dropdown selector pins header and footer while options scroll", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--selector-with-header-footer",
  );

  await page.getByRole("button", { name: "Scheme, Long option 01" }).click();

  const header = page.getByText("Choose a scheme");
  // The footer is a custom action control (the story renders it as a
  // `role="button"`), not a selectable listbox option, so target it by button.
  const footer = page.getByRole("button", { name: "Add scheme" });
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  const option = page.getByRole("option", {
    exact: true,
    name: "Long option 03",
  });
  const headerBefore = await header.boundingBox();
  const footerBefore = await footer.boundingBox();
  const optionBefore = await option.boundingBox();

  for (let step = 0; step < 18; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  const headerAfter = await header.boundingBox();
  const footerAfter = await footer.boundingBox();
  const optionAfter = await option.boundingBox();

  // The option rows scroll up...
  expect(optionBefore).not.toBeNull();
  expect(optionAfter).not.toBeNull();
  expect(
    Math.abs((optionAfter?.y ?? 0) - (optionBefore?.y ?? 0)),
  ).toBeGreaterThan(20);

  // ...while the pinned header and footer keep their position and stay visible.
  expect(headerBefore).not.toBeNull();
  expect(footerBefore).not.toBeNull();
  expect(
    Math.abs((headerAfter?.y ?? 0) - (headerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs((footerAfter?.y ?? 0) - (footerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  // The footer must sit fully inside the clipping surface; the surface padding
  // previously pushed it past the overflow:hidden bottom edge and clipped it.
  expect(await bottomOverflowPast(footer, "clip")).toBeLessThanOrEqual(1);
});

async function bottomOverflowPast(
  locator: ReturnType<Page["getByRole"]>,
  _label: string,
) {
  return locator.evaluate((element) => {
    let clip = element.parentElement;
    while (clip) {
      const overflowY = getComputedStyle(clip).overflowY;
      if (
        overflowY === "hidden" ||
        overflowY === "auto" ||
        overflowY === "scroll"
      ) {
        break;
      }
      clip = clip.parentElement;
    }
    if (!clip) {
      return 0;
    }
    return (
      element.getBoundingClientRect().bottom -
      clip.getBoundingClientRect().bottom
    );
  });
}

test("selector trigger keeps a value-independent name across selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--explicit-selector");

  // triggerLabel gives a stable, value-independent accessible name; the value
  // stays visible in the trigger text.
  const trigger = page.getByRole("button", { exact: true, name: "Scheme" });
  await expect(trigger).toContainText("Standard");

  await trigger.click();
  // Duplicate visible labels ("Custom") are disambiguated by per-option
  // accessibilityLabel, so each option resolves by a distinct name.
  await expect(
    page.getByRole("option", { name: "Custom start date" }),
  ).toBeVisible();
  await page.getByRole("option", { name: "Custom end date" }).click();

  // The trigger still resolves by the same name "Scheme" after the value
  // changed to "Custom" — the name did not move with the selection.
  const afterSelection = page.getByRole("button", {
    exact: true,
    name: "Scheme",
  });
  await expect(afterSelection).toBeVisible();
  await expect(afterSelection).toContainText("Custom");
});

async function dropdownScrollState(page: Page, label: string) {
  // The selector's scrollable rows are listbox options (`role="option"`), not
  // buttons; the row element itself is the scroll-into-view target.
  return page
    .getByRole("option", { exact: true, name: label })
    .evaluate((element) => {
      let scrollParent = element.parentElement;
      while (scrollParent) {
        if (scrollParent.scrollHeight > scrollParent.clientHeight) {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent) {
        return { activeInView: false, scrolled: false };
      }
      const activeRect = element.getBoundingClientRect();
      const viewportRect = scrollParent.getBoundingClientRect();
      return {
        activeInView:
          activeRect.top >= viewportRect.top - 1 &&
          activeRect.bottom <= viewportRect.bottom + 1,
        scrolled: scrollParent.scrollTop > 0,
      };
    });
}
