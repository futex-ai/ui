import { expect, type Locator, type Page } from "@playwright/test";

/** A point in page (viewport) coordinates. */
export type Point = { x: number; y: number };

/** The bounding box of a test id, failing the test when it has none. */
export async function boxOf(page: Page, testId: string) {
  return boxOfLocator(page.getByTestId(testId));
}

export async function boxOfLocator(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as NonNullable<typeof box>;
}

/** A point inside a test id's box, `dx` / `dy` from its top-left corner. */
export async function pointIn(
  page: Page,
  testId: string,
  dx: number,
  dy?: number,
): Promise<Point> {
  const box = await boxOf(page, testId);
  return { x: box.x + dx, y: box.y + (dy ?? box.height / 2) };
}

/** Press at `from`, move to `to` in `steps`, and release. */
export async function dragBetween(
  page: Page,
  from: Point,
  to: Point,
  steps = 10,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

/** The page-shell row ids whose checkbox reports `aria-checked="true"`. */
export async function checkedRowIds(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll('[data-testid^="shell-check-"]'),
      (check) =>
        check.getAttribute("aria-checked") === "true"
          ? (check.getAttribute("data-testid") ?? "").replace(
              "shell-check-",
              "",
            )
          : null,
    ).filter((id): id is string => id !== null),
  );
}

/** The current text highlight of the page. */
export async function highlightedText(page: Page): Promise<string> {
  return page.evaluate(() => window.getSelection()?.toString() ?? "");
}

/** The number of drawn marquee layers. */
export async function marqueeCount(page: Page): Promise<number> {
  return page.locator("[data-drag-select-marquee]").count();
}

/** Opens a drag-select story by its export name in kebab case. */
export async function openStory(page: Page, story: string) {
  await page.goto(`/iframe.html?id=drag-select-examples--${story}`);
  await page.waitForSelector("#storybook-root *");
}

/** `ids` as the expected `["txn_1", ...]` list for a 1-based range. */
export function rowRange(prefix: string, from: number, to: number): string[] {
  return Array.from(
    { length: to - from + 1 },
    (_, index) => `${prefix}_${from + index}`,
  );
}
