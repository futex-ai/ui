/**
 * One row of a {@link SortableList}, plus the grab handle and the drop preview.
 * A row is a `listitem`; how it becomes draggable depends on the mode:
 *
 * - **Handle mode** — a focusable grab {@link SortableHandle} sits at the start
 *   or end of the row and is the ONLY drag / keyboard / focus target, so the rest
 *   of the row (a consumer's own buttons) stays independently interactive.
 * - **Handle-less mode** — the whole row is one focusable `button` drag target
 *   (best for simple rows with no interactive content of their own).
 * - **Disabled / non-draggable** — a plain `listitem` that is still measured (so
 *   the drop math counts its slot) but is never a drag start or keyboard target.
 *
 * These are internal to the list and are not part of the public export surface.
 */
import type { ReactNode } from "react";
import { GripHorizontal, GripVertical } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";

import { hideWebOutlineView, useFocusRing } from "../focusRing";
import type { PressableHoverState } from "../focusRing";

import type {
  SortableHandleSide,
  SortableOrientation,
} from "./sortableListModel";
import {
  grabbingCursor,
  grabCursor,
  type SortableListStyles,
} from "./sortableListStyles";
import type { SortableItemBinding } from "./sortableListTypes";

/** State passed to a custom `renderHandle` so it can react to the active grab. */
export type SortableHandleState = { grabbed: boolean };

type SortableRowProps = {
  binding: SortableItemBinding | null;
  content: ReactNode;
  /** Dim the row in place — the keyboard-grabbed row stays put, still focusable. */
  dragging: boolean;
  handle?: SortableHandleSide;
  handleGap: number;
  handleLabel: string;
  iconColor: string;
  iconSize: number;
  itemLabel: string;
  itemTestID: string;
  orientation: SortableOrientation;
  renderHandle?: (state: SortableHandleState) => ReactNode;
  styles: SortableListStyles;
};

export function SortableRow({
  binding,
  content,
  dragging,
  handle,
  handleGap,
  handleLabel,
  iconColor,
  iconSize,
  itemLabel,
  itemTestID,
  orientation,
  renderHandle,
  styles,
}: SortableRowProps) {
  if (handle) {
    const grip = (
      <SortableHandle
        binding={binding}
        dragging={dragging}
        iconColor={iconColor}
        iconSize={iconSize}
        label={handleLabel}
        orientation={orientation}
        renderHandle={renderHandle}
        styles={styles}
      />
    );
    return (
      <View
        role="listitem"
        style={[
          styles.row,
          dragging ? styles.dragging : null,
          { gap: handleGap },
        ]}
        testID={itemTestID}
      >
        {handle === "start" ? grip : null}
        <View style={styles.content}>{content}</View>
        {handle === "end" ? grip : null}
      </View>
    );
  }

  if (!binding) {
    return (
      <View
        role="listitem"
        style={dragging ? styles.dragging : null}
        testID={itemTestID}
      >
        {content}
      </View>
    );
  }

  return (
    <View role="listitem">
      <SortableRowButton
        binding={binding}
        dragging={dragging}
        label={itemLabel}
        styles={styles}
        testID={itemTestID}
      >
        {content}
      </SortableRowButton>
    </View>
  );
}

/**
 * The whole-row `button` drag target used in handle-less mode. Mirrors the List
 * item / kanban card pressable: `button` semantics, the sage focus ring with the
 * hidden web outline, and a grab / grabbing cursor. Keyboard grab / move comes
 * from the drag hook's `onKeyDown` (web-only, gated by `Platform.OS`).
 */
function SortableRowButton({
  binding,
  children,
  dragging,
  label,
  styles,
  testID,
}: {
  binding: SortableItemBinding;
  children: ReactNode;
  dragging: boolean;
  label: string;
  styles: SortableListStyles;
  testID: string;
}) {
  const focus = useFocusRing();
  const dragProps =
    Platform.OS === "web"
      ? { onKeyDown: binding.onKeyDown, tabIndex: 0 as const }
      : {};
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      ref={binding.registerRef}
      testID={testID}
      {...dragProps}
      style={[
        styles.itemButton,
        grabCursor,
        dragging ? grabbingCursor : null,
        dragging ? styles.dragging : null,
        focus.focused ? focus.focusRingStyle : null,
        hideWebOutlineView,
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * The grab handle: a focusable `button` carrying the drag `binding` (its
 * `data-testid` for pointer hit-testing, the keyboard handler, and a focus-restore
 * ref). It shows a themed grip glyph (or a custom `renderHandle`) and a grab
 * cursor. When the row is disabled the handle renders as a static, dimmed,
 * non-interactive affordance so the layout stays consistent.
 */
function SortableHandle({
  binding,
  dragging,
  iconColor,
  iconSize,
  label,
  orientation,
  renderHandle,
  styles,
}: {
  binding: SortableItemBinding | null;
  dragging: boolean;
  iconColor: string;
  iconSize: number;
  label: string;
  orientation: SortableOrientation;
  renderHandle?: (state: SortableHandleState) => ReactNode;
  styles: SortableListStyles;
}) {
  const focus = useFocusRing();
  const Grip = orientation === "horizontal" ? GripHorizontal : GripVertical;
  const glyph = renderHandle ? (
    renderHandle({ grabbed: dragging })
  ) : (
    <Grip color={iconColor} size={iconSize} />
  );

  if (!binding) {
    return (
      <View aria-hidden style={[styles.handle, styles.handleDisabled]}>
        {glyph}
      </View>
    );
  }

  const dragProps =
    Platform.OS === "web"
      ? { onKeyDown: binding.onKeyDown, tabIndex: 0 as const }
      : {};
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      ref={binding.registerRef}
      testID={binding.handleTestID}
      {...dragProps}
      style={({ hovered }: PressableHoverState) => [
        styles.handle,
        grabCursor,
        dragging ? grabbingCursor : null,
        hovered ? styles.handleHover : null,
        focus.focused ? focus.focusRingStyle : null,
        hideWebOutlineView,
      ]}
    >
      {glyph}
    </Pressable>
  );
}

/**
 * The dashed, faded copy of the dragged row shown at the drop slot. It is
 * decorative — the live region speaks the target — so it stays off the
 * accessibility tree.
 */
export function SortablePreview({
  node,
  styles,
}: {
  node: ReactNode;
  styles: SortableListStyles;
}) {
  return (
    <View aria-hidden style={styles.preview} testID="sortable-drop-preview">
      {node}
    </View>
  );
}
