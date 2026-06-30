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
import { useCallback, useMemo, useRef } from "react";
import { useWindowDimensions, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { DataGridAddRow } from "./DataGridAddRow";
import { DataGridCardStack } from "./DataGridCardStack";
import { CellEditor } from "./dataGridCellEditors";
import { DataGridBody } from "./DataGridBody";
import { DataGridAddColumn, DataGridColumnMenu } from "./DataGridColumnMenu";
import { DataGridHeader } from "./DataGridHeader";
import { createDataGridStyles, dataGridMetrics } from "./dataGridStyles";
import { useDataGridController } from "./useDataGridController";
import { useDataGridEditing } from "./useDataGridEditing";
import { DataGridFooter } from "./DataGridFooter";
import type {
  DataGridCellRef,
  DataGridCellValue,
  DataGridColumn,
  DataGridColumnAction,
  DataGridFieldType,
  DataGridRow as DataGridRowData,
  DataGridSelection,
} from "./types";

export type DataGridProps = {
  /** Column / field definitions, in display order. */
  columns: DataGridColumn[];
  /** Data rows. */
  rows: DataGridRowData[];
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
  /** Footer record-count text, e.g. "7 of 128 records". */
  footerText?: string;
  /** Max body height in px before the rows scroll (virtualized). */
  maxHeight?: number;
  /** Below this viewport width, render the read-only card stack (mobile). */
  cardBreakpoint?: number;
  /** Accessible name for the whole grid (WCAG 4.1.2). */
  accessibilityLabel?: string;
  testID?: string;
};

export function DataGrid({
  columns,
  rows,
  size = "md",
  selection,
  onSelectionChange,
  onCellChange,
  onColumnMenuAction,
  onAddColumn,
  onAddRow,
  onRowExpand,
  onEndReached,
  loadingMore,
  showGutter = true,
  footerText,
  maxHeight,
  cardBreakpoint,
  accessibilityLabel,
  testID,
}: DataGridProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDataGridStyles(theme, size),
    [theme, size],
  );
  const metrics = useMemo(() => dataGridMetrics(size), [size]);
  const { width: windowWidth } = useWindowDimensions();
  const asCards = cardBreakpoint !== undefined && windowWidth < cardBreakpoint;

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

  const editing = useDataGridEditing({ columns, onCellChange });
  const controller = useDataGridController({
    columns,
    rows,
    selection,
    onSelectionChange,
    onRequestEdit: editing.beginEdit,
    onNavigateToRow: navigateToRow,
  });

  const renderEditor = useCallback(
    (ref: DataGridCellRef) => {
      const column = columns.find((col) => col.id === ref.columnId);
      if (!column) {
        return null;
      }
      const value = rows.find((row) => row.id === ref.rowId)?.cells[
        ref.columnId
      ];
      return (
        <CellEditor
          column={column}
          fontSize={metrics.fontSize}
          onCancel={() => {
            editing.cancelEdit();
            if (typeof requestAnimationFrame !== "undefined") {
              requestAnimationFrame(() => controller.focusCell(ref));
            }
          }}
          onChange={(next) => {
            void onCellChange?.(ref, next);
          }}
          onCommit={(next, moveNext) => {
            void editing.commitEdit(ref, next);
            if (moveNext) {
              controller.moveActiveDown();
            } else if (typeof requestAnimationFrame !== "undefined") {
              requestAnimationFrame(() => controller.focusCell(ref));
            }
          }}
          theme={theme}
          value={value ?? null}
        />
      );
    },
    [columns, controller, editing, metrics.fontSize, onCellChange, rows, theme],
  );

  if (asCards) {
    return (
      <View testID={testID}>
        <DataGridCardStack
          accessibilityLabel={accessibilityLabel}
          columns={controller.visibleColumns}
          fontSize={metrics.fontSize}
          onRowExpand={onRowExpand}
          rows={rows}
          styles={styles}
          theme={theme}
        />
      </View>
    );
  }

  return (
    <View style={styles.grid} testID={testID}>
      <View accessibilityLabel={accessibilityLabel} role="grid">
        <DataGridHeader
          columns={controller.visibleColumns}
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
                    onAction={(action) => onColumnMenuAction(column.id, action)}
                    styles={styles}
                    theme={theme}
                  />
                )
              : undefined
          }
          showGutter={showGutter}
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
          controller={controller}
          editingCell={editing.editingCell}
          loadingMore={loadingMore}
          maxHeight={maxHeight}
          metrics={metrics}
          onEndReached={onEndReached}
          onRegisterScroll={registerScroll}
          onRowExpand={onRowExpand}
          renderEditor={renderEditor}
          rows={rows}
          showGutter={showGutter}
          styles={styles}
          theme={theme}
        />
      </View>
      {footerText ? (
        <DataGridFooter footerText={footerText} styles={styles} />
      ) : null}
    </View>
  );
}
