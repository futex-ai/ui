/**
 * Browser coverage for popovers: dismissal, controlled state, and nested
 * selectors.
 */
import { expect, test } from "@playwright/test";

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

test("a selector nested in a popover selects an option without closing the popover", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--selector-in-popover");

  // The popover surface is a named dialog; its trigger is a button that shares
  // the "Line settings" name, so address each by its distinct role.
  const trigger = page.getByRole("button", { name: "Line settings" });
  const dialog = page.getByRole("dialog", { name: "Line settings" });
  await expect(dialog).toBeHidden();

  await trigger.click();
  await expect(dialog).toBeVisible();

  // Open the nested selector. Its menu renders in its own body portal, so it
  // escapes the popover's clipping box and stacks above the surface.
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();

  // The option's centre hit-tests to the option itself, proving the nested menu
  // stacks on top of the popover rather than being covered by it.
  const onTop = await option.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return element === hit || element.contains(hit);
  });
  expect(onTop).toBe(true);

  // Selecting updates the field AND leaves the popover open — the regression:
  // the popover's outside-press dismissal used to treat the sibling-portal
  // option as an outside press and close the whole popover on selection.
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  // A press elsewhere in the popover (its title, outside the menu) closes only
  // the menu; the popover stays open.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await dialog.getByText("Line settings").click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(dialog).toBeVisible();
});

test("a selector nested in a popover closes one layer per Escape and per outside press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--selector-in-popover");
  const dialog = page.getByRole("dialog", { name: "Line settings" });

  await page.getByRole("button", { name: "Line settings" }).click();
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeVisible();

  // Escape closes only the top layer (the menu); the popover beneath stays open.
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeHidden();
  await expect(dialog).toBeVisible();

  // With no overlay above it, the next Escape closes the popover itself.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // A single outside press with both open dismisses the whole stack.
  await page.getByRole("button", { name: "Line settings" }).click();
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeHidden();
  await expect(dialog).toBeHidden();
});
