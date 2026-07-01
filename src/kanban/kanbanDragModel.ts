/**
 * Pure geometry and bookkeeping for the Kanban drag-and-drop, kept free of React
 * and React Native so it can be unit-tested directly.
 *
 * Indices use **removed-card semantics**: a {@link KanbanDropTarget}'s `index` is
 * the insertion position in the destination column's list *with the dragged card
 * taken out* — the natural shape for a consumer who splices the card out of one
 * list and into another. While dragging, the card is lifted out of its column
 * (a floating clone follows the pointer) and a preview is shown at the target, so
 * the cards that remain in flow already exclude it: {@link liftedDropTarget}
 * reads the pointer position straight into removed semantics.
 */

/** A column's ordered card keys — the logical board layout the drag reasons about. */
export type KanbanColumnLayout = { id: string; cardKeys: string[] };

/** A column container measured for pointer hit-testing (web only). */
export type MeasuredColumn = { columnId: string; left: number; right: number };

/** A rendered card measured for pointer hit-testing (web only). */
export type MeasuredCard = {
  bottom: number;
  cardKey: string;
  columnId: string;
  left: number;
  right: number;
  top: number;
};

/** An insertion point: before the `index`-th card of `columnId`, dragged card removed. */
export type KanbanDropTarget = { columnId: string; index: number };

/** A card's origin position in the layout. */
export type KanbanCardOrigin = { columnId: string; index: number };

/** The committed move handed to `onCardMove`. */
export type KanbanCardMove = {
  cardKey: string;
  fromColumnId: string;
  fromIndex: number;
  toColumnId: string;
  toIndex: number;
};

/** Whether a live drag was started by a pointer or the keyboard. */
export type KanbanDragMode = "keyboard" | "pointer";

/**
 * The live drag state the board renders from: the lifted card (`draggedKey`,
 * hidden from its column), the `target` slot where a translucent preview is
 * shown, how the drag was started, and — for a pointer drag — the width of the
 * floating clone that follows the cursor.
 */
export type KanbanDragState = {
  active: boolean;
  draggedKey: string | null;
  ghostWidth: number | null;
  mode: KanbanDragMode | null;
  target: { columnId: string; index: number } | null;
};

/** A keyboard event shape narrow enough for the web and the native no-op alike. */
export type KanbanCardKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/** The per-card wiring the board spreads onto a draggable card. */
export type KanbanCardDragBinding = {
  /** True while this card is the keyboard-grabbed card. */
  grabbed: boolean;
  /** Keyboard grab / move / drop / cancel handler (web); inert on native. */
  onKeyDown: (event: KanbanCardKeyEvent) => void;
  /** Registers the card's node so a keyboard move can restore focus to it. */
  registerRef: (node: unknown) => void;
  /** Stable `data-testid` used for pointer hit-testing and focus restore. */
  testID: string;
};

/** Options passed to the platform drag hook. */
export type KanbanDragOptions = {
  columnTitle: (columnId: string) => string;
  enabled: boolean;
  layout: KanbanColumnLayout[];
  onCardMove?: (move: KanbanCardMove) => void;
};

/** What the platform drag hook returns to the board. */
export type UseKanbanCardDrag = {
  bindBoard: { ref: (node: unknown) => void };
  /** Registers the floating-clone node so a pointer drag can position it. */
  bindGhost: { ref: (node: unknown) => void };
  cardBinding: (cardKey: string) => KanbanCardDragBinding | null;
  consumePressSuppression: () => boolean;
  dragState: KanbanDragState;
};

/** The card-node `data-testid` prefix; the card key is the remainder. */
export const CARD_TESTID_PREFIX = "kanban-card-";
/** The column-container `data-testid` prefix; the column id is the remainder. */
export const COLUMN_TESTID_PREFIX = "kanban-column-";

/** Locate a card in the layout, returning its column and index, or `null`. */
export function findCardOrigin(
  layout: KanbanColumnLayout[],
  cardKey: string,
): KanbanCardOrigin | null {
  for (const column of layout) {
    const index = column.cardKeys.indexOf(cardKey);
    if (index >= 0) {
      return { columnId: column.id, index };
    }
  }
  return null;
}

/** Number of insertion slots in a column once the dragged card is removed. */
function slotCount(
  layout: KanbanColumnLayout[],
  columnId: string,
  draggedKey: string,
): number {
  const column = layout.find((c) => c.id === columnId);
  if (!column) {
    return 0;
  }
  return column.cardKeys.filter((key) => key !== draggedKey).length;
}

