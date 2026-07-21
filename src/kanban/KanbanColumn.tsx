/**
 * One status column of a {@link Kanban} board: a header (the status chip, the
 * card count, and an optional add button) above a vertical stack of cards.
 *
 * Cards become pressable buttons — with the shared hover, focus ring, pressed,
 * and disabled treatments — when the board has an `onCardPress`, and draggable
 * (pointer + keyboard) when it has an `onCardMove`. During a drag the dragged
 * card is lifted out (pointer: hidden, a clone follows the cursor; keyboard:
 * dimmed in place so it keeps focus) and a translucent preview of it is shown at
 * the target slot. While the board is `loading`, the stack is replaced with
 * skeleton cards.
 */
import { Fragment, type ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import type { BadgeTone } from "../badge/badgeStyles";
import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import type { PressableHoverState } from "../focusRing";
import { SkeletonBar, SkeletonCircle } from "../skeleton";

import { KanbanChip } from "./KanbanChip";
import type { KanbanChipColor } from "./KanbanChip";
import type { KanbanCardDragBinding, KanbanDragState } from "./kanbanDragModel";
import { kanbanAvatarDiameter, type KanbanStyles } from "./kanbanStyles";

/** Title / chip-bar placeholder widths for a skeleton card. */
const SKELETON_TITLE_WIDTHS = ["92%", "68%"] as const;

/**
 * A status column's definition: its grouping id, the header label, and the
 * status color carried by the header chip. Cards are routed into the column
 * whose `id` the board's `cardColumnId(card)` returns.
 */
export type KanbanColumnDef = {
  /** Accessible name for the column group. Defaults to `"<title>, <n> cards"` when `title` is a string. */
  accessibilityLabel?: string;
  /** A literal `{ backgroundColor, color }` for the header chip — a palette-specific status color. Takes precedence over `tone`. */
  color?: KanbanChipColor;
  /** Number shown in the header. Defaults to the count of cards routed into the column. */
  count?: number;
  /** Stable identifier matched against `cardColumnId(card)` to group cards. */
  id: string;
  /** The header status label, shown in the column's chip. */
  title: ReactNode;
  /** The header chip's semantic status color: `neutral` (default), `primary`, `warning`, or `danger`. */
  tone?: BadgeTone;
};

/** One card routed into this column, with its index in the board's flat `cards` array. */
export type KanbanColumnEntry<Card> = { card: Card; index: number };

type KanbanColumnProps<Card> = {
  cardBinding: (cardKey: string) => KanbanCardDragBinding | null;
  cardDisabled?: (card: Card, index: number) => boolean;
  cardKey: (card: Card, index: number) => string;
  cardLabel?: (card: Card, index: number) => string;
  column: KanbanColumnDef;
  columnAddLabel?: (column: KanbanColumnDef) => string;
  columnWidth: number;
  consumePressSuppression: () => boolean;
  count: number;
  disableFocusRing: boolean;
  dragState: KanbanDragState;
  entries: KanbanColumnEntry<Card>[];
  loading: boolean;
  loadingCardCount: number;
  onCardPress?: (card: Card, index: number) => void;
  onColumnAdd?: (column: KanbanColumnDef) => void;
  /** The rendered content of the dragged card, shown in the drop preview. */
  previewNode: ReactNode;
  /** The flow slot in this column where the preview lands, or `-1`. */
  previewIndex: number;
  renderCard: (card: Card, index: number) => ReactNode;
  renderColumnEmpty?: (column: KanbanColumnDef) => ReactNode;
  size: ControlSize;
  styles: KanbanStyles;
};

export function KanbanColumn<Card>({
  cardBinding,
  cardDisabled,
  cardKey,
  cardLabel,
  column,
  columnAddLabel,
  columnWidth,
  consumePressSuppression,
  count,
  disableFocusRing,
  dragState,
  entries,
  loading,
  loadingCardCount,
  onCardPress,
  onColumnAdd,
  previewIndex,
  previewNode,
  renderCard,
  renderColumnEmpty,
  size,
  styles,
}: KanbanColumnProps<Card>) {
  const groupLabel =
    column.accessibilityLabel ??
    (typeof column.title === "string"
      ? `${column.title}, ${count} ${count === 1 ? "card" : "cards"}`
      : undefined);
  // The pointer drag lifts the card into a floating clone (hide it here); the
  // keyboard drag keeps it in place (dimmed) so it can receive the arrow keys.
  const hideDragged = dragState.active && dragState.mode === "pointer";
  const dimDragged = dragState.active && dragState.mode === "keyboard";

  const card = (entry: KanbanColumnEntry<Card>) => {
    const key = cardKey(entry.card, entry.index);
    const disabled = cardDisabled?.(entry.card, entry.index) ?? false;
    const binding = disabled ? null : cardBinding(key);
    const content = renderCard(entry.card, entry.index);
    const grabbed = dimDragged && key === dragState.draggedKey;
    if (!onCardPress && !binding) {
      return (
        <View
          key={key}
          style={[styles.card, grabbed ? styles.cardGrabbed : null]}
        >
          {content}
        </View>
      );
    }
    return (
      <PressableCard
        binding={binding}
        disabled={disabled}
        disableFocusRing={disableFocusRing}
        grabbed={grabbed}
        key={key}
        label={cardLabel?.(entry.card, entry.index)}
        onPress={
          onCardPress
            ? () => {
                if (consumePressSuppression()) {
                  return; // a drag just ended; swallow the click it produced
                }
                onCardPress(entry.card, entry.index);
              }
            : undefined
        }
        styles={styles}
      >
        {content}
      </PressableCard>
    );
  };

  const flow = hideDragged
    ? entries.filter(
        (entry) => cardKey(entry.card, entry.index) !== dragState.draggedKey,
      )
    : entries;
  const preview = <CardPreview node={previewNode} styles={styles} />;

  return (
    <View
      accessibilityLabel={groupLabel}
      role={groupLabel ? "group" : undefined}
      style={[styles.column, { width: columnWidth }]}
      testID={`kanban-column-${column.id}`}
    >
      <View style={styles.header}>
        <KanbanChip color={column.color} tone={column.tone}>
          {column.title}
        </KanbanChip>
        <Text
          // The count is already folded into the column group's accessible name
          // ("Drafted, 2 cards"), so the bare number is hidden from assistive
          // tech to avoid a duplicate, context-free announcement.
          aria-hidden
          importantForAccessibility="no"
          style={styles.count}
        >
          {count}
        </Text>
        {onColumnAdd ? (
          <ColumnAddButton
            disableFocusRing={disableFocusRing}
            label={columnAddLabel?.(column) ?? "Add card"}
            onPress={() => onColumnAdd(column)}
            styles={styles}
          />
        ) : null}
      </View>
      {loading ? (
        Array.from({ length: loadingCardCount }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} size={size} styles={styles} />
        ))
      ) : flow.length === 0 && previewIndex < 0 ? (
        (renderColumnEmpty?.(column) ?? null)
      ) : (
        <>
          {flow.map((entry, position) => (
            <Fragment key={cardKey(entry.card, entry.index)}>
              {position === previewIndex ? preview : null}
              {card(entry)}
            </Fragment>
          ))}
          {previewIndex === flow.length ? preview : null}
        </>
      )}
    </View>
  );
}

