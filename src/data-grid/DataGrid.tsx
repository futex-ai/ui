/**
 * Airtable / Notion–style editable data grid.
 *
 * A controlled, cross-platform (RN + RNW) grid: the consumer owns `columns`,
 * `rows`, and (optionally) `selection`, and the grid emits change callbacks. It
 * supports cell-range selection (keyboard + pointer drag), arrow-key navigation,
 * typed editable cells, column header menus, and an infinitely-scrolling body.
 *
 * Composition note: it deliberately reuses the library primitives (`Input`,
 * `DateField`, `DropdownMenu`, `ComboboxMultiSelect`, `Badge`) and lets those own
 * their portals; the grid adds the selection model, keyboard model, and chrome.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { ContextMenu } from "../popover";
import { useSharedUiTheme } from "../theme";

import { DataGridAddRow } from "./DataGridAddRow";
import { DataGridCardStack } from "./DataGridCardStack";
import { DataGridMarquee } from "./DataGridMarquee";
import { DataGridBody } from "./DataGridBody";
import { DataGridAddColumn, DataGridColumnMenu } from "./DataGridColumnMenu";
import { resolveColumnWidths } from "./dataGridColumnWidths";
import { cellKey } from "./dataGridSelectionModel";
import { DataGridHeader } from "./DataGridHeader";
import {
  ADD_COLUMN_WIDTH,
  createDataGridStyles,
  dataGridMetrics,
} from "./dataGridStyles";
import { useDataGridClipboard } from "./useDataGridClipboard";
import { useDataGridColumnResize } from "./useDataGridColumnResize";
import { useDataGridController } from "./useDataGridController";
import {
  useDataGridContextMenu,
  type DataGridContextMenuEntries,
} from "./useDataGridContextMenu";
import { useDataGridEditing } from "./useDataGridEditing";
import { useDataGridEditorRenderer } from "./useDataGridEditorRenderer";
import { DataGridFooter } from "./DataGridFooter";
import type {
  DataGridCellRef,
  DataGridCellValue,
  DataGridColumn,
  DataGridColumnAction,
  DataGridFieldType,
  DataGridRow as DataGridRowData,
  DataGridRowAction,
  DataGridSelection,
} from "./types";

export type DataGridProps = {
  /** Column / field definitions, in display order. */
  columns: DataGridColumn[];
  /** Data rows. */
  rows: DataGridRowData[];
  /** Return true to show a busy spinner for an individual cell. */
  cellLoading?: (ref: DataGridCellRef) => boolean;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Controlled selection. Omit to let the grid manage it internally. */
  selection?: DataGridSelection;
  /** Notified whenever the selection changes. */
  onSelectionChange?: (selection: DataGridSelection) => void;
  /** Commit a cell edit. Return a rejected promise to keep the editor open. */
  onCellChange?: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => void | Promise<void>;
  /** A column header-menu action (sort / hide / delete). */
  onColumnMenuAction?: (columnId: string, action: DataGridColumnAction) => void;
  /**
   * Notified as a column is resized by dragging its header edge (or the arrow
   * keys). The grid manages the width itself — use this to persist it (e.g. to
   * storage); `columns[].width` / `flex` still supply the initial size.
   */
  onColumnResize?: (columnId: string, width: number) => void;
  /** Add a new column of the chosen field type. */
  onAddColumn?: (fieldType: DataGridFieldType) => void;
  /** Add a new empty record. Renders the trailing "+ New record" row. */
  onAddRow?: () => void;
  /** Open the expanded record for a row (gutter expand affordance). */
  onRowExpand?: (rowId: string) => void;
  /** Called near the scroll end to load more rows (infinite scroll). */
  onEndReached?: () => void;
  /** Show the trailing loading row while the next page loads. */
  loadingMore?: boolean;
  /** Show the row-number / expand gutter. Defaults to true. */
  showGutter?: boolean;
  /**
   * Corner radius (px) of the grid frame + mobile cards. Defaults to `0`
   * (square corners); pass e.g. `theme.radii.lg` for rounded corners.
   */
  borderRadius?: number;
  /**
   * Outer frame + mobile card border width (px). Defaults to `1`; set to `0`
   * to drop the outer border (the internal cell hairlines are unaffected) —
   * useful when the grid sits flush inside an already-bordered panel.
   */
  borderWidth?: number;
  /** Footer record-count text, e.g. "7 of 128 records". */
  footerText?: string;
  /**
   * Fixed body height in px (virtualized). The body fills this height: rows
   * scroll once they overflow it, and when they're shorter the area below the
   * last row reads as a muted grey empty zone (Airtable / Notion style) rather
   * than collapsing to the rows. Omit for an unbounded body sized to its rows.
   */
  maxHeight?: number;
  /** Below this viewport width, render the read-only card stack (mobile). */
  cardBreakpoint?: number;
  /**
   * Enable right-click (web) / long-press (native) menus on column headers, the
   * row gutter, and cells. Off by default: opting in also suppresses the
   * browser's own menu over the grid.
   *
   * Each region's rows are gated by the callback that services them —
   * `onColumnMenuAction` for headers, `onRowMenuAction` for the gutter. The
   * cell menu needs no callback: the grid already owns the clipboard and the
   * editor.
   */
  contextMenu?: boolean;
  /**
   * Row actions from the gutter context menu. `rowIds` is the whole selected
   * row span when the pressed row sits inside it, otherwise just that row, so
   * "Delete 5 rows" arrives as one call.
   */
  onRowMenuAction?: (rowIds: string[], action: DataGridRowAction) => void;
  /**
   * Add to, reorder, or replace the default context-menu entries. Return an
   * empty array to suppress the menu for that target.
   */
  onContextMenuEntries?: DataGridContextMenuEntries;
  /** Accessible name for the whole grid (WCAG 4.1.2). */
  accessibilityLabel?: string;
  /**
   * Disable the shared focus glow on the column resize handles. They then fall
   * back to the browser's default focus outline so keyboard focus stays visible
   * (WCAG 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via the
   * theme's `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  testID?: string;
};

export function DataGrid({
  columns,
  rows,
  cellLoading,
  size = "md",
  selection,
  onSelectionChange,
  onCellChange,
  onColumnMenuAction,
  onColumnResize,
  onAddColumn,
  onAddRow,
  onRowExpand,
  onEndReached,
  loadingMore,
  showGutter = true,
  borderRadius = 0,
  borderWidth = 1,
  footerText,
  maxHeight,
  cardBreakpoint,
  contextMenu = false,
  onRowMenuAction,
  onContextMenuEntries,
  accessibilityLabel,
  disableFocusRing = false,
  testID,
}: DataGridProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDataGridStyles(theme, size, borderRadius, borderWidth),
    [theme, size, borderRadius, borderWidth],
  );
  const metrics = useMemo(() => dataGridMetrics(size), [size]);
  const { width: windowWidth } = useWindowDimensions();
  const asCards = cardBreakpoint !== undefined && windowWidth < cardBreakpoint;

  // Measure the grid width so flex columns resolve to concrete pixel widths that
  // the header and every body row share (keeps them aligned, incl. the add-column
  // reserve), and so the total content width can overflow → horizontal scroll.
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const onGridLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setMeasuredWidth((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  }, []);
  const hasAddColumn = onAddColumn !== undefined;

  // Keyboard nav scrolls the active row into view via the body's FlatList.
  const scrollToRowRef = useRef<((rowIndex: number) => void) | null>(null);
  const navigateToRow = useCallback((rowIndex: number) => {
    scrollToRowRef.current?.(rowIndex);
  }, []);
  const registerScroll = useCallback(
    (scrollToRow: (rowIndex: number) => void) => {
      scrollToRowRef.current = scrollToRow;
    },
    [],
  );

  // Copy/paste: stable handlers wired to the controller; `bind` (below) supplies
  // the latest state each render, since the handlers are created before it.
  const clipboard = useDataGridClipboard();

  const editing = useDataGridEditing({ cellLoading, columns, onCellChange });
  const menu = useDataGridContextMenu({
    theme,
    web: Platform.OS === "web",
  });
  const controller = useDataGridController({
    columns,
    rows,
    selection,
    onSelectionChange,
    onRequestEdit: editing.beginEdit,
    onNavigateToRow: navigateToRow,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
    onClearSelection: clipboard.onClearSelection,
    onCancelCopy: clipboard.onCancelCopy,
    // While a menu is open it owns the keyboard: its navigation runs on a
    // document listener that only stops propagation for the keys it handles,
    // and focus never leaves the cell, so ungated Delete would clear the
    // selection underneath the menu.
    contextMenuOpen: menu.open,
    onContextMenuKey: contextMenu ? menu.onContextMenuKey : undefined,
  });
  clipboard.bind({ controller, rows, onCellChange });
  menu.bind({
    columns,
    controller,
    onCellChange: Boolean(onCellChange),
    onClearSelection: clipboard.onClearSelection,
    onColumnMenuAction,
    onContextMenuEntries,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
    onRowMenuAction,
  });
  const onContextMenu = contextMenu ? menu.onContextMenu : undefined;

  // The copy/cut marquee: the set of marked cell keys. Cells are addressed by id,
  // so the dashed outline follows them through a sort/filter and simply drops any
  // cell that is no longer visible.
  const copiedKeys = useMemo(
    () =>
      clipboard.copied
        ? new Set(clipboard.copied.refs.map((ref) => cellKey(ref)))
        : null,
    [clipboard.copied],
  );

  const renderEditor = useDataGridEditorRenderer({
    columns,
    rows,
    controller,
    editing,
    onCellChange,
    fontSize: metrics.fontSize,
    theme,
  });

  // Column resizing: the grid owns per-column width overrides (onColumnResize is
  // a change notification). `resolvedWidthsRef` gives the resize hook each
  // column's current pixel width so it can freeze flex neighbors when a drag
  // starts; it's synced from `resolved` after every layout pass below.
  const resolvedWidthsRef = useRef<Record<string, number>>({});
  const resize = useDataGridColumnResize({
    columns: controller.visibleColumns,
    resolvedWidthsRef,
    onColumnResize,
  });

  // Resolve flex columns to pixels once the width is measured; before that, fall
  // back to flex sizing (width: 100%) for a clean first paint.
  const chromeWidth =
    (showGutter ? metrics.gutterWidth : 0) +
    (hasAddColumn ? ADD_COLUMN_WIDTH : 0);
  const layoutReady = measuredWidth > 0;
  const resolved = useMemo(
    () =>
      resolveColumnWidths(
        controller.visibleColumns,
        // Subtract the left + right frame border so columns fill the content box.
        Math.max(0, measuredWidth - borderWidth * 2),
        chromeWidth,
        resize.columnWidthOverrides,
      ),
    [
      controller.visibleColumns,
      measuredWidth,
      borderWidth,
      chromeWidth,
      resize.columnWidthOverrides,
    ],
  );
  const renderColumns = layoutReady
    ? resolved.columns
    : controller.visibleColumns;

  // Keep the resize hook's view of current pixel widths in sync so a resize that
  // starts next frame can freeze the flex columns at their painted widths.
  useEffect(() => {
    const widths: Record<string, number> = {};
    for (const column of resolved.columns) {
      widths[column.id] = column.width;
    }
    resolvedWidthsRef.current = widths;
  }, [resolved]);

  if (asCards) {
    return (
      <View testID={testID}>
        <DataGridCardStack
          accessibilityLabel={accessibilityLabel}
          cellLoading={cellLoading}
          columns={controller.visibleColumns}
          fontSize={metrics.fontSize}
          iconSize={metrics.iconSize}
          onContextMenu={onContextMenu}
          onRowExpand={onRowExpand}
          rows={rows}
          styles={styles}
          theme={theme}
        />
        <ContextMenu
          accessibilityLabel={menu.label}
          entries={menu.entries}
          onClose={menu.close}
          open={menu.open}
          point={menu.point}
          title={menu.title}
        />
      </View>
    );
  }

  return (
    <View
      onLayout={onGridLayout}
      ref={(node) =>
        controller.registerGridNode(node as unknown as Element | null)
      }
      style={styles.grid}
      testID={testID}
    >
      <ScrollView
        horizontal
        // Fixed content width overflows the viewport → horizontal scroll; the
        // header scrolls in lockstep with the body since both live in here.
        // `minWidth: 100%` floors the content at the viewport so that when
        // capped columns leave it narrower (sparse grids), the header/rows still
        // span the full width — the leftover reads as a clean empty grid area
        // instead of a table that stops short with a broken border.
        contentContainerStyle={
          layoutReady
            ? { minWidth: "100%", width: resolved.contentWidth }
            : { minWidth: "100%" }
        }
        showsHorizontalScrollIndicator
      >
        <View
          accessibilityLabel={accessibilityLabel}
          role="grid"
          style={styles.gridContent}
        >
          <DataGridHeader
            columns={renderColumns}
            iconSize={metrics.iconSize}
            renderAddColumn={
              onAddColumn
                ? () => (
                    <DataGridAddColumn
                      iconSize={metrics.iconSize}
                      onAddColumn={onAddColumn}
                      styles={styles}
                      theme={theme}
                    />
                  )
                : undefined
            }
            renderColumnMenuButton={
              onColumnMenuAction
                ? (column) => (
                    <DataGridColumnMenu
                      column={column}
                      iconSize={metrics.iconSize}
                      onAction={(action) =>
                        onColumnMenuAction(column.id, action)
                      }
                      styles={styles}
                      theme={theme}
                    />
                  )
                : undefined
            }
            onBeginColumnDrag={controller.beginColumnDrag}
            onContextMenu={onContextMenu}
            onBeginColumnResize={resize.beginColumnResize}
            onColumnResizeStep={resize.resizeColumnByStep}
            registerHeaderNode={controller.registerHeaderNode}
            resizingColumnId={resize.resizingColumnId}
            showGutter={showGutter}
            disableFocusRing={disableFocusRing}
            styles={styles}
            theme={theme}
          />
          <DataGridBody
            addRow={
              onAddRow ? (
                <DataGridAddRow
                  iconSize={metrics.iconSize}
                  onPress={onAddRow}
                  styles={styles}
                  theme={theme}
                />
              ) : undefined
            }
            columns={renderColumns}
            cellLoading={cellLoading}
            controller={controller}
            copiedKeys={copiedKeys}
            editingCell={editing.editingCell}
            loadingMore={loadingMore}
            maxHeight={maxHeight}
            metrics={metrics}
            onContextMenu={onContextMenu}
            onEndReached={onEndReached}
            onRegisterScroll={registerScroll}
            onRowExpand={onRowExpand}
            renderEditor={renderEditor}
            rows={rows}
            showGutter={showGutter}
            styles={styles}
            theme={theme}
            trailingWidth={hasAddColumn ? ADD_COLUMN_WIDTH : 0}
          />
        </View>
      </ScrollView>
      <DataGridMarquee box={controller.dragBox} styles={styles} />
      <ContextMenu
        accessibilityLabel={menu.label}
        entries={menu.entries}
        onClose={menu.close}
        open={menu.open}
        point={menu.point}
        title={menu.title}
      />
      {footerText ? (
        <DataGridFooter footerText={footerText} styles={styles} />
      ) : null}
    </View>
  );
}
