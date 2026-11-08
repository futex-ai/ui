/**
 * Browser coverage for button content: icons, custom icon nodes, and inline
 * buttons.
 */
import { expect, test } from "@playwright/test";

test("button with icons renders its labelled actions", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--with-icons");

  await expect(page.getByRole("button", { name: "Add account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
});

test("custom button icon nodes cannot take pointer focus", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--custom-icon-node");

  const button = page.getByRole("button", { name: "Add" });
  const icon = button.locator("svg");
  await expect(icon).toHaveAttribute("tabindex", "-1");

  const iconBox = await icon.boundingBox();
  expect(iconBox).not.toBeNull();
  await page.mouse.click(
    (iconBox?.x ?? 0) + (iconBox?.width ?? 0) / 2,
    (iconBox?.y ?? 0) + (iconBox?.height ?? 0) / 2,
  );

  // A caller or web renderer can accidentally make a decorative SVG
  // click-focusable with `tabindex=-1`. The icon node is visual content only, so
  // pointer targeting must fall through to the outer button rather than drawing
  // the browser's focus outline on the SVG.
  await expect(button).toBeFocused();
  await expect(icon).not.toBeFocused();
  await expect
    .poll(() =>
      icon.evaluate(
        (node) =>
          getComputedStyle(node.parentElement as HTMLElement).pointerEvents,
      ),
    )
    .toBe("none");
});

test("inline button collapses its margin box to the label line height", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--inline");

  // The first "Restore" chip is a default md/secondary inline button. Its visible
  // pill (border box) is deliberately taller than a line of text, but its OUTER
  // (margin) box — border box plus the negative vertical margins — collapses to
  // exactly the md label line height (16px). That collapse is what keeps the chip
  // from adding any height to the row it flows in; the pill just overflows the
  // text line above and below.
  const chip = page.getByRole("button", { name: "Restore" }).first();
  const box = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      borderBox: rect.height,
      marginBox:
        rect.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom),
    };
  });

  // The margin box is the md label line height (16px). Pins the negative-margin
  // math, including the +1px-per-side base-border cancellation: dropping it would
  // leave the margin box at ~18px and fail here.
  expect(Math.abs(box.marginBox - 16)).toBeLessThanOrEqual(1);
  // The visible pill is meaningfully taller than that collapsed footprint — it
  // overflows the text line rather than growing it.
  expect(box.borderBox).toBeGreaterThan(box.marginBox + 2);
});
