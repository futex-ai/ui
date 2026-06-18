import { expect, test, type Page } from "@playwright/test";

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

test("dropdown action menu opens from child trigger and closes after selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  const trigger = page.getByRole("button", { name: "Open action menu" });
  // The trigger advertises its popup to assistive tech in every mode.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  await expect(settings).toBeVisible();
  await expect(
    page.getByRole("menuitem", { exact: true, name: "Remove" }),
  ).toBeVisible();

  await settings.click();
  await expect(page.getByText("Last action: Settings")).toBeVisible();
  await expect(settings).toBeHidden();
});

test("dropdown action menu preselects first row and tracks hover selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  await page.getByRole("button", { name: "Open action menu" }).click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  const remove = page.getByRole("menuitem", { exact: true, name: "Remove" });
  await expect(settings).toBeVisible();
  await expect(remove).toBeVisible();

  const activeBackground = await backgroundColor(settings);
  expect(activeBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(await backgroundColor(remove)).not.toBe(activeBackground);

  await remove.hover();
  await expect.poll(() => backgroundColor(remove)).toBe(activeBackground);
  await expect.poll(() => backgroundColor(settings)).not.toBe(activeBackground);

  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Remove")).toBeVisible();
  await expect(remove).toBeHidden();

  await page.getByRole("button", { name: "Open action menu" }).click();
  await expect(settings).toBeVisible();
  await expect.poll(() => backgroundColor(settings)).toBe(activeBackground);
  await expect.poll(() => backgroundColor(remove)).not.toBe(activeBackground);
});

test("dropdown hover menu opens on pointer hover and closes on hover out", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-hover-menu");

  const trigger = page.getByRole("button", { name: "Open hover menu" });
  const profile = page.getByRole("menuitem", { exact: true, name: "Profile" });

  await trigger.hover();
  await expect(profile).toBeVisible();

  // Move the pointer well away from the trigger and surface to hover out.
  await page.mouse.move(5, 5);
  await expect(profile).toBeHidden();
});

test("dropdown long-press menu opens on press-and-hold, not a plain tap", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-long-press-menu",
  );

  const trigger = page.getByRole("button", { name: "Open long-press menu" });
  const rename = page.getByRole("menuitem", { exact: true, name: "Rename" });

  // A quick tap must not open a long-press menu.
  await trigger.click();
  await expect(rename).toBeHidden();

  // Press and hold past the long-press delay opens it.
  const box = await trigger.boundingBox();
  if (!box) {
    throw new Error("long-press trigger not found");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();

  await expect(rename).toBeVisible();
});

test("dropdown context menu opens on right-click, not on a left click", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-context-menu");

  const trigger = page.getByRole("button", { name: "Open context menu" });
  const copy = page.getByRole("menuitem", { exact: true, name: "Copy" });

  // A left click must not open a context menu.
  await trigger.click();
  await expect(copy).toBeHidden();

  await trigger.click({ button: "right" });
  await expect(copy).toBeVisible();
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

async function backgroundColor(locator: ReturnType<Page["getByRole"]>) {
  return locator.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
}

test("searchable dropdown selector filters options and selects by keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--searchable-selector");

  await page.getByRole("button", { name: "Currency, US Dollar" }).click();

  // The search input is focused on open. Typing (including the space bar, which
  // must reach the input rather than activate a row) narrows the option rows
  // while keeping focus in the input.
  const search = page.getByPlaceholder("Search options");
  await expect(search).toBeFocused();

  // The search field's border lines up with the option rows' (selected)
  // background, so its left and right edges match the highlighted row.
  const alignment = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Search options"]');
    const field = input?.parentElement ?? null;
    const selectedRow =
      Array.from(document.querySelectorAll('[role="option"]')).find(
        (element) => element.textContent?.trim() === "US Dollar",
      ) ?? null;
    if (!field || !selectedRow) {
      return null;
    }
    const fieldRect = field.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    return {
      left: Math.abs(fieldRect.left - rowRect.left),
      right: Math.abs(fieldRect.right - rowRect.right),
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.left).toBeLessThanOrEqual(1);
  expect(alignment?.right).toBeLessThanOrEqual(1);

  await search.pressSequentially("new z");
  await expect(
    page.getByRole("option", { exact: true, name: "New Zealand Dollar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "US Dollar" }),
  ).toBeHidden();
  await expect(search).toBeFocused();

  // Enter activates the highlighted match and closes the menu.
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Currency, New Zealand Dollar" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search options")).toBeHidden();

  // Reopening starts from the full list again; a non-matching query shows the
  // empty state.
  await page
    .getByRole("button", { name: "Currency, New Zealand Dollar" })
    .click();
  await page.getByPlaceholder("Search options").fill("zzz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "Euro" }),
  ).toBeHidden();
});

