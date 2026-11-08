/**
 * Browser coverage for the empty state: its title is a heading at the level
 * that the caller gives, with one size at every level, and its place in its
 * area. Heading levels come from the real DOM, and the place is layout.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

async function gotoEmptyStateStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=empty-state-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

/** The type metrics of a text. */
async function typeOf(text: Locator) {
  return text.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
    };
  });
}

/** The space above the first child and below the last child of a box. */
async function contentGaps(box: Locator) {
  return box.evaluate((element) => {
    const frame = element.getBoundingClientRect();
    const first = element.firstElementChild?.getBoundingClientRect();
    const last = element.lastElementChild?.getBoundingClientRect();
    return {
      above: (first?.top ?? frame.top) - frame.top,
      below: frame.bottom - (last?.bottom ?? frame.bottom),
    };
  });
}

/** The space above and below a box inside the border of its parent. */
async function placeInParent(box: Locator) {
  return box.evaluate((element) => {
    const own = element.getBoundingClientRect();
    const parent = element.parentElement ?? element;
    const frame = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    return {
      above: own.top - frame.top - parseFloat(style.borderTopWidth),
      below: frame.bottom - parseFloat(style.borderBottomWidth) - own.bottom,
    };
  });
}

test("an empty state title is a heading at the caller's level with one size, and a page centres while a panel sits at the top", async ({
  page,
}) => {
  await gotoEmptyStateStory(page, "page");
  const pageTitle = page.getByRole("heading", {
    level: 2,
    name: "No files yet",
  });
  // The h4 metrics of the default scale.
  const pageType = await typeOf(pageTitle);
  expect(pageType).toEqual({
    fontSize: "17px",
    fontWeight: "700",
    lineHeight: "23px",
  });
  const centred = await contentGaps(page.getByTestId("files-empty"));
  expect(centred.above).toBeGreaterThan(40);
  expect(centred.above).toBeCloseTo(centred.below, 0);

  await gotoEmptyStateStory(page, "panel");
  const panelTitle = page.getByRole("heading", {
    level: 3,
    name: "Changes appear after the first push",
  });
  expect(await typeOf(panelTitle)).toEqual(pageType);
  // A panel sits at the top of its area, with its mark below 28 px of
  // padding and the free space of the panel below it.
  const panel = page.getByTestId("changes-empty");
  expect((await contentGaps(panel)).above).toBe(28);
  const place = await placeInParent(panel);
  expect(place.above).toBe(0);
  expect(place.below).toBeGreaterThan(0);
});
