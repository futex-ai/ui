/**
 * Browser coverage for the drag-select marquee: matching, the start distance,
 * cancellation, and the disabled state.
 */
import { expect, test } from "@playwright/test";

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