test("combobox keeps input focus while filtering options", async ({ page }) => {
  await page.goto("/iframe.html?id=dropdown-examples--input-backed-combobox");

  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("pay");

  await expect(page.getByText("Payroll Reserve")).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("zz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(input).toBeFocused();
  await expect(
    page.getByText("Only active books can be selected."),
  ).toBeVisible();
});

test("dropdown placement flips above the trigger near the bottom edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--bottom-edge-flip");

  // The selector pinned to the bottom of the viewport has no room below, so the
  // long menu opens upward: its rows sit above the trigger.
  const bottomTrigger = page.getByRole("button", {
    name: "Flips above, Long option 01",
  });
  await bottomTrigger.click();
  const bottomTriggerBox = await bottomTrigger.boundingBox();
  const upwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(bottomTriggerBox).not.toBeNull();
  expect(upwardOption).not.toBeNull();
  expect(upwardOption?.y ?? 0).toBeLessThan(bottomTriggerBox?.y ?? 0);
  await page.keyboard.press("Escape");

  // The selector near the top has space below, so the same menu opens downward.
  const topTrigger = page.getByRole("button", {
    name: "Opens below, Long option 01",
  });
  await topTrigger.click();
  const topTriggerBox = await topTrigger.boundingBox();
  const downwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(topTriggerBox).not.toBeNull();
  expect(downwardOption).not.toBeNull();
  expect(downwardOption?.y ?? 0).toBeGreaterThan(topTriggerBox?.y ?? 0);
});

test("dropdown placement clamps a wide menu inside the side edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--horizontal-edge-clamp");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  // The right-edge menu is wider than its trigger, so it shifts left to stay
  // fully on screen rather than spilling past the right edge.
  const rightTrigger = page.getByRole("button", {
    name: "Open right edge menu",
  });
  await rightTrigger.click();
  const rightTriggerBox = await rightTrigger.boundingBox();
  const rightOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(rightTriggerBox).not.toBeNull();
  expect(rightOption).not.toBeNull();
  // Fully inside the right edge...
  expect((rightOption?.x ?? 0) + (rightOption?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
  // ...and shifted left of the trigger to make room.
  expect(rightOption?.x ?? 0).toBeLessThan(rightTriggerBox?.x ?? 0);
  await page.keyboard.press("Escape");

  // The left-edge menu stays pinned at the left margin (never off-screen).
  await page.getByRole("button", { name: "Open left edge menu" }).click();
  const leftOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(leftOption).not.toBeNull();
  expect(leftOption?.x ?? -1).toBeGreaterThanOrEqual(0);
});

test("dropdown placement end-aligns a wide menu to the trigger edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--end-aligned-menu");

  const trigger = page.getByRole("button", { name: "Open end aligned menu" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // The wide menu extends leftward from the trigger...
  expect(option?.x ?? 0).toBeLessThan(triggerBox?.x ?? 0);
  // ...while its right edge stays aligned to the trigger's right edge.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    (triggerBox?.x ?? 0) + (triggerBox?.width ?? 0) + 2,
  );
});

test("dropdown placement grid flips and stays on screen at the bottom corner", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--edge-placement-grid");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  const trigger = page.getByRole("button", { name: "Bottom right, Region 01" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("option", { exact: true, name: "Region 02" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // Flipped above the trigger near the bottom edge...
  expect(option?.y ?? 0).toBeLessThan(triggerBox?.y ?? 0);
  // ...and inside the right edge of the screen.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
});