/**
 * The column whose horizontal span contains `x`, else the nearest column by edge
 * distance (so dragging through the gaps between columns still targets one).
 */
export function columnIdAtX(
  columns: MeasuredColumn[],
  x: number,
): string | null {
  if (columns.length === 0) {
    return null;
  }
  let best = columns[0];
  let bestDistance = Infinity;
  for (const column of columns) {
    if (x >= column.left && x <= column.right) {
      return column.columnId;
    }
    const distance = x < column.left ? column.left - x : x - column.right;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = column;
    }
  }
  return best.columnId;
}

/**
 * The drop target for a pointer at `(x, y)`, given the cards **currently in
 * flow** — the dragged card is lifted out, so `cards` already excludes it and
 * the count of the target column's cards above `y` is the removed-card index
 * directly (no adjustment for the dragged card's own slot needed).
 */
export function liftedDropTarget(
  columns: MeasuredColumn[],
  cards: MeasuredCard[],
  x: number,
  y: number,
): KanbanDropTarget | null {
  const columnId = columnIdAtX(columns, x);
  if (columnId === null) {
    return null;
  }
  const inColumn = cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.top - b.top);
  let index = inColumn.length;
  for (let i = 0; i < inColumn.length; i += 1) {
    const middle = (inColumn[i].top + inColumn[i].bottom) / 2;
    if (y < middle) {
      index = i;
      break;
    }
  }
  return { columnId, index };
}

/** The starting target when a drag begins: the card's own slot. */
export function initialDropTarget(
  layout: KanbanColumnLayout[],
  draggedKey: string,
): KanbanDropTarget | null {
  const from = findCardOrigin(layout, draggedKey);
  return from ? { columnId: from.columnId, index: from.index } : null;
}

/** Step the target by an arrow key (removed-card semantics), or `null` if unhandled. */
export function keyboardDropTarget(
  layout: KanbanColumnLayout[],
  current: KanbanDropTarget,
  draggedKey: string,
  key: string,
): KanbanDropTarget | null {
  const columnIndex = layout.findIndex((c) => c.id === current.columnId);
  if (columnIndex < 0) {
    return null;
  }
  if (key === "ArrowUp") {
    return { ...current, index: Math.max(0, current.index - 1) };
  }
  if (key === "ArrowDown") {
    const max = slotCount(layout, current.columnId, draggedKey);
    return { ...current, index: Math.min(max, current.index + 1) };
  }
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const nextColumn =
      key === "ArrowLeft" ? layout[columnIndex - 1] : layout[columnIndex + 1];
    if (!nextColumn) {
      return current;
    }
    const max = slotCount(layout, nextColumn.id, draggedKey);
    return { columnId: nextColumn.id, index: Math.min(current.index, max) };
  }
  return null;
}

/** Convert a target to a committed move, or `null` when it lands the card where it started. */
export function targetToMove(
  layout: KanbanColumnLayout[],
  draggedKey: string,
  target: KanbanDropTarget,
): KanbanCardMove | null {
  const from = findCardOrigin(layout, draggedKey);
  if (!from) {
    return null;
  }
  if (target.columnId === from.columnId && target.index === from.index) {
    return null;
  }
  return {
    cardKey: draggedKey,
    fromColumnId: from.columnId,
    fromIndex: from.index,
    toColumnId: target.columnId,
    toIndex: target.index,
  };
}

/**
 * The flow slot at which to render the preview during a **keyboard** drag, where
 * the grabbed card stays in place (dimmed, still focusable). Counting that card,
 * a removed-semantics `target` at or past its origin sits one slot later.
 */
export function indicatorIndex(
  from: KanbanCardOrigin,
  target: KanbanDropTarget,
): number {
  if (target.columnId === from.columnId && target.index >= from.index) {
    return target.index + 1;
  }
  return target.index;
}

/** A spoken description of the target slot, e.g. `Approved, position 2 of 4`. */
export function describeTarget(
  layout: KanbanColumnLayout[],
  draggedKey: string,
  target: KanbanDropTarget,
  columnTitle: (columnId: string) => string,
): string {
  const total = slotCount(layout, target.columnId, draggedKey) + 1;
  return `${columnTitle(target.columnId)}, position ${target.index + 1} of ${total}`;
}
