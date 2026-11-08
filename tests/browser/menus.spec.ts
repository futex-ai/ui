/**
 * Browser journeys of the menus drawn in place and of the phone menu sheet.
 * Only a real browser shows where focus goes, which key reaches which
 * element, and how often a row runs or a menu closes, so each journey reads
 * the counts that the examples print after every action.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoMenuStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=popover-examples--${storyId}&viewMode=story`,
  );
}

/** The id of the row that the focused menu points at, or `null`. */
async function activeRowName(page: Page, menu: Locator) {
  const id = await menu.getAttribute("aria-activedescendant");
  if (!id) return null;
  return page.locator(`[id="${id}"]`).getAttribute("aria-label");
}

test("an in-place menu opens on its first row, runs one row by keyboard, and returns focus", async ({
  page,
}) => {
  await gotoMenuStory(page, "inline-menu-story");
  const trigger = page.getByRole("button", { name: "Project actions" });
  const menu = page.getByRole("menu", { name: "Project actions" });
  const log = page.getByText(/^Last action: .* · Actions: \d+ · Closed: \d+$/);

  await trigger.click();
  await expect(menu).toBeFocused();
  await expect.poll(() => activeRowName(page, menu)).toBe("Rename");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // A row icon is decorative: the row holds no image, also when the caller's
  // icon ignores `aria-hidden` and names its own image.
  await expect(
    page.getByRole("menuitem", { name: "Rename" }).getByRole("img"),
  ).toHaveCount(0);
  // A dense row is 26px high.
  expect(
    (await page.getByRole("menuitem", { name: "Rename" }).boundingBox())
      ?.height,
  ).toBeCloseTo(26, 0);

  // The arrows skip the disabled row and the divider, and wrap.
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeRowName(page, menu)).toBe("Duplicate");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeRowName(page, menu)).toBe("Archive project");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeRowName(page, menu)).toBe("Rename");
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => activeRowName(page, menu)).toBe("Archive project");

  // Enter runs the active row once and closes the menu once.
  await page.keyboard.press("Enter");
  await expect(log.first()).toHaveText(
    "Last action: Archive project · Actions: 1 · Closed: 1",
  );
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  // Escape closes once and returns focus to the trigger.
  await trigger.click();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(log.first()).toHaveText(
    "Last action: Archive project · Actions: 1 · Closed: 2",
  );
  await expect(trigger).toBeFocused();

  // A press outside closes it; a press on the trigger toggles it.
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(menu).toBeHidden();
  await expect(log.first()).toHaveText(
    "Last action: Archive project · Actions: 1 · Closed: 3",
  );

  // A choice is a menu radio item; the arrows skip the label, the divider,
  // and the note, and Space runs the active choice.
  await page.getByRole("button", { name: "Sort projects" }).click();
  const sort = page.getByRole("menu", { name: "Sort projects" });
  await expect(sort).toBeFocused();
  await expect(
    page.getByRole("menuitemradio", { name: "Recent activity" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("menuitemradio", { name: "Name" }),
  ).toHaveAttribute("aria-checked", "false");
  await expect(sort).toHaveAccessibleDescription(
    "Pinned projects stay at the top.",
  );
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => activeRowName(page, sort)).toBe("Status");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeRowName(page, sort)).toBe("Recent activity");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press(" ");
  await expect(page.getByText("Sort: Name")).toBeVisible();
  await expect(log.last()).toHaveText(
    "Last action: Name · Actions: 1 · Closed: 1",
  );
});

test("on a touch surface a menu opens as a sheet whose close control keeps the keyboard", async ({
  page,
}) => {
  await gotoMenuStory(page, "phone-menu-sheet");
  const trigger = page.getByRole("button", { name: "Sort projects" });
  const sheet = page.getByRole("dialog", { name: "Sort projects" });
  const menu = sheet.getByRole("menu", { name: "Sort projects" });
  const close = sheet.getByRole("button", { name: "Close Sort projects" });
  const log = page.getByText(/^Last action: .* · Actions: \d+ · Closed: \d+$/);

  // The sheet opens on the list with no active row.
  await trigger.click();
  await expect(menu).toBeFocused();
  await expect(menu).not.toHaveAttribute("aria-activedescendant", /.+/);
  const row = await sheet
    .getByRole("menuitemradio", { name: "Name" })
    .boundingBox();
  expect(row?.height ?? 0).toBeGreaterThanOrEqual(44);
  const closeBox = await close.boundingBox();
  expect(closeBox?.height).toBeCloseTo(44, 0);
  expect(closeBox?.width).toBeCloseTo(44, 0);

  // The first ArrowDown makes the first choice active; Enter runs it once.
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeRowName(page, menu)).toBe("Recent activity");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(sheet).toBeHidden();
  await expect(log.last()).toHaveText(
    "Last action: Name · Actions: 1 · Closed: 1",
  );
  await expect(trigger).toBeFocused();

  // Tab reaches the close control, and Enter there closes the sheet once
  // without running a row.
  await trigger.click();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sheet).toBeHidden();
  await expect(log.last()).toHaveText(
    "Last action: Name · Actions: 1 · Closed: 2",
  );
  await expect(trigger).toBeFocused();

  // Escape and a backdrop press each close it once.
  await trigger.click();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(log.last()).toHaveText(
    "Last action: Name · Actions: 1 · Closed: 3",
  );
  await trigger.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(sheet).toBeHidden();
  await expect(log.last()).toHaveText(
    "Last action: Name · Actions: 1 · Closed: 4",
  );

  // The in-place menu opens the same sheet, named by the menu, under its
  // own title.
  await page.getByRole("button", { name: "Project actions" }).click();
  const actions = page.getByRole("dialog", { name: "Project actions" });
  await expect(
    actions.getByRole("heading", { name: "Billing portal" }),
  ).toBeVisible();
  await expect(
    actions.getByRole("menu", { name: "Project actions" }),
  ).toBeFocused();
});
