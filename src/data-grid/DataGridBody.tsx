/**
 * The scrollable grid body. For a bounded grid (a `maxHeight` is set) it uses a
 * `FlatList` — windowed on both web (RNW) and native, with `getItemLayout` from
 * the fixed row height and `onEndReached` for infinite scroll. For a small,
 * unbounded grid it renders every row in a plain `rowgroup` (natural height).
 */
import { type ReactNode, useEffect, useRef } from "react";
import { FlatList, Text, View } from "react-native";

import { Spinner } from "../spinner";
import type { SharedUiTheme } from "../theme";

import { DataGridRow } from "./DataGridRow";
import { gridcellRole } from "./dataGridLayout";
import type { DataGridMetrics, DataGridStyles } from "./dataGridStyles";
import type { DataGridController } from "./useDataGridController";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridRow as DataGridRowData,
} from "./types";

export type DataGridBodyProps = {
  rows: DataGridRowData[];
  /** Columns resolved to pixel widths (shared with the header for alignment). */
  columns: DataGridColumn[];
  /** Trailing spacer width matching the add-column (+) header cell. */
  trailingWidth: number;
  controller: DataGridController;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  metrics: DataGridMetrics;
  showGutter: boolean;
  onRowExpand?: (rowId: string) => void;
  maxHeight?: number;
  onEndReached?: () => void;
  loadingMore?: boolean;
  editingCell: DataGridCellRef | null;
  renderEditor?: (ref: DataGridCellRef) => ReactNode;
  /** Trailing "+ New record" row rendered after the data rows. */
  addRow?: ReactNode;
  /** Receive a `scrollToRow(index)` fn so keyboard nav can scroll into view. */
  onRegisterScroll?: (scrollToRow: (rowIndex: number) => void) => void;
};

export function DataGridBody({
  rows,
  columns,
  trailingWidth,
  controller,
  styles,
  theme,
  metrics,
  showGutter,
  onRowExpand,
  maxHeight,
  onEndReached,
  loadingMore,
  editingCell,
  renderEditor,
  addRow,
  onRegisterScroll,
}: DataGridBodyProps) {
  const listRef = useRef<FlatList<DataGridRowData>>(null);
  useEffect(() => {
    onRegisterScroll?.((rowIndex) => {
      listRef.current?.scrollToIndex({
        index: rowIndex,
        viewPosition: 0.5,
        animated: false,
      });
    });
  }, [onRegisterScroll]);

  const renderRow = (row: DataGridRowData, rowIndex: number) => (
    <DataGridRow
      activeCell={controller.activeCell}
      columns={columns}
      editingCell={editingCell}
      fontSize={metrics.fontSize}
      iconSize={metrics.iconSize}
      key={row.id}
      onActivate={controller.activate}
      onBeginDrag={controller.beginDrag}
      onBeginEdit={controller.requestEdit}
      onBeginRowDrag={controller.beginRowDrag}
      onKeyDown={controller.handleCellKeyDown}
      onRowExpand={onRowExpand}
      rect={controller.rect}
      registerGutterNode={controller.registerGutterNode}
      registerNode={controller.registerCellNode}
      renderEditor={renderEditor}
      row={row}
      rowIndex={rowIndex}
      showGutter={showGutter}
      singleSelection={controller.singleSelection}
      styles={styles}
      tabStopCell={controller.tabStop}
      theme={theme}
      trailingWidth={trailingWidth}
    />
  );

  const loadingRow = loadingMore ? (
    <View role="row">
      <View {...gridcellRole()} style={styles.loadingRow}>
        <Spinner size="sm" />
        <Text style={styles.loadingText}>Loading more…</Text>
      </View>
    </View>
  ) : null;

  if (maxHeight !== undefined) {
    return (
      <FlatList
        ListFooterComponent={
          <>
            {loadingRow}
            {addRow}
          </>
        }
        // Fill the fixed body height and paint the muted grey empty zone behind
        // the rows (which are opaque). `flexGrow` stretches the content to the
        // viewport when the rows are short; when they overflow it's a no-op.
        contentContainerStyle={styles.bodyContent}
        data={rows}
        getItemLayout={(_, index) => ({
          length: metrics.rowHeight,
          offset: metrics.rowHeight * index,
          index,
        })}
        keyExtractor={(row) => row.id}
        onEndReached={onEndReached ? () => onEndReached() : undefined}
        onEndReachedThreshold={0.2}
        // getItemLayout makes indices measurable, so this only fires defensively.
        onScrollToIndexFailed={() => undefined}
        ref={listRef}
        renderItem={({ item, index }) => renderRow(item, index)}
        role="rowgroup"
        // A fixed height (not `maxHeight`) so a grid taller than its rows keeps
        // the height and shows the grey empty zone below the last row.
        style={{ height: maxHeight }}
      />
    );
  }

  return (
    <View role="rowgroup">
      {rows.map((row, rowIndex) => renderRow(row, rowIndex))}
      {loadingRow}
      {addRow}
    </View>
  );
}
