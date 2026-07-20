/**
 * The draggable resize affordance on a header cell's right edge (web only).
 *
 * It is an accessible vertical `separator` (a window-splitter): focusable, with
 * a visible focus ring, Left/Right arrow keys nudging the width, and (when the
 * column is bounded) `aria-valuenow`/`min`/`max` reflecting the live width.
 * Being a `Pressable`, its `PressResponder` stops the pointer-down from bubbling
 * to the header's column-select drag, so grabbing the edge resizes instead of
 * selecting the column.
 */
import { Pressable, View, type ViewStyle } from "react-native";

import {
  hideWebOutlineView,
  useFocusRing,
  type PressableHoverState,
} from "../focusRing";

import { DEFAULT_MIN_WIDTH } from "./dataGridColumnWidths";
import type { ResolvedColumn } from "./dataGridColumnWidths";
import type { DataGridStyles } from "./dataGridStyles";

// `col-resize` isn't in RN's `cursor` union; forward it as a web-only literal
// (the same escape hatch `stickyGutterStyle` uses for `position: sticky`).
const colResizeCursor = { cursor: "col-resize" } as unknown as ViewStyle;

export type DataGridResizeHandleProps = {
  column: ResolvedColumn;
  styles: DataGridStyles;
  /** Whether this column is the one being pointer-dragged (keeps the line lit). */
  active: boolean;
  onBeginResize: (columnId: string, startWidth: number, event: unknown) => void;
  onResizeStep: (
    columnId: string,
    direction: 1 | -1,
    currentWidth: number,
  ) => void;
};

export function DataGridResizeHandle({
  column,
  styles,
  active,
  onBeginResize,
  onResizeStep,
}: DataGridResizeHandleProps) {
  // Inset glow — the handle sits inside the grid's `overflow: hidden` clip, which
  // would crop an outset ring.
  const focus = useFocusRing({ offset: -2 });

  // RN's prop types omit the separator range attributes, so they (and the web
  // pointer/key handlers) are forwarded as literal DOM props via a cast spread.
  // A focusable `separator` requires `aria-valuenow`; `aria-valuemax` is only
  // emitted when the column is actually bounded (the flex resolver clamps to
  // maxWidth, so a bounded column's valuenow never exceeds its valuemax).
  const webProps = {
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": `Resize ${column.label}`,
    "aria-valuenow": Math.round(column.width),
    "aria-valuemin": column.minWidth ?? DEFAULT_MIN_WIDTH,
    ...(column.maxWidth !== undefined
      ? { "aria-valuemax": column.maxWidth }
      : {}),
    tabIndex: 0,
    onPointerDown: (event: unknown) => {
      // Stop the header from starting a whole-column selection drag.
      (event as { stopPropagation?: () => void }).stopPropagation?.();
      onBeginResize(column.id, column.width, event);
    },
    onKeyDown: (event: unknown) => {
      const key = (event as { key?: string }).key;
      if (key !== "ArrowRight" && key !== "ArrowLeft") {
        return;
      }
      // Don't let the arrow reach the grid (cell nav) or scroll the container.
      (event as { preventDefault?: () => void }).preventDefault?.();
      (event as { stopPropagation?: () => void }).stopPropagation?.();
      onResizeStep(column.id, key === "ArrowRight" ? 1 : -1, column.width);
    },
  } as Record<string, unknown>;

  return (
    <Pressable
      {...webProps}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      style={[
        styles.resizeHandle,
        colResizeCursor,
        hideWebOutlineView,
        focus.focused ? focus.focusRingStyle : null,
      ]}
    >
      {({ hovered }: PressableHoverState) => (
        <View
          style={[
            styles.resizeHandleLine,
            hovered || active || focus.focused
              ? styles.resizeHandleLineActive
              : null,
          ]}
        />
      )}
    </Pressable>
  );
}