/**
 * A pressable / draggable card. Mirrors the shared button / table row / list
 * item: `button` semantics, a stronger-border hover, the inset sage focus ring,
 * a pressed and disabled state, and the hidden web outline. When the board is
 * draggable the card also carries the drag `binding` — a `data-testid` for
 * pointer hit-testing, the keyboard grab/move handler, a node ref for focus
 * restore, and a focusable tab stop — and dims (`grabbed`) while it is the
 * keyboard-grabbed card.
 */
function PressableCard({
  binding,
  children,
  disabled,
  disableFocusRing,
  grabbed,
  label,
  onPress,
  styles,
}: {
  binding: KanbanCardDragBinding | null;
  children: ReactNode;
  disabled: boolean;
  disableFocusRing: boolean;
  grabbed: boolean;
  label?: string;
  onPress?: () => void;
  styles: KanbanStyles;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
  // `onKeyDown` and `tabIndex` are web-only; gate them like the segmented control.
  const dragProps =
    binding && Platform.OS === "web"
      ? { onKeyDown: binding.onKeyDown, tabIndex: 0 as const }
      : {};
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      ref={binding ? binding.registerRef : undefined}
      testID={binding?.testID}
      {...dragProps}
      style={({ hovered, pressed }: PressableHoverState) => [
        styles.card,
        styles.cardPressable,
        hovered && !disabled ? styles.cardHover : null,
        pressed && !disabled ? styles.cardPressed : null,
        focus.focused && focus.ringEnabled ? styles.cardFocused : null,
        disabled ? styles.cardDisabled : null,
        grabbed ? styles.cardGrabbed : null,
        focus.webOutlineReset,
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * The translucent, dashed copy of the dragged card shown at the drop slot. It is
 * decorative — the live region speaks the target — so it stays off the
 * accessibility tree.
 */
function CardPreview({
  node,
  styles,
}: {
  node: ReactNode;
  styles: KanbanStyles;
}) {
  return (
    <View
      aria-hidden
      style={[styles.card, styles.cardPreview]}
      testID="kanban-drop-preview"
    >
      {node}
    </View>
  );
}

/**
 * The column header's add affordance — a `button`-role plus glyph named by
 * `columnAddLabel`. The glyph itself is decorative (the button carries the
 * name); the button gains a soft fill on hover and the sage focus ring on focus.
 */
function ColumnAddButton({
  disableFocusRing,
  label,
  onPress,
  styles,
}: {
  disableFocusRing: boolean;
  label: string;
  onPress: () => void;
  styles: KanbanStyles;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ hovered }: PressableHoverState) => [
        styles.addButton,
        styles.addButtonPressable,
        hovered ? styles.addButtonHover : null,
        focus.focused ? focus.focusRingStyle : null,
        focus.webOutlineReset,
      ]}
    >
      <Text aria-hidden importantForAccessibility="no" style={styles.addGlyph}>
        +
      </Text>
    </Pressable>
  );
}

/**
 * A placeholder card shown while the board is `loading`. It is decorative — the
 * busy board announces the loading state — so it stays off the accessibility
 * tree, and its bars share the board's single {@link SkeletonPulseProvider}
 * pulse for a unified sweep.
 */
function SkeletonCard({
  size,
  styles,
}: {
  size: ControlSize;
  styles: KanbanStyles;
}) {
  return (
    <View aria-hidden style={styles.card}>
      <View style={styles.cardInner}>
        {SKELETON_TITLE_WIDTHS.map((width) => (
          <SkeletonBar height={12} key={width} width={width} />
        ))}
        <View style={styles.chipsRow}>
          <SkeletonBar height={18} radius="sm" width={70} />
          <SkeletonBar height={18} radius="sm" width={52} />
        </View>
        <View style={styles.footer}>
          <SkeletonCircle diameter={kanbanAvatarDiameter(size)} />
          <SkeletonBar height={10} width={42} />
          <View style={styles.footerSpacer} />
          <SkeletonBar height={10} width={34} />
        </View>
      </View>
    </View>
  );
}
