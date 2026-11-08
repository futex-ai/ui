/** Browser coverage for kanban card moves by pointer and keyboard. */
import { expect, test } from "@playwright/test";

test("kanban card drags to another column with the pointer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const drafted = page.getByTestId("kanban-column-drafted");
  const approved = page.getByTestId("kanban-column-approved");
  // The card starts in the Drafted column.
  await expect(drafted.getByTestId("kanban-card-c1")).toBeVisible();

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const targetBox = await approved.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    // Aim near the bottom of the column (past its last card) so the drop lands
    // at the end of the Approved list; the 24px inset clears the column padding.
    (targetBox?.x ?? 0) + (targetBox?.width ?? 0) / 2,
    (targetBox?.y ?? 0) + (targetBox?.height ?? 0) - 24,
    { steps: 12 },
  );
  await page.mouse.up();

  // It now lives under the Approved column, the move was reported, and the drag
  // did NOT also fire the card's onCardPress (the post-drag click is suppressed).
  await expect(approved.getByTestId("kanban-card-c1")).toBeVisible();
  await expect(drafted.getByTestId("kanban-card-c1")).toHaveCount(0);
  await expect(page.getByText(/Moved c1 to approved/)).toBeVisible();
  await expect(page.getByText(/Opened/)).toHaveCount(0);
});

test("kanban shows a floating clone and a drop preview while dragging", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const approvedBox = await page
    .getByTestId("kanban-column-approved")
    .boundingBox();
  expect(cardBox).not.toBeNull();
  expect(approvedBox).not.toBeNull();

  // Press and hold a drag over the Approved column, without releasing.
  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (approvedBox?.x ?? 0) + (approvedBox?.width ?? 0) / 2,
    (approvedBox?.y ?? 0) + 60,
    { steps: 10 },
  );

  // The card is lifted out of the flow, a clone rides the cursor, and a
  // translucent preview marks where it would land.
  await expect(page.getByTestId("kanban-drag-ghost")).toBeVisible();
  await expect(page.getByTestId("kanban-drop-preview")).toBeVisible();
  await expect(page.getByTestId("kanban-card-c1")).toHaveCount(0);

  await page.mouse.up();

  // After the drop the clone and preview are gone and the card is placed.
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);
  await expect(page.getByTestId("kanban-drop-preview")).toHaveCount(0);
  await expect(
    page.getByTestId("kanban-column-approved").getByTestId("kanban-card-c1"),
  ).toBeVisible();
});

test("kanban ghost keeps viewport coordinates inside a transformed scroller", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const board = page.getByRole("group", { name: "Content board" });
  const scrollerState = await board.evaluate((element) => {
    const scroller = element.parentElement;
    if (!scroller) {
      throw new Error("Kanban story is missing its host element");
    }
    Object.assign(scroller.style, {
      height: "420px",
      overflow: "auto",
      padding: "96px 72px 240px",
      transform: "translateZ(0)",
    });
    scroller.scrollTop = 48;
    return {
      scrollTop: scroller.scrollTop,
      scrollable: scroller.scrollHeight > scroller.clientHeight,
      transform: getComputedStyle(scroller).transform,
    };
  });
  expect(scrollerState.scrollable).toBe(true);
  expect(scrollerState.scrollTop).toBeGreaterThan(0);
  expect(scrollerState.transform).not.toBe("none");

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const approvedBox = await page
    .getByTestId("kanban-column-approved")
    .boundingBox();
  expect(cardBox).not.toBeNull();
  expect(approvedBox).not.toBeNull();

  const pointerX = (approvedBox?.x ?? 0) + (approvedBox?.width ?? 0) / 2;
  const pointerY = (approvedBox?.y ?? 0) + 80;
  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(pointerX, pointerY, { steps: 10 });

  const ghost = page.getByTestId("kanban-drag-ghost");
  await expect(ghost).toBeVisible();
  expect(
    await ghost.evaluate((element) => element.parentElement === document.body),
  ).toBe(true);
  const ghostBox = await ghost.boundingBox();
  expect(ghostBox).not.toBeNull();
  expect(
    Math.abs((ghostBox?.x ?? 0) + (ghostBox?.width ?? 0) / 2 - pointerX),
  ).toBeLessThan(2);
  expect(
    Math.abs((ghostBox?.y ?? 0) + (ghostBox?.height ?? 0) / 2 - pointerY),
  ).toBeLessThan(2);

  await page.mouse.up();
});

test("kanban clicking a draggable card opens it instead of moving it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  // A plain click (no drag past the threshold) fires onCardPress, not a move.
  await page.getByTestId("kanban-card-c3").click();
  await expect(page.getByText("Opened c3")).toBeVisible();
  await expect(
    page.getByTestId("kanban-column-approved").getByTestId("kanban-card-c3"),
  ).toBeVisible();
});

test("kanban a drag that lands back home does not open the card", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  // Drag c3 within its own column and release at the same slot: a real drag
  // (past the threshold) that is a no-op move must still suppress onCardPress.
  const box = await page.getByTestId("kanban-card-c3").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2 + 24,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect(page.getByText(/Opened/)).toHaveCount(0);
  await expect(page.getByText(/Moved/)).toHaveCount(0);
});

test("kanban card moves between columns with the keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const approved = page.getByTestId("kanban-column-approved");
  await page.getByTestId("kanban-card-c2").focus();
  await page.keyboard.press("Space"); // grab
  await page.keyboard.press("ArrowRight"); // move to the next column
  await page.keyboard.press("Enter"); // drop (Enter and Space both drop)

  await expect(approved.getByTestId("kanban-card-c2")).toBeVisible();
  await expect(page.getByText(/Moved c2 to approved/)).toBeVisible();
  // Focus is restored to the moved card so keyboard users keep their place.
  await expect(page.getByTestId("kanban-card-c2")).toBeFocused();
});

test("kanban keyboard drag cancels on Escape without moving", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const drafted = page.getByTestId("kanban-column-drafted");
  await page.getByTestId("kanban-card-c2").focus();
  await page.keyboard.press("Space"); // grab
  await page.keyboard.press("ArrowRight"); // move to the next column
  await page.keyboard.press("Escape"); // cancel

  // The card stays put, no move was reported, and focus returns to the card.
  await expect(drafted.getByTestId("kanban-card-c2")).toBeVisible();
  await expect(page.getByText(/Moved c2/)).toHaveCount(0);
  await expect(page.getByTestId("kanban-card-c2")).toBeFocused();
});
