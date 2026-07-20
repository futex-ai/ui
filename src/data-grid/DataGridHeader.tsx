/** The grid's sticky header row: typed column headers, sort state, and chrome. */
import { type ReactNode } from "react";
import { Platform, Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";

import { fieldTypeIcon } from "./dataGridCellContent";
import type { ResolvedColumn } from "./dataGridColumnWidths";
import { isInteractiveDragTarget } from "./dataGridDragDom";
import {
  columnLayoutStyle,
  resolveColumnAlign,
  stickyGutterStyle,
} from "./dataGridLayout";
import { DataGridResizeHandle } from "./DataGridResizeHandle";
import type { DataGridStyles } from "./dataGridStyles";
import type { DataGridColumn } from "./types";

export type DataGridHeaderProps = {
  columns: DataGridColumn[];
  showGutter: boolean;
  iconSize: number;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  /** Trailing slot per header cell — the caret menu button (added by the menu). */
  renderColumnMenuButton?: (column: DataGridColumn) => ReactNode;
  /** Trailing add-column (+) header cell. */
  renderAddColumn?: () => ReactNode;
  /** Start a whole-column drag selection from a header (web). */
  onBeginColumnDrag: (columnId: string, event: unknown) => void;
  /** Register a header node for drag hit-testing. */
  registerHeaderNode: (
    columnId: string,
    node: { contains?: (n: Node) => boolean } | null,
  ) => void;
  /** Start a pointer resize of a column from its header edge (web). */
  onBeginColumnResize: (
    columnId: string,
    startWidth: number,
    event: unknown,
  ) => void;
  /** Nudge a column's width via the arrow keys on a focused handle (web). */
  onColumnResizeStep: (
    columnId: string,
    direction: 1 | -1,
    currentWidth: number,
  ) => void;
  /** The column currently being pointer-resized, for handle styling. */
  resizingColumnId: string | null;
};

/** A small ↑/↓ glyph for a sorted column. */
function sortGlyph(direction: DataGridColumn["sortDirection"]): string | null {
  if (direction === "asc") {
    return "↑";
  }
  if (direction === "desc") {
    return "↓";
  }
  return null;
}

export function DataGridHeader({
  columns,
  showGutter,
  iconSize,
  styles,
  theme,
  renderColumnMenuButton,
  renderAddColumn,
  onBeginColumnDrag,
  registerHeaderNode,
  onBeginColumnResize,
  onColumnResizeStep,
  resizingColumnId,
}: DataGridHeaderProps) {
  const web = Platform.OS === "web";
  return (
    <View role="row" style={styles.headerRow}>
      {showGutter ? (
        <View style={[styles.gutterHeaderCell, stickyGutterStyle]} />
      ) : null}
      {columns.map((column) => {
        const Icon = fieldTypeIcon(column.fieldType);
        const align = resolveColumnAlign(column);
        const glyph = sortGlyph(column.sortDirection);
        // The handle needs a concrete pixel width (its drag start + a11y value),
        // so it only shows once the columns are resolved and not opted out.
        const canResize =
          web && column.resizable !== false && typeof column.width === "number";
        // RN's prop types omit `aria-sort`; forward it as a literal web attribute.
        // `onPointerDown` starts a whole-column drag (unless on the caret menu).
        const webProps = web
          ? ({
              ...(column.sortDirection
                ? {
                    "aria-sort":
                      column.sortDirection === "asc"
                        ? "ascending"
                        : "descending",
                  }
                : {}),
              onPointerDown: (event: unknown) => {
                if (!isInteractiveDragTarget(event)) {
                  onBeginColumnDrag(column.id, event);
                }
              },
            } as Record<string, unknown>)
          : {};
        return (
          <View
            key={column.id}
            ref={
              web
                ? (node) =>
                    registerHeaderNode(
                      column.id,
                      node as unknown as {
                        contains?: (n: Node) => boolean;
                      } | null,
                    )
                : undefined
            }
            role="columnheader"
            {...webProps}
            style={[
              styles.headerCell,
              columnLayoutStyle(column),
              align === "right" ? { justifyContent: "flex-end" } : null,
            ]}
          >
            <Icon color={theme.colors.muted} size={iconSize - 1} />
            <Text numberOfLines={1} style={styles.headerLabel}>
              {column.label}
            </Text>
            {glyph ? <Text style={styles.headerSort}>{glyph}</Text> : null}
            {renderColumnMenuButton?.(column)}
            {canResize ? (
              <DataGridResizeHandle
                active={resizingColumnId === column.id}
                column={column as ResolvedColumn}
                onBeginResize={onBeginColumnResize}
                onResizeStep={onColumnResizeStep}
                styles={styles}
              />
            ) : null}
          </View>
        );
      })}
      {renderAddColumn?.()}
    </View>
  );
}