test("placement playground reports the side resolved against the content edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--placement-playground");

  // Moving the trigger to the bottom of the content frame leaves no room below,
  // so the engine resolves an upward placement.
  await page
    .getByRole("button", { name: "Move trigger to bottom-right" })
    .click();
  await expect(page.getByText("Opens upward ↑")).toBeVisible();

  // Near the top there is room below, so it resolves a downward placement.
  await page.getByRole("button", { name: "Move trigger to top-left" }).click();
  await expect(page.getByText("Opens downward ↓")).toBeVisible();
});

test("segmented control toggles report and source choices", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  await expect(
    page.getByRole("radio", { name: "Profit & loss" }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "Balance sheet" }).click();
  await expect(
    page.getByRole("radio", { name: "Balance sheet" }),
  ).toBeChecked();

  await expect(page.getByRole("radio", { name: "Combined" })).toBeChecked();
  await page.getByRole("radio", { name: "Consulting" }).click();
  await expect(page.getByRole("radio", { name: "Consulting" })).toBeChecked();
});

test("radio cards expose checked and disabled option states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--accounting-basis-radio-cards",
  );

  const cash = page.getByRole("radio", { name: /Cash basis/ });
  const accrual = page.getByRole("radio", { name: /Accrual basis/ });
  const flatRate = page.getByRole("radio", { name: /Flat rate VAT/ });

  await expect(cash).toBeChecked();
  await accrual.click();
  await expect(accrual).toBeChecked();
  await expect(cash).not.toBeChecked();
  await cash.focus();
  await page.keyboard.press("Space");
  await expect(cash).toBeChecked();
  await expect(accrual).not.toBeChecked();
  await expect(flatRate).toBeDisabled();
});

test("switch toggles a binary setting", async ({ page }) => {
  await page.goto("/iframe.html?id=switch-examples--privacy-toggle");

  const toggle = page.getByRole("switch", { name: "Analytics cookies" });
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
});

test("drag-select marquee selects intersecting target rows", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--ledger-rows");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await expect(page.getByText("3 transactions", { exact: true })).toBeVisible();
  await page.mouse.up();

  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
  await expect(
    page.getByText("Last change: txn_1, txn_2, txn_3"),
  ).toBeVisible();
});

test("drag-select marquee can start in page content", async ({ page }) => {
  await page.goto("/iframe.html?id=drag-select-examples--page-content-area");

  const startZone = page.getByTestId("drag-page-content-start-zone");
  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const startBox = await startZone.boundingBox();
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(startBox).not.toBeNull();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (startBox?.x ?? 0) + (startBox?.width ?? 0) / 2,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await page.mouse.up();

  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
  await expect(
    page.getByText("Last change: txn_1, txn_2, txn_3"),
  ).toBeVisible();
});

test("drag-select minimum distance gates matching and selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--larger-minimum-drag");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (firstBox?.x ?? 0) + 20,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
    { steps: 4 },
  );
  await expect(page.getByText("Matching 0 transactions")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
});

test("drag-select pointer cancellation clears active drag", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--ledger-rows");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();

  await page.evaluate(() => {
    document.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(page.getByText("Matching 3 transactions")).toBeHidden();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();

  await page.mouse.up();
  await expect(page.getByText("Last change: none")).toBeVisible();
});

test("drag-select disabled state cancels active drag", async ({ page }) => {
  await page.goto("/iframe.html?id=drag-select-examples--disabled-during-drag");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );

  await expect(page.getByTestId("drag-disabled-state")).toHaveText(
    "Drag disabled",
  );
  await expect(page.getByText("Matching 3 transactions")).toBeHidden();

  await page.mouse.up();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();
});

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
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textField).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Nested selector, Standard" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();

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

