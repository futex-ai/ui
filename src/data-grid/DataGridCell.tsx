/** A single grid cell: read-only content or an open editor, with selection a11y. */
import { type ReactNode, useCallback, useRef } from "react";
import { Platform, Pressable } from "react-native";

import { hideWebOutlineView } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { DataGridCellContent } from "./dataGridCellContent";
import type { DataGridStyles } from "./dataGridStyles";
import { columnLayoutStyle, resolveColumnAlign } from "./dataGridLayout";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridCellValue,
} from "./types";

export type DataGridCellProps = {
  column: DataGridColumn;
  value: DataGridCellValue;
  cellRef: DataGridCellRef;
  selected: boolean;
  active: boolean;
  /** Whether this cell is the grid's roving Tab stop (only one cell at a time). */
  tabStop: boolean;
  fontSize: number;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  onActivate: (ref: DataGridCellRef, options?: { extend?: boolean }) => void;
  onBeginDrag: (ref: DataGridCellRef, event: unknown) => void;
  onBeginEdit: (ref: DataGridCellRef) => void;
  onKeyDown: (event: unknown) => void;
  registerNode: (
    ref: DataGridCellRef,
    node: { focus?: () => void } | null,
  ) => void;
  /** Editor element shown in place of the content while this cell edits. */
  editor?: ReactNode;
};

/**
 * One cell. A `gridcell` with `aria-selected`, a roving tabindex (only the active
 * cell is tabbable), and the active-cell ring. Pressing selects the cell; the
 * cell forwards key events to the controller for arrow-key navigation and edit
 * entry. While editing it renders the supplied `editor` instead of the content.
 */
export function DataGridCell({
  column,
  value,
  cellRef,
  selected,
  active,
  tabStop,
  fontSize,
  styles,
  theme,
  onActivate,
  onBeginDrag,
  onBeginEdit,
  onKeyDown,
  registerNode,
  editor,
}: DataGridCellProps) {
  const align = resolveColumnAlign(column);
  // Manual double-press detection: RNW doesn't forward `onDoubleClick`, so a
  // second primary press on the same cell within 350ms opens the editor.
  const lastDownRef = useRef(0);
  // Select cells behave like a normal dropdown: a single press on the
  // already-active cell opens the menu (no double-click needed). Typeable
  // fields keep the double-press convention so a plain click just selects.
  const isSelectField =
    column.fieldType === "singleSelect" || column.fieldType === "multiSelect";
  const setRef = useCallback(
    (node: unknown) => {
      registerNode(cellRef, node as { focus?: () => void } | null);
    },
    [cellRef, registerNode],
  );

  if (editor) {
    // The editing cell wears the same square inset primary ring as a selected /
    // active cell (`cellActive`), so opening an editor reads as the selected cell
    // gaining a live input rather than a foreign rounded box. The editor itself
    // is chrome-less (see dataGridCellEditors), so this ring is the sole focus
    // affordance and the input's text stays aligned with the read-only content.
    return (
      <Pressable
        style={[
          styles.cell,
          styles.cellActive,
          styles.editorWrap,
          columnLayoutStyle(column),
          hideWebOutlineView,
        ]}
      >
        {editor}
      </Pressable>
    );
  }

  // RN's `Role` union omits `gridcell`, so the grid a11y props are forwarded as
  // literal DOM attributes via a spread (web only; native grid roles are weaker).
  // On web, selection is driven by `onPointerDown` so a drag can extend the range
  // without a trailing click resetting it; native uses `onPress`.
  const web = Platform.OS === "web";
  const webProps = web
    ? ({
        role: "gridcell",
        "aria-selected": selected,
        onKeyDown,
        onPointerDown: (event: unknown) => {
          const now = Date.now();
          const isDouble = now - lastDownRef.current < 350;
          lastDownRef.current = now;
          // Open the editor on a double-press (any field) or on a single press
          // of an already-active select cell, so its dropdown opens in one click.
          if (isDouble || (active && isSelectField)) {
            onBeginEdit(cellRef);
            return;
          }
          onBeginDrag(cellRef, event);
        },
      } as Record<string, unknown>)
    : {};

  return (
    <Pressable
      // The active cell is the single Tab stop (roving tabindex), so arrow keys
      // reach this handler. On native, tapping an already-active cell edits it.
      onPress={
        web
          ? undefined
          : () => (active ? onBeginEdit(cellRef) : onActivate(cellRef))
      }
      ref={setRef}
      tabIndex={tabStop ? 0 : -1}
      {...webProps}
      style={[
        styles.cell,
        align === "right" ? styles.cellRight : null,
        align === "center" ? styles.cellCenter : null,
        selected ? styles.cellSelected : null,
        active ? styles.cellActive : null,
        columnLayoutStyle(column),
        hideWebOutlineView,
      ]}
    >
      <DataGridCellContent
        column={column}
        fontSize={fontSize}
        styles={styles}
        theme={theme}
        value={value}
      />
    </Pressable>
  );
}
