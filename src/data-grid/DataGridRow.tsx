/** One grid row: the left gutter (row number + expand) followed by typed cells. */
import { Maximize2 } from "lucide-react-native";
import { memo } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { DataGridCell } from "./DataGridCell";
import { isInteractiveDragTarget } from "./dataGridDragDom";
import { gridcellRole, stickyGutterStyle } from "./dataGridLayout";
import { cellKey, cellRefEquals, rectContains } from "./dataGridSelectionModel";
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
  /** Keys of the cells on the clipboard (dashed copy/cut marquee), or null. */
  copiedKeys: Set<string> | null;
  activeCell: DataGridCellRef | null;
  tabStopCell: DataGridCellRef | null;
  /** Whether the current selection is exactly one cell (shows the active ring). */
  singleSelection: boolean;
  editingCell: DataGridCellRef | null;
  renderEditor?: (ref: DataGridCellRef) => React.ReactNode;
  /** Resolve whether an individual cell is waiting on asynchronous work. */
  cellLoading?: (ref: DataGridCellRef) => boolean;
  showGutter: boolean;
  iconSize: number;
  fontSize: number;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  onActivate: (ref: DataGridCellRef, options?: { extend?: boolean }) => void;
  onBeginDrag: (
    ref: DataGridCellRef,
    event: unknown,
    onTap?: () => void,
  ) => void;
  onBeginEdit: (ref: DataGridCellRef) => void;
  onKeyDown: (event: unknown) => void;
  registerNode: (
    ref: DataGridCellRef,
    node: { focus?: () => void } | null,
  ) => void;
  onRowExpand?: (rowId: string) => void;
  /** Trailing empty cell width matching the add-column (+) header (0 = none). */
  trailingWidth: number;
  /** Start a whole-row drag selection from the gutter (web). */
  onBeginRowDrag: (rowId: string, event: unknown) => void;
  /** Register the gutter node for drag hit-testing. */
  registerGutterNode: (
    rowId: string,
    node: { contains?: (n: Node) => boolean } | null,
  ) => void;
};

function DataGridRowComponent({
  row,
  rowIndex,
  columns,
  rect,
  copiedKeys,
  activeCell,
  tabStopCell,
  singleSelection,
  editingCell,
  renderEditor,
  cellLoading,
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
  onBeginRowDrag,
  registerGutterNode,
}: DataGridRowProps) {
  const gutterWebProps =
    Platform.OS === "web"
      ? ({
          onPointerDown: (event: unknown) => {
            if (!isInteractiveDragTarget(event)) {
              onBeginRowDrag(row.id, event);
            }
          },
        } as Record<string, unknown>)
      : {};
  return (
    <View role="row" style={styles.bodyRow}>
      {showGutter ? (
        <View
          ref={
            Platform.OS === "web"
              ? (node) =>
                  registerGutterNode(
                    row.id,
                    node as unknown as {
                      contains?: (n: Node) => boolean;
                    } | null,
                  )
              : undefined
          }
          role="rowheader"
          {...gutterWebProps}
          style={[styles.gutterCell, stickyGutterStyle]}
        >
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
            active={singleSelection && cellRefEquals(cellRef, activeCell)}
            cellRef={cellRef}
            column={column}
            copied={copiedKeys?.has(cellKey(cellRef)) ?? false}
            editor={editing ? renderEditor?.(cellRef) : undefined}
            fontSize={fontSize}
            iconSize={iconSize}
            key={column.id}
            loading={cellLoading?.(cellRef) ?? false}
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