test("date field opens the calendar, navigates months, and picks a day", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open calendar popover is role="dialog" labelled by the field, so it
  // shares the "Year ends" accessible name with the input; target the textbox
  // explicitly. The visible month title also lives inside the dialog, while the
  // shared aria-live region announces the month on navigation (WCAG 4.1.3), so
  // scope month-text assertions to the dialog to skip the announced copy.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");
  // Clear is opt-in: the default field shows no clear button even with a value.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();

  // Focusing the input opens the calendar on the value's month.
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2026" }).click();
  await expect(input).toHaveValue("15 Mar 2026");
  await expect(dialog).toBeHidden();

  // Reopen and step to the previous month, then pick a day there.
  await input.click();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(dialog.getByText("February 2026")).toBeVisible();
  await page.getByRole("button", { name: "10 Feb 2026" }).click();
  await expect(input).toHaveValue("10 Feb 2026");
});

test("date calendar z-index override clears overlapping content", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--calendar-layering");

  const input = page.getByLabel("Layered date");
  await input.click();
  await expect(page.getByText("Overlapping panel")).toBeVisible();
  const day = page.getByRole("button", { name: "15 Mar 2026" });
  await expect(day).toBeVisible();

  const topLabel = await day.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return (
      target?.closest("[aria-label]")?.getAttribute("aria-label") ??
      target?.textContent ??
      ""
    );
  });

  expect(topLabel).toBe("15 Mar 2026");
});

test("date field jumps to a far year through the header year picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover shares the "Year ends" name with the input (it is a
  // role="dialog" labelled by the field), so address the textbox by role; the
  // visible month title lives inside that dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();

  // Clicking the month/year title swaps the day grid for a year picker, where
  // the current year is shown selected and the day grid is gone.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  // The current year carries the filled selected background; an unselected year
  // is transparent. (RNW does not surface accessibilityState.selected as
  // aria-selected on role="button", matching the day cells, so assert the style.)
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const selectedBg = await page
    .getByRole("button", { exact: true, name: "2026" })
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(selectedBg).not.toBe("rgba(0, 0, 0, 0)");
  await expect(
    page.getByRole("button", { name: "Previous month" }),
  ).toBeHidden();

  // Picking a year in view jumps straight to it, keeps the month, and returns to
  // the day grid — without committing a date yet.
  await page.getByRole("button", { exact: true, name: "2018" }).click();
  await expect(dialog.getByText("March 2018")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Reopen the picker and page whole blocks forwards and backwards with the
  // header chevrons.
  await page.getByRole("button", { name: "March 2018, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2030" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Previous years" }).click();
  await page.getByRole("button", { name: "Previous years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2010" }),
  ).toBeVisible();

  // Choosing a year there, then a day, commits as usual and closes the calendar.
  await page.getByRole("button", { exact: true, name: "2010" }).click();
  await expect(dialog.getByText("March 2010")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2010" }).click();
  await expect(input).toHaveValue("15 Mar 2010");
  await expect(dialog).toBeHidden();
});

test("year picker returns to the day grid via the title and keeps keyboard focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover (role="dialog") shares the field's "Year ends" name, so
  // target the input by its textbox role; the month title lives in the dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();

  // Clicking the title again (now "back to month") returns to the day grid
  // without committing a date.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /back to month/ }).click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Selecting a year by keyboard moves focus to the relabelled title button
  // rather than stranding it on <body> when the chosen year cell unmounts.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await page.getByRole("button", { exact: true, name: "2024" }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("March 2024")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "March 2024, change year" }),
  ).toBeFocused();
});

test("bounded date field disables out-of-range years in the picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-date-field");

  const input = page.getByLabel("Year ends");
  await input.click();
  await page.getByRole("button", { name: "March 2026, change year" }).click();

  // Years inside the [2024, 2027] window are pickable; years outside it are not.
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2023" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2016" }),
  ).toBeDisabled();
});

test("popover opens content and closes by Escape, inside close, and outside press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--content-popover");

  const trigger = page.getByRole("button", { name: "Details" });
  const content = page.getByText("Greenhouse Studio");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();

  // Pressing the trigger opens the surface and reports the expanded state.
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Escape closes it.
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // A close control inside the content closes it via the render-prop `close`.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(content).toBeHidden();

  // An outside press dismisses it through the document-level listener.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(content).toBeHidden();
});

