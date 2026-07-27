/**
 * Horizontally-scrolling status board — the same records a {@link Table} shows
 * as rows, grouped by a single-select field into columns. A flat `cards` array
 * is routed into columns by a `cardColumnId` accessor (the Table `rows` / List
 * `items` pattern), so cards can be filtered, sorted, or moved between statuses
 * without restructuring the column definitions.
 *
 * Each column renders a header (its status chip, the card count, an optional
 * consumer-rendered accessory, and an optional add button) above a vertical
 * stack of cards. Supply `onCardPress` to make the cards pressable buttons —
 * with the shared hover, sage focus ring, pressed, and disabled treatments and
 * keyboard activation — or omit it for static cards.
 * Supply `onCardMove` to make the cards draggable between and within columns by
 * pointer and keyboard; the board stays controlled, reporting each move for the
 * consumer to apply to its own `cards` data (the drag never mutates them).
 */
import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { SkeletonPulseProvider } from "../skeleton";
import { useSharedUiTheme } from "../theme";

import { KanbanColumn } from "./KanbanColumn";
import type { KanbanColumnDef, KanbanColumnEntry } from "./KanbanColumn";
import { KanbanDragGhostPortal } from "./KanbanDragGhostPortal";
import { indicatorIndex } from "./kanbanDragModel";
import type { KanbanCardMove, KanbanColumnLayout } from "./kanbanDragModel";
import { createKanbanStyles } from "./kanbanStyles";
import { useKanbanCardDrag } from "./useKanbanCardDrag";

export type { KanbanColumnDef } from "./KanbanColumn";
export type { KanbanCardMove } from "./kanbanDragModel";

// `position: fixed` is not in React Native's style union, but RNW honours it for
// the floating clone so it tracks the cursor across the whole viewport.
const GHOST_FIXED = { position: "fixed" } as unknown as ViewStyle;

