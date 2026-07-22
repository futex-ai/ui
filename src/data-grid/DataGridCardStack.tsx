/**
 * The responsive card-stack presentation of the grid, used below
 * `cardBreakpoint` (the mockup's phone variant) and the natural shape on narrow
 * native screens. Each record is a card: the first column as the title, the rest
 * as label/value rows. Tapping a card opens the record (`onRowExpand`). Read-only
 * — the full interactive grid is the wide-viewport experience.
 */
import { Pressable, Text, View } from "react-native";

import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { DataGridCellContent } from "./dataGridCellContent";
import { DataGridCellLoadingIndicator } from "./DataGridCellLoadingIndicator";
import type { DataGridStyles } from "./dataGridStyles";
import type { DataGridCellRef, DataGridColumn, DataGridRow } from "./types";

export function DataGridCardStack({
  rows,
  columns,
  styles,
  theme,
  fontSize,
  iconSize,
  cellLoading,
  onRowExpand,
  accessibilityLabel,
}: {
  rows: DataGridRow[];
  columns: DataGridColumn[];
  styles: DataGridStyles;
  theme: SharedUiTheme;
  fontSize: number;
  iconSize: number;
  cellLoading?: (ref: DataGridCellRef) => boolean;
  onRowExpand?: (rowId: string) => void;
  accessibilityLabel?: string;
}) {
  const [titleColumn, ...fieldColumns] = columns;
  const isLoading = (ref: DataGridCellRef) => cellLoading?.(ref) ?? false;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      role="list"
      style={styles.cardStack}
    >
      {rows.map((row) => {
        const titleRef = titleColumn
          ? { rowId: row.id, columnId: titleColumn.id }
          : null;
        const titleLoading = titleRef ? isLoading(titleRef) : false;
        const card = (
          <>
            {titleColumn ? (
              <View
                accessibilityState={titleLoading ? { busy: true } : undefined}
                aria-busy={titleLoading || undefined}
                style={styles.cardTitleValue}
              >
                {titleLoading ? (
                  <DataGridCellLoadingIndicator size={iconSize} theme={theme} />
                ) : (
                  <Text numberOfLines={2} style={styles.cardTitle}>
                    {String(row.cells[titleColumn.id] ?? "")}
                  </Text>
                )}
              </View>
            ) : null}
            {fieldColumns.map((column) => {
              const ref = { rowId: row.id, columnId: column.id };
              const loading = isLoading(ref);
              return (
                <View key={column.id} style={styles.cardField}>
                  <Text style={styles.cardLabel}>{column.label}</Text>
                  <View
                    accessibilityState={loading ? { busy: true } : undefined}
                    aria-busy={loading || undefined}
                    style={styles.cardValue}
                  >
                    {loading ? (
                      <DataGridCellLoadingIndicator
                        size={iconSize}
                        theme={theme}
                      />
                    ) : (
                      <DataGridCellContent
                        column={column}
                        fontSize={fontSize}
                        styles={styles}
                        theme={theme}
                        value={row.cells[column.id] ?? null}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </>
        );
        return onRowExpand ? (
          <Pressable
            accessibilityLabel={`Open record ${row.id}`}
            accessibilityRole="button"
            key={row.id}
            onPress={() => onRowExpand(row.id)}
            role="listitem"
            style={({ hovered }: PressableHoverState) => [
              styles.card,
              hovered ? { borderColor: theme.colors.primaryBorder } : null,
              hideWebOutlineView,
            ]}
          >
            {card}
          </Pressable>
        ) : (
          <View key={row.id} role="listitem" style={styles.card}>
            {card}
          </View>
        );
      })}
    </View>
  );
}