test("controlled popover drives external state through onOpenChange", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--controlled-popover");

  const trigger = page.getByRole("button", { name: "Account" });
  const content = page.getByText("Greenhouse Studio");
  const status = page.getByText("Popover is closed");

  // The surface only opens because onOpenChange updated the external state that
  // feeds the controlled `open` prop back in.
  await expect(status).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Popover is open")).toBeVisible();
  await expect(content).toBeVisible();

  // Each dismissal path fires onOpenChange, which closes it via external state.
  await page.keyboard.press("Escape");
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();
});

test("date field clears its value with the clear button", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // Exact match so the clear button ("Clear Year ends") is not also selected.
  const input = page.getByLabel("Year ends", { exact: true });
  await expect(input).toHaveValue("31 Mar 2026");

  // Open the calendar, then clear: clearing empties the field and closes the
  // calendar without popping a fresh one (focus returns to the empty input).
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "Clear Year ends" }).click();

  await expect(input).toHaveValue("");
  await expect(page.getByText("March 2026")).toBeHidden();
  await expect(page.getByText("June 2026")).toBeHidden();
  // The clear button is gone once there is nothing left to clear.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("date field clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });

  // Tabbing from the input reaches the clear button (the calendar icon is
  // tabIndex=-1 and skipped).
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();

  // Activating it via the keyboard clears the value and returns focus to the
  // now-empty input rather than dropping focus to the body.
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
});

