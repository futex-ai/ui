/** One grid row: the left gutter (row number + expand) followed by typed cells. */
import { Maximize2 } from "lucide-react-native";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { DataGridCell } from "./DataGridCell";
import { gridcellRole, stickyGutterStyle } from "./dataGridLayout";
import { cellRefEquals, rectContains } from "./dataGridSelectionModel";
import type { DataGridRangeRect } from "./dataGridSelectionModel";
import type { DataGridStyles } from "./dataGridStyles";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridRow as DataGridRowData,
} from "./types";

export type DataGridRowProps = {
  row: DataGridRowData;
  rowIndex: number;
  columns: DataGridColumn[];
  rect: DataGridRangeRect | null;
  activeCell: DataGridCellRef | null;
  tabStopCell: DataGridCellRef | null;
  editingCell: DataGridCellRef | null;
  renderEditor?: (ref: DataGridCellRef) => React.ReactNode;
  showGutter: boolean;
  iconSize: number;
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
  onRowExpand?: (rowId: string) => void;
  /** Trailing empty cell width matching the add-column (+) header (0 = none). */
  trailingWidth: number;
};

function DataGridRowComponent({
  row,
  rowIndex,
  columns,
  rect,
  activeCell,
  tabStopCell,
  editingCell,
  renderEditor,
  showGutter,
  iconSize,
  fontSize,
  styles,
  theme,
  onActivate,
  onBeginDrag,
  onBeginEdit,
  onKeyDown,
  registerNode,
  onRowExpand,
  trailingWidth,
}: DataGridRowProps) {
  return (
    <View role="row" style={styles.bodyRow}>
      {showGutter ? (
        <View role="rowheader" style={[styles.gutterCell, stickyGutterStyle]}>
          <Text style={styles.gutterNumber}>{rowIndex + 1}</Text>
          {onRowExpand ? (
            <Pressable
              accessibilityLabel={`Expand row ${rowIndex + 1}`}
              accessibilityRole="button"
              onPress={() => onRowExpand(row.id)}
              style={({ hovered }: PressableHoverState) => [
                styles.gutterExpand,
                hovered ? styles.gutterExpandHover : null,
                hideWebOutlineView,
              ]}
            >
              <Maximize2 color={theme.colors.muted} size={iconSize - 2} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {columns.map((column, colIndex) => {
        const cellRef: DataGridCellRef = {
          rowId: row.id,
          columnId: column.id,
        };
        const editing = cellRefEquals(cellRef, editingCell);
        return (
          <DataGridCell
            active={cellRefEquals(cellRef, activeCell)}
            cellRef={cellRef}
            column={column}
            editor={editing ? renderEditor?.(cellRef) : undefined}
            fontSize={fontSize}
            key={column.id}
            onActivate={onActivate}
            onBeginDrag={onBeginDrag}
            onBeginEdit={onBeginEdit}
            onKeyDown={onKeyDown}
            registerNode={registerNode}
            selected={rectContains(rect, rowIndex, colIndex)}
            styles={styles}
            tabStop={cellRefEquals(cellRef, tabStopCell)}
            theme={theme}
            value={row.cells[column.id] ?? null}
          />
        );
      })}
      {trailingWidth > 0 ? (
        <View
          {...gridcellRole()}
          aria-hidden
          style={[styles.cell, { width: trailingWidth }]}
        />
      ) : null}
    </View>
  );
}

export const DataGridRow = memo(DataGridRowComponent);
