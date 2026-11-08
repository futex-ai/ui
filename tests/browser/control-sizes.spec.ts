/**
 * Browser coverage for the shared size scale across buttons, inputs, switches,
 * selectors, date fields, and segmented controls.
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
});