test("wheel date field stages a draft and commits the clamped date on Done", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  // The wheel variant uses the tap trigger (no editable input) on web too.
  const trigger = page.getByRole("button", { name: "Year ends: 31 Mar 2026" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const sheet = page.getByRole("dialog", { name: "Year ends" });
  await expect(sheet).toBeVisible();
  // The opened wheel shows the current value's columns.
  await expect(page.getByRole("button", { name: "Month Mar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Year 2026" })).toBeVisible();

  // Spinning to February clamps the 31st down to the month's last valid day,
  // and the draft is not committed until Done: the modal sheet stays open
  // (it does not auto-commit and close), so the trigger keeps its value.
  await page.getByRole("button", { name: "Month Feb" }).click();
  await expect(sheet).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  // Closing the sheet must not bounce it back open (focus returns to the trigger).
  await expect(page.getByRole("button", { name: "Done" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: 28 Feb 2026" }),
  ).toBeVisible();
});

test("wheel date field discards the draft on Cancel", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  await page.getByRole("button", { name: "Year ends: 31 Mar 2026" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeVisible();

  await page.getByRole("button", { name: "Month Jan" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  // Cancel leaves the committed value untouched.
  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();
});

test("bounded wheel date field disables out-of-range rows and commits in range", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-wheel-date-field");

  await page
    .getByRole("button", { name: "Delivery date: 15 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Delivery date" }),
  ).toBeVisible();

  // Only 10–20 Mar 2026 is selectable, so rows outside the window are disabled.
  await expect(page.getByRole("button", { name: "Day 5" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Jan" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Apr" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Day 16" })).toBeEnabled();

  await page.getByRole("button", { name: "Day 16" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Delivery date: 16 Mar 2026" }),
  ).toBeVisible();
});

test("clearable wheel date field clears its value without opening the wheel", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-wheel-date-field");

  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();

  // The clear button sits on the tap trigger; pressing it empties the field and
  // must not open the wheel sheet (clearing is a distinct action).
  await page.getByRole("button", { name: "Clear Year ends" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: Select a date" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("wheel date range opens an independent wheel per endpoint", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-range");

  // Each endpoint is its own wheel sheet. Open the start endpoint and re-pick it.
  await page
    .getByRole("button", { name: "Current period start: 1 Apr 2025" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period start" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Month May" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Current period start: 1 May 2025" }),
  ).toBeVisible();

  // The end endpoint opens its own wheel, unchanged by the start edit.
  await page
    .getByRole("button", { name: "Current period end: 31 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period end" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", { name: "Current period end: 31 Mar 2026" }),
  ).toBeVisible();
});

test("date clear button tracks the committed value, not the typed buffer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");

  // Deleting all the text mid-edit does NOT commit (empty is unparseable), so
  // the committed date remains and the clear button stays visible.
  await input.focus();
  await input.fill("");
  await expect(clear).toBeVisible();

  // Now actually clear it, then type unparseable partial text into the empty
  // field: there is no committed value, so no clear button appears.
  await clear.click();
  await expect(input).toHaveValue("");
  await input.fill("5 Ju");
  await expect(clear).toBeHidden();
});

test("input field highlights validation state and clears it on valid input", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--validated-field");

  // The visible label names the input, and the error message turns the field
  // invalid (announced via aria-invalid).
  const input = page.getByLabel("Email");
  await expect(input).toHaveValue("not-an-email");
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");

  // A valid value drops the error and the invalid state.
  await input.fill("ada@example.com");
  await expect(page.getByText("Enter a valid email address")).toBeHidden();
  await expect(input).toHaveAttribute("aria-invalid", "false");
});

test("input clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--clearable-field");

  const input = page.getByLabel("Search", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Search" });
  await expect(input).toHaveValue("Quarterly report");
  await expect(clear).toBeVisible();

  // Tab from the input reaches the clear button (no decorative icon to skip
  // here), then Enter clears the value and returns focus to the empty input.
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  // The clear button is gone once there is nothing left to clear.
  await expect(clear).toBeHidden();
});

test("input password suffix toggles between show and hide", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--password-field");

  // Exact so the "Show password" suffix button is not also matched.
  const input = page.getByLabel("Password", { exact: true });
  await input.fill("hunter2");

  // The suffix icon is an accessible button (it has a label) whose name flips as
  // it toggles the masked input.
  const show = page.getByRole("button", { name: "Show password" });
  await expect(show).toBeVisible();
  await show.click();
  await expect(
    page.getByRole("button", { name: "Hide password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show password" }),
  ).toBeHidden();
});

test("avatar renders initials and sizes the disc from the size prop", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=avatar-examples--user-avatars");

  // The solid (default) and soft variants both render their initials.
  await expect(page.getByText("GS", { exact: true })).toBeVisible();
  await expect(page.getByText("PR", { exact: true })).toBeVisible();
  await expect(page.getByText("AR", { exact: true })).toHaveCSS(
    "color",
    "rgb(116, 81, 31)",
  );
  await expect(page.locator('[aria-label="Accounts Receivable"]')).toHaveCSS(
    "background-color",
    "rgb(244, 236, 216)",
  );

  // The accessibilityLabel names the disc for assistive tech, and the size prop
  // drives the rendered circle (size={48} → a 48x48 disc).
  const sized = page.locator('[aria-label="Vivienne Archer"]');
  await expect(sized).toBeVisible();
  const box = await sized.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(47);
  expect(box?.width).toBeLessThanOrEqual(49);
  expect(box?.height).toBeGreaterThanOrEqual(47);
  expect(box?.height).toBeLessThanOrEqual(49);
});

test("button reflects press and disabled state", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  // Exact match so "Save" does not also resolve the "Saved" button.
  const save = page.getByRole("button", { exact: true, name: "Save" });
  await expect(save).toBeVisible();
  // A button without an enabled handler is exposed as disabled.
  await expect(
    page.getByRole("button", { name: "Unavailable" }),
  ).toBeDisabled();

  // Pressing the primary button swaps its label.
  await save.click();
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Save" }),
  ).toBeHidden();
});

test("button deepens its fill on hover, per tone", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--tones");

  const primary = page.getByRole("button", { name: "Primary" });
  const secondary = page.getByRole("button", { name: "Secondary" });
  const ghost = page.getByRole("button", { name: "Ghost" });
  const danger = page.getByRole("button", { name: "Danger" });

  // Resting: the primary tone carries the theme primary fill.
  await expect(primary).toHaveCSS("background-color", "rgb(79, 120, 100)");

  // Hover deepens the filled tone to primaryDeep (raising the white label's
  // contrast), and washes the neutral / ghost tones with their token: soft for
  // the secondary, the primary accent's primarySoft for ghost.
  await primary.hover();
  await expect(primary).toHaveCSS("background-color", "rgb(47, 89, 69)");
  await secondary.hover();
  await expect(secondary).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await ghost.hover();
  await expect(ghost).toHaveCSS("background-color", "rgb(227, 238, 230)");
  // Danger keeps its surface fill (a wash would drop the rose label below AA)
  // and instead firms its border from roseSoft to full rose (rgb(168, 79, 69)).
  await danger.hover();
  await expect(danger).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(danger).toHaveCSS("border-top-color", "rgb(168, 79, 69)");
});

test("disabled button does not take a hover fill", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--block-and-disabled");

  const disabled = page.getByRole("button", { name: "Disabled" });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // Hovering a disabled button leaves its surface fill untouched.
  await disabled.hover({ force: true });
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("button activates from the keyboard", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button activates with the Space key", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button with icons renders its labelled actions", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--with-icons");

  await expect(page.getByRole("button", { name: "Add account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
});

test("button sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--sizes");

  const small = await page.getByRole("button", { name: "Small" }).boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium" })
    .boundingBox();
  const large = await page.getByRole("button", { name: "Large" }).boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // sm / md / lg map to 30 / 38 / 46px tall buttons.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("input sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--field-sizes");

  const small = await page.getByLabel("Small field").boundingBox();
  const medium = await page.getByLabel("Medium field").boundingBox();
  const large = await page.getByLabel("Large field").boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // getByLabel resolves the inner TextInput, whose height is the size's input
  // height (30 / 38 / 46) inside the 32 / 40 / 48px box.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("switch sizes step the touch target across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=switch-examples--sizes");

  const small = await page
    .getByRole("switch", { name: "Small switch" })
    .boundingBox();
  const medium = await page
    .getByRole("switch", { name: "Medium switch" })
    .boundingBox();
  const large = await page
    .getByRole("switch", { name: "Large switch" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // sm / md / lg keep a 40 / 44 / 48px touch target around the track.
  expect(Math.abs((small?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 44)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("dropdown selector sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--selector-sizes");

  const small = await page
    .getByRole("button", { name: "Small selector, Standard" })
    .boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium selector, Standard" })
    .boundingBox();
  const large = await page
    .getByRole("button", { name: "Large selector, Standard" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The field variant reuses the input box scale: 32 / 40 / 48px tall.
  expect(Math.abs((small?.height ?? 0) - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("date field sizes step the trigger height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--date-field-sizes");

  const small = await page.getByLabel("Small").boundingBox();
  const medium = await page.getByLabel("Medium").boundingBox();
  const large = await page.getByLabel("Large").boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The web trigger is an InputFrame, so getByLabel resolves the inner input at
  // the same 30 / 38 / 46px input heights as the plain text field.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("segmented control sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--sizes");

  const small = await page
    .getByRole("radiogroup", { name: "Small report" })
    .boundingBox();
  const medium = await page
    .getByRole("radiogroup", { name: "Medium report" })
    .boundingBox();
  const large = await page
    .getByRole("radiogroup", { name: "Large report" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The segment padding and type scale grow with the size, so the rendered
  // control height increases monotonically (exact px depends on font metrics).
  expect(small?.height ?? 0).toBeGreaterThan(0);
  expect(medium?.height ?? 0).toBeGreaterThan(small?.height ?? 0);
  expect(large?.height ?? 0).toBeGreaterThan(medium?.height ?? 0);
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

test("heatmap labels the months across a full-year range", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-year");

  // A year range labels every month at the column where it begins.
  await expect(page.getByText("Jan", { exact: true })).toBeVisible();
  await expect(page.getByText("Jul", { exact: true })).toBeVisible();
  await expect(page.getByText("Dec", { exact: true })).toBeVisible();
});

test("heatmap reports the pressed cell to its handler", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-interactive");

  await expect(page.getByText("None selected")).toBeVisible();
  // Each in-range cell is a button named by its accessible date + value label.
  await page.getByRole("button", { name: "15 Jan 2024: 8 (high)" }).click();
  await expect(page.getByText("Selected: 2024-01-15 (8)")).toBeVisible();
});
