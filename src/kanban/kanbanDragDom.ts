/**
 * DOM measuring for the web Kanban drag (`useKanbanCardDrag.web.ts`). Cards and
 * column containers carry their key / id in a `data-testid`, so a drag can find
 * the start card and the live drop target by hit-testing their rects. Only the
 * web hook imports this; on native the drag hook is an inert no-op, so this code
 * never runs there.
 */
import {
  CARD_TESTID_PREFIX,
  COLUMN_TESTID_PREFIX,
  type MeasuredCard,
  type MeasuredColumn,
} from "./kanbanDragModel";

/** The minimal DOM surface of the board container we touch. */
export type BoardNode = {
  contains?: (other: unknown) => boolean;
  querySelectorAll?: (selector: string) => ArrayLike<ElementNode>;
} | null;

/** The minimal DOM surface of a measured card / column node. */
type ElementNode = {
  getAttribute: (name: string) => string | null;
  getBoundingClientRect: () => DOMRect;
};

function queryAll(board: BoardNode, prefix: string): ElementNode[] {
  const nodes = board?.querySelectorAll?.(`[data-testid^="${prefix}"]`);
  const out: ElementNode[] = [];
  for (let i = 0; nodes && i < nodes.length; i += 1) {
    out.push(nodes[i]);
  }
  return out;
}

/** Measure every column container's horizontal span, keyed by column id. */
export function measureColumns(board: BoardNode): MeasuredColumn[] {
  return queryAll(board, COLUMN_TESTID_PREFIX).map((node) => {
    const rect = node.getBoundingClientRect();
    return {
      columnId: (node.getAttribute("data-testid") ?? "").slice(
        COLUMN_TESTID_PREFIX.length,
      ),
      left: rect.left,
      right: rect.right,
    };
  });
}

/** Measure every card's vertical span, resolving its column via `columnOf`. */
export function measureCards(
  board: BoardNode,
  columnOf: (cardKey: string) => string | null,
): MeasuredCard[] {
  const out: MeasuredCard[] = [];
  for (const node of queryAll(board, CARD_TESTID_PREFIX)) {
    const cardKey = (node.getAttribute("data-testid") ?? "").slice(
      CARD_TESTID_PREFIX.length,
    );
    const columnId = columnOf(cardKey);
    if (columnId === null) {
      continue;
    }
    const rect = node.getBoundingClientRect();
    out.push({
      bottom: rect.bottom,
      cardKey,
      columnId,
      left: rect.left,
      right: rect.right,
      top: rect.top,
    });
  }
  return out;
}

/** The key of the card whose rect contains `(x, y)` — the x guards against cards at the same height in other columns. */
export function cardKeyAt(
  cards: MeasuredCard[],
  x: number,
  y: number,
): string | null {
  for (const card of cards) {
    if (
      x >= card.left &&
      x <= card.right &&
      y >= card.top &&
      y <= card.bottom
    ) {
      return card.cardKey;
    }
  }
  return null;
}
