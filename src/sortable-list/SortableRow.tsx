/**
 * One row of a {@link SortableList}, plus the grab handle and the drop preview.
 * A row is a `listitem`; how it becomes draggable depends on the mode:
 *
 * - **Handle mode (`"start"` / `"end"`)** — a focusable grab {@link SortableHandle}
 *   sits at the start or end of the row (in the gutter, beside the content) and is
 *   the ONLY drag / keyboard / focus target, so the rest of the row (a consumer's
 *   own buttons) stays independently interactive.
 * - **Custom-handle mode (`"custom"`)** — the wired handle is handed to the list's
 *   `renderItem` so the consumer places it themselves — e.g. INSIDE their card.
 *   The row is a plain `listitem`; the grip inside the content is the drag target.
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
import type { StyleProp, ViewStyle } from "react-native";

import { useFocusRing } from "../focusRing";
import type { PressableHoverState } from "../focusRing";

import type {
  SortableHandlePlacement,
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
  disableFocusRing: boolean;
  /** Dim the row in place — the keyboard-grabbed row stays put, still focusable. */
  dragging: boolean;
  handle?: SortableHandlePlacement;
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
  disableFocusRing,
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
  if (handle === "start" || handle === "end") {
    const grip = (
      <SortableHandle
        binding={binding}
        disableFocusRing={disableFocusRing}
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

  // Custom-handle mode (the grip is inside `content`, placed by the consumer)
  // and disabled / non-draggable rows both render a plain, measured listitem.
  if (handle === "custom" || !binding) {
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
        disableFocusRing={disableFocusRing}
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
  disableFocusRing,
  dragging,
  label,
  styles,
  testID,
}: {
  binding: SortableItemBinding;
  children: ReactNode;
  disableFocusRing: boolean;
  dragging: boolean;
  label: string;
  styles: SortableListStyles;
  testID: string;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
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
        focus.focusVisible ? focus.focusRingStyle : null,
        focus.webOutlineReset,
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
export function SortableHandle({
  binding,
  disableFocusRing,
  dragging,
  iconColor,
  iconSize,
  label,
  orientation,
  renderHandle,
  styles,
}: {
  binding: SortableItemBinding | null;
  disableFocusRing: boolean;
  dragging: boolean;
  iconColor: string;
  iconSize: number;
  label: string;
  orientation: SortableOrientation;
  renderHandle?: (state: SortableHandleState) => ReactNode;
  styles: SortableListStyles;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
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
        focus.focusVisible ? focus.focusRingStyle : null,
        focus.webOutlineReset,
      ]}
    >
      {glyph}
    </Pressable>
  );
}

/**
 * A decorative, non-interactive clone of the dragged row — reused as the dashed
 * drop preview shown at the target slot and as the floating clone that rides the
 * cursor. It mirrors the row's shape (a static grip placeholder in handle mode,
 * so its footprint matches a real row) and is marked `aria-hidden`, inert (web),
 * and click-through. The inert marking matters: in handle mode a row's own
 * `renderItem` controls (a consumer button) would otherwise be rendered as a
 * FOCUSABLE copy inside an `aria-hidden` subtree — a WCAG 4.1.2 violation and a
 * Tab trap mid-reorder. The live region speaks the target instead.
 */
export function SortableClone({
  content,
  extraStyle,
  forwardedRef,
  handle,
  handleGap,
  iconColor,
  iconSize,
  orientation,
  renderHandle,
  styles,
  testID,
}: {
  content: ReactNode;
  extraStyle?: StyleProp<ViewStyle>;
  forwardedRef?: (node: unknown) => void;
  handle?: SortableHandlePlacement;
  handleGap: number;
  iconColor: string;
  iconSize: number;
  orientation: SortableOrientation;
  renderHandle?: (state: SortableHandleState) => ReactNode;
  styles: SortableListStyles;
  testID?: string;
}) {
  const Grip = orientation === "horizontal" ? GripHorizontal : GripVertical;
  // Only the gutter modes add a placeholder grip; in custom mode the grip is
  // already inside `content` (a non-interactive copy), so none is added here.
  const gutter = handle === "start" || handle === "end";
  const grip = gutter ? (
    <View style={[styles.handle, styles.handleDisabled]}>
      {renderHandle ? (
        renderHandle({ grabbed: false })
      ) : (
        <Grip color={iconColor} size={iconSize} />
      )}
    </View>
  ) : null;
  return (
    <View
      aria-hidden
      pointerEvents="none"
      ref={(node) => {
        markInert(node);
        forwardedRef?.(node);
      }}
      style={[styles.row, { gap: gutter ? handleGap : 0 }, extraStyle]}
      testID={testID}
    >
      {handle === "start" ? grip : null}
      <View style={styles.content}>{content}</View>
      {handle === "end" ? grip : null}
    </View>
  );
}

/**
 * Mark a decorative clone's host node `inert` on web, so no focusable descendant
 * (a consumer's own control rendered into the row) is reachable via Tab or counts
 * as a focusable node inside the `aria-hidden` subtree. A no-op on native, where
 * the node is an RN view instance with no `setAttribute`.
 */
function markInert(node: unknown) {
  const el = node as { inert?: boolean; setAttribute?: unknown } | null;
  if (el && typeof el.setAttribute === "function") {
    el.inert = true;
  }
}
