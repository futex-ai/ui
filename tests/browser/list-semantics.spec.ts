/** Browser coverage for List semantics: roles, activation, and separators. */
import { expect, test } from "@playwright/test";

test("list exposes list semantics and activates items by click and keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=list-examples--clickable-items");

  // Proper list semantics around the clickable rows: a list owning one
  // listitem per person.
  await expect(page.getByRole("list")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(3);

  await page.getByRole("button", { name: "Open Calum Moore" }).click();
  await expect(page.getByText("Opened Calum Moore")).toBeVisible();

  // Each item is a real button, so it is focusable and activates on Enter.
  const peter = page.getByRole("button", { name: "Open Peter Parker" });
  await peter.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Opened Peter Parker")).toBeVisible();
});

test("list draws a separator between items but not after the last", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=list-examples--payroll");

  // Three people → two separators between them, and crucially none trailing the
  // final row (the bug the component fixes). Separators are presentational
  // (aria-hidden), so assert against the rendered hairline DOM.
  await expect(page.getByRole("listitem")).toHaveCount(3);

  const layout = await page.evaluate(() => {
    const list = document.querySelector('[role="list"]');
    if (!list) return null;
    const children = Array.from(list.children);
    const isSeparator = (el: Element) =>
      el.getAttribute("role") === "presentation" &&
      el.getAttribute("aria-hidden") === "true";
    return {
      separators: children.filter(isSeparator).length,
      lastIsSeparator: isSeparator(children[children.length - 1]),
    };
  });
  // Three items → exactly two separators between them, and — the bug fix — the
  // final child is an item, never a trailing separator.
  expect(layout?.separators).toBe(2);
  expect(layout?.lastIsSeparator).toBe(false);
});
