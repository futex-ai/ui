/** The grid's sticky header row: typed column headers, sort state, and chrome. */
import { type ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import type { DropdownPoint } from "../dropdown";
import { contextMenuTriggerProps } from "../popover";
import { Spinner } from "../spinner";
import type { SharedUiTheme } from "../theme";

import { fieldTypeIcon } from "./dataGridCellContent";
import { DataGridClippedText } from "./DataGridClippedText";
import type { ResolvedColumn } from "./dataGridColumnWidths";
import { isInteractiveDragTarget } from "./dataGridDragDom";
import {
  columnLayoutStyle,
  resolveColumnAlign,
  stickyGutterStyle,
} from "./dataGridLayout";
import { DataGridResizeHandle } from "./DataGridResizeHandle";
import type { DataGridStyles } from "./dataGridStyles";
import type { DataGridColumn, DataGridContextMenuTarget } from "./types";

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
  /** Disable the shared focus glow on the resize handles (falls back to the UA outline). */
  disableFocusRing: boolean;
  /** Opens the column context menu; omitted when `contextMenu` is off. */
  onContextMenu?: (
    target: DataGridContextMenuTarget,
    point: DropdownPoint | null,
  ) => void;
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
  disableFocusRing,
  onContextMenu,
}: DataGridHeaderProps) {
  const web = Platform.OS === "web";
  // Native carries the column menu on a long press, and a `View` has no press
  // responder. Swapping the root element (rather than wrapping it) keeps the
  // flex layout and the `columnheader` role exactly where they were.
  const HeaderCell = web ? View : Pressable;
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
              // Built inline beside the drag props (and not hoisted into a
              // per-column closure) so the header keeps rendering from one
              // stable callback.
              ...(onContextMenu
                ? contextMenuTriggerProps({
                    isWeb: true,
                    onOpen: (point) =>
                      onContextMenu(
                        { columnId: column.id, region: "column" },
                        point,
                      ),
                  })
                : {}),
            } as Record<string, unknown>)
          : {};
        const nativeContextProps =
          !web && onContextMenu
            ? contextMenuTriggerProps({
                isWeb: false,
                onOpen: (point) =>
                  onContextMenu(
                    { columnId: column.id, region: "column" },
                    point,
                  ),
              })
            : {};
        return (
          <HeaderCell
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
            // While loading, mark the header itself busy — cross-platform via
            // `accessibilityState`, with the literal `aria-busy` pinning the web
            // DOM state regardless of RNW's state-merge order (matching Table /
            // busy Button). The spinner below stays decorative, so the header's
            // accessible name remains just the label.
            accessibilityState={column.loading ? { busy: true } : undefined}
            aria-busy={column.loading || undefined}
            {...webProps}
            {...nativeContextProps}
            style={[
              styles.headerCell,
              columnLayoutStyle(column),
              align === "right" ? { justifyContent: "flex-end" } : null,
            ]}
          >
            {column.loading ? (
              // Same footprint as the field icon (its box is `size` px square),
              // so toggling `loading` swaps in place with no layout shift. Muted
              // accent keeps it quiet header chrome, not a bright alert. Hidden
              // from assistive tech on both platforms — like the decorative icon
              // it replaces — since the header's busy state conveys the loading
              // (a named spinner here would double the header's spoken label).
              <View
                accessibilityElementsHidden
                aria-hidden
                importantForAccessibility="no-hide-descendants"
              >
                <Spinner color={theme.colors.muted} size={iconSize - 1} />
              </View>
            ) : (
              <Icon color={theme.colors.muted} size={iconSize - 1} />
            )}
            <DataGridClippedText style={styles.headerLabel} surface="headers">
              {column.label}
            </DataGridClippedText>
            {glyph ? <Text style={styles.headerSort}>{glyph}</Text> : null}
            {renderColumnMenuButton?.(column)}
            {canResize ? (
              <DataGridResizeHandle
                active={resizingColumnId === column.id}
                column={column as ResolvedColumn}
                disableFocusRing={disableFocusRing}
                onBeginResize={onBeginColumnResize}
                onResizeStep={onColumnResizeStep}
                styles={styles}
              />
            ) : null}
          </HeaderCell>
        );
      })}
      {renderAddColumn?.()}
    </View>
  );
}