export type KanbanProps<Card> = {
  /** Accessible label for the whole board region. */
  accessibilityLabel?: string;
  /** Mark a specific card as non-pressable (only relevant with `onCardPress`). */
  cardDisabled?: (card: Card, index: number) => boolean;
  /** Stable React key for a card. */
  cardKey: (card: Card, index: number) => string;
  /** Accessible label for a pressable card, e.g. `Open "Ship the board"`. */
  cardLabel?: (card: Card, index: number) => string;
  /** Routes a card into the column whose `id` this returns. Cards with no matching column are omitted. */
  cardColumnId: (card: Card, index: number) => string;
  /** The data cards, as one flat array across every column. */
  cards: Card[];
  /** Accessible label for a column's add button, e.g. `Add card to Drafted`. */
  columnAddLabel?: (column: KanbanColumnDef) => string;
  /** Fixed width of every column in px. Defaults to 286 (the mockup geometry). */
  columnWidth?: number;
  /** The status columns, rendered left to right. */
  columns: KanbanColumnDef[];
  /**
   * Disable the shared focus glow on cards and the column add buttons. They then
   * fall back to the browser's default focus outline so keyboard focus stays
   * visible (WCAG 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via
   * the theme's `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /**
   * Show placeholder skeleton cards instead of the cards while data loads. The
   * board announces `aria-busy`, and the placeholder cards are non-interactive
   * and hidden from assistive technology.
   */
  loading?: boolean;
  /** Number of skeleton cards rendered per column while `loading`. Defaults to 3. */
  loadingCardCount?: number;
  /**
   * Called when a card is dragged — by pointer or keyboard — to a new column or
   * position. Providing it makes every card draggable. The board is controlled:
   * apply the returned `move` to your own `cards` data (synchronously, so the
   * post-drag click is suppressed and keyboard focus is restored) and the board
   * re-renders from the new props; the drag never mutates the cards itself.
   * `toIndex` is the insertion index in the destination column **with the moved
   * card removed** — e.g. `toIndex: 1` into a column of `[A, B, C]` lands the
   * card as `[A, moved, B, C]`. See the "Drag and drop" story's `applyMove` for a
   * reference implementation.
   */
  onCardMove?: (move: KanbanCardMove) => void;
  /** Press handler per card. Providing it makes every card a pressable button. */
  onCardPress?: (card: Card, index: number) => void;
  /** Press handler for a column's add button. Providing it shows the button in every column header. */
  onColumnAdd?: (column: KanbanColumnDef) => void;
  /** Renders the content of a card — typically a {@link KanbanCard}, but any node works. */
  renderCard: (card: Card, index: number) => ReactNode;
  /**
   * Renders an accessory into a column's header, between the count and the add
   * button. Return `null` for columns that carry no accessory — their header is
   * then identical to one on a board that never passes this prop.
   *
   * The slot is layout-only: it takes no drag, press, keyboard, or focus
   * treatment from the board, and adds no role or label, so an interactive
   * accessory brings all of its own (a self-contained control such as a
   * `switch`-role toggle with a checked state and its own focus indicator). It
   * renders in every state the add button does, including `loading`.
   *
   * The accessory is end-aligned with the add button and never shrinks — the
   * title chip truncates first at a narrow `columnWidth` — and it is clipped to
   * the status chip's 20px box (the same at every `size`) so it can never change
   * the header's height. Size an accessory to 20px or less, and prefer an inset
   * focus indicator: the slot clips, so an outset ring is cropped, exactly as it
   * is on the cards.
   */
  renderColumnAccessory?: (column: KanbanColumnDef) => ReactNode;
  /** Renders placeholder content for a column with no cards (e.g. an empty-state message). */
  renderColumnEmpty?: (column: KanbanColumnDef) => ReactNode;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the board container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * The shared Kanban board. Groups `cards` into `columns` by `cardColumnId`,
 * renders each card through `renderCard`, and scrolls the columns horizontally.
 * Pass `onCardPress` for pressable cards, `onColumnAdd` for a per-column add
 * button, `renderColumnAccessory` for a consumer-owned control in a column
 * header, `renderColumnEmpty` for an empty-column placeholder, and `loading` for
 * the busy skeleton state. Sizes on the shared {@link ControlSize} scale.
 */
export function Kanban<Card>({
  accessibilityLabel,
  cardColumnId,
  cardDisabled,
  cardKey,
  cardLabel,
  cards,
  columnAddLabel,
  columnWidth = 286,
  columns,
  disableFocusRing = false,
  loading = false,
  loadingCardCount = 3,
  onCardMove,
  onCardPress,
  onColumnAdd,
  renderCard,
  renderColumnAccessory,
  renderColumnEmpty,
  size = "md",
  style,
  testID,
}: KanbanProps<Card>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createKanbanStyles(theme, size), [theme, size]);

  // Route each card into its column once, preserving the flat-array order within
  // a column. A card whose `cardColumnId` matches no column is silently dropped.
  const entriesByColumn = useMemo(() => {
    const map = new Map<string, KanbanColumnEntry<Card>[]>();
    for (const column of columns) {
      map.set(column.id, []);
    }
    cards.forEach((card, index) => {
      map.get(cardColumnId(card, index))?.push({ card, index });
    });
    return map;
  }, [cards, cardColumnId, columns]);

  // The logical board the drag reasons about: each column's ordered card keys.
  const layout = useMemo<KanbanColumnLayout[]>(
    () =>
      columns.map((column) => ({
        cardKeys: (entriesByColumn.get(column.id) ?? []).map((entry) =>
          cardKey(entry.card, entry.index),
        ),
        id: column.id,
      })),
    [cardKey, columns, entriesByColumn],
  );
  const columnTitle = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      return column && typeof column.title === "string"
        ? column.title
        : columnId;
    },
    [columns],
  );
  const drag = useKanbanCardDrag({
    columnTitle,
    enabled: Boolean(onCardMove),
    layout,
    onCardMove,
  });

  // Locate the dragged card so the board can render its preview + floating clone,
  // and place the preview at the right flow slot per drag mode: the pointer lifts
  // the card out (removed-card index), the keyboard leaves it in place (visual
  // index, counting the dimmed card).
  const { active, draggedKey, ghostWidth, mode, target } = drag.dragState;
  let draggedEntry: KanbanColumnEntry<Card> | null = null;
  let draggedFrom: { columnId: string; index: number } | null = null;
  if (active && draggedKey) {
    for (const column of columns) {
      const list = entriesByColumn.get(column.id) ?? [];
      const at = list.findIndex(
        (entry) => cardKey(entry.card, entry.index) === draggedKey,
      );
      if (at >= 0) {
        draggedEntry = list[at];
        draggedFrom = { columnId: column.id, index: at };
        break;
      }
    }
  }
  const previewNode = draggedEntry
    ? renderCard(draggedEntry.card, draggedEntry.index)
    : null;
  const previewIndexFor = (columnId: string): number => {
    if (!active || !target || !draggedFrom || target.columnId !== columnId) {
      return -1;
    }
    return mode === "keyboard"
      ? indicatorIndex(draggedFrom, target)
      : target.index;
  };

  const board = columns.map((column) => {
    const entries = entriesByColumn.get(column.id) ?? [];
    return (
      <KanbanColumn<Card>
        cardBinding={drag.cardBinding}
        cardDisabled={cardDisabled}
        cardKey={cardKey}
        cardLabel={cardLabel}
        column={column}
        columnAddLabel={columnAddLabel}
        columnWidth={columnWidth}
        consumePressSuppression={drag.consumePressSuppression}
        count={column.count ?? entries.length}
        disableFocusRing={disableFocusRing}
        dragState={drag.dragState}
        entries={entries}
        key={column.id}
        loading={loading}
        loadingCardCount={loadingCardCount}
        onCardPress={onCardPress}
        onColumnAdd={onColumnAdd}
        previewIndex={previewIndexFor(column.id)}
        previewNode={previewNode}
        renderCard={renderCard}
        renderColumnAccessory={renderColumnAccessory}
        renderColumnEmpty={renderColumnEmpty}
        size={size}
        styles={styles}
      />
    );
  });

  return (
    <View
      // A labelled `group` names the board region for assistive tech while the
      // columns and cards stay individually navigable; the role keeps the label
      // valid (a bare labelled container trips RNW's aria-prohibited-attr).
      accessibilityLabel={accessibilityLabel}
      // Mirror the Table: announce the board busy while loading (web aria-busy +
      // the native accessibilityState) so AT says "loading" instead of reading
      // the placeholder cards.
      accessibilityState={loading ? { busy: true } : undefined}
      aria-busy={loading || undefined}
      // The drag hit-tests cards within this container (web); on native the
      // binder is inert.
      ref={drag.bindBoard.ref}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.board, style]}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.boardRow}
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === "web"}
      >
        {loading ? (
          <SkeletonPulseProvider>{board}</SkeletonPulseProvider>
        ) : (
          board
        )}
      </ScrollView>
      {active && mode === "pointer" && previewNode ? (
        // The clone rides the viewport cursor, so web portals it to `body` to
        // escape transformed ancestors that redefine fixed positioning.
        <KanbanDragGhostPortal>
          <View
            aria-hidden
            pointerEvents="none"
            ref={drag.bindGhost.ref}
            style={[
              styles.card,
              styles.cardGhost,
              GHOST_FIXED,
              ghostWidth != null ? { width: ghostWidth } : null,
            ]}
            testID="kanban-drag-ghost"
          >
            {previewNode}
          </View>
        </KanbanDragGhostPortal>
      ) : null}
    </View>
  );
}
