/**
 * The responsive card-stack presentation of the grid, used below
 * `cardBreakpoint` (the mockup's phone variant) and the natural shape on narrow
 * native screens. Each record is a card: the first column as the title, the rest
 * as label/value rows. Tapping a card opens the record (`onRowExpand`). Read-only
 * — the full interactive grid is the wide-viewport experience.
 */
import { Platform, Pressable, Text, View } from "react-native";

import type { DropdownPoint } from "../dropdown";
import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import { contextMenuTriggerProps } from "../popover";
import type { SharedUiTheme } from "../theme";

import { DataGridCellContent } from "./dataGridCellContent";
import { DataGridCellLoadingContent } from "./DataGridCellLoadingIndicator";
import type { DataGridStyles } from "./dataGridStyles";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridContextMenuTarget,
  DataGridRow,
} from "./types";

export function DataGridCardStack({
  rows,
  columns,
  styles,
  theme,
  fontSize,
  iconSize,
  cellLoading,
  onRowExpand,
  onContextMenu,
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
  onContextMenu?: (
    target: DataGridContextMenuTarget,
    point: DropdownPoint | null,
  ) => void;
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
                  <DataGridCellLoadingContent
                    size={iconSize}
                    styles={styles}
                    theme={theme}
                  >
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {String(row.cells[titleColumn.id] ?? "")}
                    </Text>
                  </DataGridCellLoadingContent>
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
                      <DataGridCellLoadingContent
                        size={iconSize}
                        styles={styles}
                        theme={theme}
                      >
                        <DataGridCellContent
                          column={column}
                          fontSize={fontSize}
                          styles={styles}
                          theme={theme}
                          value={row.cells[column.id] ?? null}
                        />
                      </DataGridCellLoadingContent>
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
        // The card is the only affordance in this layout, so it carries the
        // row menu — otherwise a mobile user could never delete a row.
        const contextProps = onContextMenu
          ? contextMenuTriggerProps({
              isWeb: Platform.OS === "web",
              onOpen: (point) =>
                onContextMenu({ region: "row", rowId: row.id }, point),
            })
          : {};
        return onRowExpand || onContextMenu ? (
          // The list semantics go on a wrapper, not on the pressable itself:
          // react-native-web resolves the DOM role as `role || accessibilityRole`,
          // so a `role="listitem"` on the Pressable would win over the button
          // role — and its press responder only presses Spacebar on `button`
          // roles, leaving the card operable by Enter and click but not Space.
          // Mirrors the shared `List`'s pressable item.
          <View key={row.id} role="listitem">
            <Pressable
              accessibilityLabel={`Open record ${row.id}`}
              accessibilityRole="button"
              onPress={onRowExpand ? () => onRowExpand(row.id) : undefined}
              {...contextProps}
              style={({ hovered }: PressableHoverState) => [
                styles.card,
                hovered ? { borderColor: theme.colors.primaryBorder } : null,
                hideWebOutlineView,
              ]}
            >
              {card}
            </Pressable>
          </View>
        ) : (
          <View key={row.id} role="listitem" style={styles.card}>
            {card}
          </View>
        );
      })}
    </View>
  );
}
