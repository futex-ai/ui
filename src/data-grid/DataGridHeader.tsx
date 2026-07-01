/** The grid's sticky header row: typed column headers, sort state, and chrome. */
import { type ReactNode } from "react";
import { Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";

import { fieldTypeIcon } from "./dataGridCellContent";
import {
  columnLayoutStyle,
  resolveColumnAlign,
  stickyGutterStyle,
} from "./dataGridLayout";
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
}: DataGridHeaderProps) {
  return (
    <View role="row" style={styles.headerRow}>
      {showGutter ? (
        <View style={[styles.gutterHeaderCell, stickyGutterStyle]} />
      ) : null}
      {columns.map((column) => {
        const Icon = fieldTypeIcon(column.fieldType);
        const align = resolveColumnAlign(column);
        const glyph = sortGlyph(column.sortDirection);
        // RN's prop types omit `aria-sort`; forward it as a literal web attribute.
        const sortProps =
          column.sortDirection &&
          ({
            "aria-sort":
              column.sortDirection === "asc" ? "ascending" : "descending",
          } as Record<string, unknown>);
        return (
          <View
            key={column.id}
            role="columnheader"
            {...(sortProps || {})}
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
          </View>
        );
      })}
      {renderAddColumn?.()}
    </View>
  );
}
