/**
 * Browser coverage for the shared size scale across buttons, inputs, switches,
 * selectors, chip fields, date fields, and segmented controls.
 */
import { expect, test } from "@playwright/test";

test("button sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--sizes");

  const extraSmall = await page
    .getByRole("button", { name: "Extra small" })
    .boundingBox();
  const small = await page
    .getByRole("button", { name: "Small", exact: true })
    .boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium" })
    .boundingBox();
  const large = await page.getByRole("button", { name: "Large" }).boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // xs / sm / md / lg map to 26 / 30 / 38 / 46px tall buttons.
  expect(Math.abs((extraSmall?.height ?? 0) - 26)).toBeLessThanOrEqual(1);
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("input sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--field-sizes");

  const extraSmall = await page
    .getByRole("textbox", { name: "Extra small field" })
    .boundingBox();
  const clear = await page
    .getByRole("button", { name: "Clear Extra small field" })
    .boundingBox();
  const small = await page
    .getByLabel("Small field", { exact: true })
    .boundingBox();
  const medium = await page.getByLabel("Medium field").boundingBox();
  const large = await page.getByLabel("Large field").boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(clear).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // getByLabel resolves the inner TextInput, whose height is the size's input
  // height (24 / 30 / 38 / 46) inside the 26 / 32 / 40 / 48px box.
  expect(Math.abs((extraSmall?.height ?? 0) - 24)).toBeLessThanOrEqual(1);
  // An xs field action, such as Clear, is a 24 by 24px target.
  expect(Math.abs((clear?.width ?? 0) - 24)).toBeLessThanOrEqual(1);
  expect(Math.abs((clear?.height ?? 0) - 24)).toBeLessThanOrEqual(1);
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("switch sizes step the touch target across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=switch-examples--sizes");

  const extraSmall = await page
    .getByRole("switch", { name: "Extra small switch" })
    .boundingBox();
  const small = await page
    .getByRole("switch", { name: "Small switch", exact: true })
    .boundingBox();
  const medium = await page
    .getByRole("switch", { name: "Medium switch" })
    .boundingBox();
  const large = await page
    .getByRole("switch", { name: "Large switch" })
    .boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The switch has no dense design, so xs draws the sm switch.
  expect(Math.abs((extraSmall?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  // sm / md / lg keep a 40 / 44 / 48px touch target around the track.
  expect(Math.abs((small?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 44)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("dropdown selector sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--selector-sizes");

  const extraSmall = await page
    .getByRole("button", { name: "Extra small selector, Standard" })
    .boundingBox();
  const small = await page
    .getByRole("button", { name: "Small selector, Standard", exact: true })
    .boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium selector, Standard" })
    .boundingBox();
  const large = await page
    .getByRole("button", { name: "Large selector, Standard" })
    .boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The field variant reuses the input box scale: 26 / 32 / 40 / 48px tall.
  expect(Math.abs((extraSmall?.height ?? 0) - 26)).toBeLessThanOrEqual(1);
  expect(Math.abs((small?.height ?? 0) - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("date field sizes step the trigger height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--date-field-sizes");

  const extraSmall = await page.getByLabel("Extra small").boundingBox();
  const small = await page.getByLabel("Small", { exact: true }).boundingBox();
  const medium = await page.getByLabel("Medium").boundingBox();
  const large = await page.getByLabel("Large").boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The web trigger is an InputFrame, so getByLabel resolves the inner input at
  // the same 24 / 30 / 38 / 46px input heights as the plain text field.
  expect(Math.abs((extraSmall?.height ?? 0) - 24)).toBeLessThanOrEqual(1);
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);

  // The dense tap trigger, which the wheel variant uses on web, keeps its
  // Clear in a 24 by 24px box: never below the 24px target, and at most 1px
  // over it. A press in the box's padding, outside the 14px icon, clears the
  // date and does not open the picker.
  const wheelClear = page.getByRole("button", { name: "Clear Dense wheel" });
  const wheelClearBox = await wheelClear.boundingBox();
  expect(wheelClearBox).not.toBeNull();
  expect(wheelClearBox?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(wheelClearBox?.width ?? 0).toBeLessThanOrEqual(25);
  expect(wheelClearBox?.height ?? 0).toBeGreaterThanOrEqual(24);
  expect(wheelClearBox?.height ?? 0).toBeLessThanOrEqual(25);
  await wheelClear.click({ position: { x: 2, y: 2 } });
  await expect(
    page.getByRole("button", { name: "Dense wheel: Select a date" }),
  ).toBeVisible();
  await expect(wheelClear).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("segmented control sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--sizes");

  const extraSmall = await page
    .getByRole("radiogroup", { name: "Extra small report" })
    .boundingBox();
  const extraSmallOutline = await page
    .getByRole("radiogroup", { name: "Extra small outline report" })
    .boundingBox();
  const small = await page
    .getByRole("radiogroup", { name: "Small report", exact: true })
    .boundingBox();
  const medium = await page
    .getByRole("radiogroup", { name: "Medium report" })
    .boundingBox();
  const large = await page
    .getByRole("radiogroup", { name: "Large report" })
    .boundingBox();

  expect(extraSmall).not.toBeNull();
  expect(extraSmallOutline).not.toBeNull();
  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The dense size fixes its lines: a 26px pill track, or 26px outline cells.
  expect(Math.abs((extraSmall?.height ?? 0) - 26)).toBeLessThanOrEqual(1);
  expect(Math.abs((extraSmallOutline?.height ?? 0) - 26)).toBeLessThanOrEqual(
    1,
  );
  // The segment padding and type scale grow with the size, so the rendered
  // control height increases monotonically (exact px depends on font metrics).
  expect(small?.height ?? 0).toBeGreaterThan(extraSmall?.height ?? 0);
  expect(medium?.height ?? 0).toBeGreaterThan(small?.height ?? 0);
  expect(large?.height ?? 0).toBeGreaterThan(medium?.height ?? 0);

  // Icon-only dense segments keep the same lines, whatever they show: pills
  // never below the 24px target in a 26px track, and 26px outline cells
  // around a small custom node. Each target is checked before its group, so a
  // target that is too small fails its own check.
  const iconTrack = await page
    .getByRole("radiogroup", { name: "Extra small icon layout" })
    .boundingBox();
  const iconPill = await page
    .getByRole("radio", { name: "Board", exact: true })
    .boundingBox();
  const iconCells = await page
    .getByRole("radiogroup", { name: "Extra small icon status" })
    .boundingBox();
  const iconCell = await page
    .getByRole("radio", { name: "Live", exact: true })
    .boundingBox();

  expect(iconTrack).not.toBeNull();
  expect(iconPill).not.toBeNull();
  expect(iconCells).not.toBeNull();
  expect(iconCell).not.toBeNull();
  expect(iconPill?.height ?? 0).toBeGreaterThanOrEqual(24);
  expect(iconPill?.height ?? 0).toBeLessThanOrEqual(25);
  expect(iconPill?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(iconTrack?.height ?? 0).toBe(26);
  expect(iconCell?.height ?? 0).toBe(26);
  expect(iconCell?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(iconCells?.height ?? 0).toBe(26);
});

test("a dense chip field keeps its small chips and 24px removal targets", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--chip-multi-select");

  // The chip field has no dense design, so `xs` draws the `sm` 20px chips in
  // the 32px field, as the same chip in the `sm` reference field shows. Each
  // `xs` removal still keeps the 24 by 24px dense target. A chip has no role
  // of its own, so the test finds it as the parent of its removal.
  const fieldOf = (name: string) =>
    page
      .locator('[data-firna-focus-host="descendant"]')
      .filter({ has: page.getByRole("combobox", { exact: true, name }) });
  const field = fieldOf("Extra small books");
  const smallField = fieldOf("Small books");
  const remove = field.getByRole("button", { name: "Remove Payroll Reserve" });
  const smallRemove = smallField.getByRole("button", {
    name: "Remove Payroll Reserve",
  });
  const removeBox = await remove.boundingBox();
  const chipBox = await remove.locator("xpath=..").boundingBox();
  const fieldBox = await field.boundingBox();
  const smallChipBox = await smallRemove.locator("xpath=..").boundingBox();
  const smallFieldBox = await smallField.boundingBox();

  expect(removeBox).not.toBeNull();
  expect(chipBox).not.toBeNull();
  expect(fieldBox).not.toBeNull();
  expect(removeBox?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(removeBox?.height ?? 0).toBeGreaterThanOrEqual(24);
  expect(chipBox?.height ?? 0).toBe(20);
  expect(fieldBox?.height ?? 0).toBe(32);
  // The painted chip and field differ from the `sm` reference by zero.
  expect(chipDrawing(chipBox, fieldBox)).toEqual(
    chipDrawing(smallChipBox, smallFieldBox),
  );

  // A press 1px inside the corner of the target, above the painted chip,
  // removes that chip only. Like a press on the glyph, it does not focus the
  // search input or open the option list.
  const pressX = (removeBox?.x ?? 0) + 1;
  const pressY = (removeBox?.y ?? 0) + 1;
  expect(pressY).toBeLessThan(chipBox?.y ?? 0);
  await page.mouse.click(pressX, pressY);
  await expect(remove).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { exact: true, name: "Extra small books" }),
  ).not.toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(smallRemove).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove Greenhouse Studio" }),
  ).toBeVisible();
});

type Box = { height: number; width: number; x: number; y: number } | null;

/** The painted size of a chip and its field, and the chip's place in it. */
function chipDrawing(chip: Box, field: Box) {
  return {
    chip: [chip?.width, chip?.height],
    field: [field?.width, field?.height],
    place: [(chip?.x ?? 0) - (field?.x ?? 0), (chip?.y ?? 0) - (field?.y ?? 0)],
  };
}
