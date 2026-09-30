/**
 * Browser coverage for measured web dropdown placement. A portal surface is
 * first laid out at its natural height to be measured and is then clamped to
 * the room beside its trigger, all before paint, so list effects that ran
 * against the first layout must not leave the list scrolled wrong.
 */
import { expect, test, type Locator } from "@playwright/test";

const storyReadyTimeout = 30_000;

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box ?? { height: 0, width: 0, x: 0, y: 0 };
}

test("a list clamped beside its trigger opens with its selected option in view", async ({
  page,
}) => {
  // Short enough that the 28-option list cannot fit its 320px cap on either
  // side of the top trigger, so it opens below, clamped shorter than the
  // natural height it was first laid out at.
  await page.setViewportSize({ height: 380, width: 900 });
  await page.goto(
    "/iframe.html?id=dropdown-examples--bottom-edge-flip&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "Opens below, Long option 01",
  });
  await expect(trigger).toBeVisible({ timeout: storyReadyTimeout });
  await trigger.click();
  await page
    .getByRole("option", { exact: true, name: "Long option 20" })
    .click();

  await page
    .getByRole("button", { name: "Opens below, Long option 20" })
    .click();
  const list = page.getByRole("listbox");
  const selected = list.getByRole("option", {
    exact: true,
    name: "Long option 20",
  });
  await expect(selected).toHaveAttribute("aria-selected", "true");
  const triggerBox = await boxOf(
    page.getByRole("button", { name: "Opens below, Long option 20" }),
  );
  const listBox = await boxOf(list);
  expect(listBox.y).toBeGreaterThan(triggerBox.y);
  expect(listBox.height).toBeLessThan(300);

  await expect
    .poll(async () => {
      const row = await boxOf(selected);
      return (
        row.y >= listBox.y - 1 &&
        row.y + row.height <= listBox.y + listBox.height + 1
      );
    })
    .toBe(true);
});
