/** A single grid cell: read-only content or an open editor, with selection a11y. */
import { type ReactNode, useCallback, useRef } from "react";
import { Platform, Pressable, View } from "react-native";

import { hideWebOutlineView } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { DataGridCellContent } from "./dataGridCellContent";
import { DataGridCellLoadingContent } from "./DataGridCellLoadingIndicator";
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
  /** Whether this cell is inside the copy/cut marquee (dashed outline). */
  copied: boolean;
  /** Whether this cell is the grid's roving Tab stop (only one cell at a time). */
  tabStop: boolean;
  fontSize: number;
  iconSize: number;
  /** Whether this cell is waiting for an asynchronous operation to finish. */
  loading: boolean;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  onActivate: (ref: DataGridCellRef, options?: { extend?: boolean }) => void;
  onBeginDrag: (
    ref: DataGridCellRef,
    event: unknown,
    /** Called on release if the press was a plain click (no drag). */
    onTap?: () => void,
  ) => void;
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
  copied,
  tabStop,
  fontSize,
  iconSize,
  loading,
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

  const web = Platform.OS === "web";
  const content = (
    <DataGridCellContent
      column={column}
      fontSize={fontSize}
      styles={styles}
      theme={theme}
      value={value}
    />
  );

  if (editor) {
    const editorWebProps = web
      ? ({
          role: "gridcell",
          "aria-selected": selected,
          ...(loading
            ? {
                onKeyDown: (event: unknown) => {
                  const keyboardEvent = event as {
                    preventDefault?: () => void;
                    stopPropagation?: () => void;
                  };
                  keyboardEvent.preventDefault?.();
                  keyboardEvent.stopPropagation?.();
                },
              }
            : {}),
        } as Record<string, unknown>)
      : {};
    return (
      <Pressable
        accessibilityLabel={loading ? `Loading ${column.label}` : undefined}
        accessibilityState={loading ? { busy: true } : undefined}
        aria-busy={loading || undefined}
        {...editorWebProps}
        style={[
          styles.cell,
          styles.editorWrap,
          columnLayoutStyle(column),
          hideWebOutlineView,
        ]}
      >
        <View
          accessibilityElementsHidden={loading}
          aria-hidden={loading || undefined}
          importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
          pointerEvents={loading ? "none" : "auto"}
          style={loading ? styles.cellEditorHidden : undefined}
        >
          {editor}
        </View>
        {loading ? (
          <View
            pointerEvents="auto"
            style={[
              styles.cellLoadingOverlay,
              align === "right" ? styles.cellRight : null,
              align === "center" ? styles.cellCenter : null,
            ]}
          >
            <DataGridCellLoadingContent
              size={iconSize}
              styles={styles}
              theme={theme}
            >
              {content}
            </DataGridCellLoadingContent>
          </View>
        ) : null}
      </Pressable>
    );
  }

  // RN's `Role` union omits `gridcell`, so the grid a11y props are forwarded as
  // literal DOM attributes via a spread (web only; native grid roles are weaker).
  // On web, selection is driven by `onPointerDown` so a drag can extend the range
  // without a trailing click resetting it; native uses `onPress`.
  const webProps = web
    ? ({
        role: "gridcell",
        "aria-selected": selected,
        onKeyDown,
        onPointerDown: (event: unknown) => {
          const now = Date.now();
          const isDouble = now - lastDownRef.current < 350;
          lastDownRef.current = now;
          // Shift is a pure range modifier, so it never opens an editor.
          const shift = (event as { shiftKey?: boolean }).shiftKey ?? false;
          // Open the editor on a double-press (any field) or on a single press
          // of an already-active select cell, so its dropdown opens in one click.
          if (!loading && !shift && (isDouble || (active && isSelectField))) {
            onBeginEdit(cellRef);
            return;
          }
          // A plain click on the already-active cell opens its editor (so a
          // second click edits it, Airtable-style), while a drag from it still
          // paints a range — the tap only fires when the press never dragged.
          onBeginDrag(
            cellRef,
            event,
            active && !loading ? () => onBeginEdit(cellRef) : undefined,
          );
        },
      } as Record<string, unknown>)
    : {};

  return (
    <Pressable
      accessibilityLabel={loading ? `Loading ${column.label}` : undefined}
      accessibilityState={loading ? { busy: true } : undefined}
      aria-busy={loading || undefined}
      // The active cell is the single Tab stop (roving tabindex), so arrow keys
      // reach this handler. On native, tapping an already-active cell edits it.
      onPress={
        web
          ? undefined
          : () =>
              active && !loading ? onBeginEdit(cellRef) : onActivate(cellRef)
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
      {loading ? (
        <DataGridCellLoadingContent
          size={iconSize}
          styles={styles}
          theme={theme}
        >
          {content}
        </DataGridCellLoadingContent>
      ) : (
        content
      )}
      {copied ? (
        <View
          pointerEvents="none"
          style={styles.cellCopied}
          testID="data-grid-copy-marquee"
        />
      ) : null}
    </Pressable>
  );
}
