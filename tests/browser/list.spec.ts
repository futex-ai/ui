/**
 * Browser coverage for List focus modality and its two deliberate press-target
 * models. Source assertions cannot prove Chromium's `:focus-visible` state or
 * the ring's computed geometry, so these checks exercise the List stories,
 * including the consumer-shaped modal regression fixture.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

async function gotoListStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=list-examples--${storyId}&viewMode=story`);
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

async function expectFocusVisible(target: Locator, visible: boolean) {
  await expect
    .poll(() => target.evaluate((element) => element.matches(":focus-visible")))
    .toBe(visible);
}

async function computedBoxShadow(target: Locator) {
  return target.evaluate((element) => getComputedStyle(element).boxShadow);
}

test("a full-row List press ring follows input modality without blurring", async ({
  page,
}) => {
  await gotoListStory(page, "clickable-items");
  const row = page.getByRole("button", { name: "Open Calum Moore" });
  const nextRow = page.getByRole("button", { name: "Open Peter Parker" });
  const listItem = page.getByRole("listitem").filter({ has: row });

  await row.click();
  await expect(row).toBeFocused();
  await expectFocusVisible(row, false);
  await expect(row).toHaveCSS("box-shadow", "none");

  const rowBox = await row.boundingBox();
  const listItemBox = await listItem.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(listItemBox).not.toBeNull();
  expect(rowBox?.width).toBeCloseTo(listItemBox?.width ?? 0, 0);

  // A key press changes Chromium's modality while the same row keeps focus.
  await page.keyboard.press("Space");
  await expect(row).toBeFocused();
  await expectFocusVisible(row, true);
  await expect.poll(() => computedBoxShadow(row)).not.toBe("none");
  expect(await computedBoxShadow(row)).toContain("inset");

  // Moving pointer focus to another row removes the old ring and does not paint
  // a keyboard ring on the newly focused pointer target.
  await nextRow.click();
  await expect(nextRow).toBeFocused();
  await expectFocusVisible(nextRow, false);
  await expect(nextRow).toHaveCSS("box-shadow", "none");
  await expect(row).toHaveCSS("box-shadow", "none");
});

test("a ListItem title keeps a narrow ring beside an independent switch", async ({
  page,
}) => {
  await gotoListStory(page, "pressable-label-with-toggle");
  const title = page.getByRole("button", { name: "Notifications" });
  const toggle = page.getByRole("switch", { name: "Enable Notifications" });
  const listItem = page.getByRole("listitem").filter({ has: title });

  await title.click();
  await expect(title).toBeFocused();
  await expectFocusVisible(title, false);
  await expect(title).toHaveCSS("box-shadow", "none");

  // Tab reaches the sibling switch; Shift+Tab then keyboard-focuses the title.
  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(title).toBeFocused();
  await expectFocusVisible(title, true);
  await expect.poll(() => computedBoxShadow(title)).not.toBe("none");

  const titleBox = await title.boundingBox();
  const toggleBox = await toggle.boundingBox();
  const listItemBox = await listItem.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  expect(listItemBox).not.toBeNull();
  expect(titleBox?.width).toBeLessThan(listItemBox?.width ?? 0);
  expect((listItemBox?.width ?? 0) - (titleBox?.width ?? 0)).toBeGreaterThan(
    toggleBox?.width ?? 0,
  );
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual(
    toggleBox?.x ?? 0,
  );

  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await expect(page.getByText("Opened Notifications")).toBeVisible();
});

test("a modal repository picker preserves pointer modality on its rich title", async ({
  page,
}) => {
  await gotoListStory(page, "repository-picker-regression");
  await page.getByRole("button", { name: "Open repository picker" }).click();
  const title = page.getByRole("button", { name: "acme/marketing-site" });
  const nextTitle = page.getByRole("button", {
    name: "acme-ops/data-pipeline",
  });
  const listItem = page.getByRole("listitem").filter({ has: title });
  const chevron = page.getByTestId("repository-chevron-marketing-site");

  // Pointer-opening the modal moves real focus to its first caller control
  // without turning that programmatic handoff into keyboard-visible focus.
  await expect(title).toBeFocused();
  await expectFocusVisible(title, false);
  await expect(title).toHaveCSS("box-shadow", "none");

  await title.click();
  await expect(title).toBeFocused();
  await expectFocusVisible(title, false);
  await expect(title).toHaveCSS("box-shadow", "none");
  await expect(page.getByText("Selected acme/marketing-site")).toBeVisible();

  const titleBox = await title.boundingBox();
  const listItemBox = await listItem.boundingBox();
  const chevronBox = await chevron.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(listItemBox).not.toBeNull();
  expect(chevronBox).not.toBeNull();
  expect(titleBox?.width).toBeLessThan(listItemBox?.width ?? 0);
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual(
    chevronBox?.x ?? 0,
  );

  await page.keyboard.press("Space");
  await expect(title).toBeFocused();
  await expectFocusVisible(title, true);
  await expect.poll(() => computedBoxShadow(title)).not.toBe("none");

  await nextTitle.click();
  await expect(nextTitle).toBeFocused();
  await expectFocusVisible(nextTitle, false);
  await expect(nextTitle).toHaveCSS("box-shadow", "none");
  await expect(title).toHaveCSS("box-shadow", "none");
});

test("dense list rows are 26 px for one line and grow with longer content", async ({
  page,
}) => {
  await gotoListStory(page, "dense-rows");
  const single = page.getByRole("listitem").filter({ hasText: "Billing" });
  const long = page
    .getByRole("listitem")
    .filter({ hasText: "A project with a name long enough" });
  const title = page.getByRole("button", { name: "Deploys", exact: true });
  const row = page.getByRole("listitem").filter({ has: title });
  const pin = page.getByRole("button", { name: "Pin Deploys" });

  await expect
    .poll(async () => (await single.boundingBox())?.height)
    .toBeCloseTo(26, 0);
  // A longer row grows past the floor by at least one more 18px line.
  const longBox = await long.boundingBox();
  expect(longBox?.height ?? 0).toBeGreaterThanOrEqual(26 + 18);
  // The pressable title is as high as its row, padding included, so the xs
  // target is at least 24px.
  const titleBox = await title.boundingBox();
  const rowBox = await row.boundingBox();
  expect(titleBox?.height ?? 0).toBeCloseTo(rowBox?.height ?? -1, 0);
  expect(titleBox?.height ?? 0).toBeGreaterThanOrEqual(24);

  // The trailing action stays its own control: it does not open the row.
  await pin.click();
  await expect(page.getByText("Pinned: yes")).toBeVisible();
  await expect(page.getByText("Opened: none")).toBeVisible();
  await title.click();
  await expect(page.getByText("Opened: Deploys")).toBeVisible();

  // A loading dense list keeps the height of its rows: three placeholders are
  // three 26px rows, so the list does not jump when the rows arrive.
  const loading = page.getByRole("list", { name: "Loading projects" });
  await expect
    .poll(async () => (await loading.boundingBox())?.height)
    .toBeCloseTo(3 * 26, 0);
});
