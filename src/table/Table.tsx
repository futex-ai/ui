/**
 * Lightweight data table with optional headers and optionally pressable rows.
 *
 * React Native has no `<table>`, so this renders flex rows that share column
 * definitions to keep the header and body cells aligned (the same approach as
 * the accounting data table it was adapted from). Cell content is supplied by a
 * `cell` render callback, so a column can hold plain text (via {@link TableCell}),
 * tags, buttons, or any node. Pass `onRowPress` to make every row a pressable
 * button with the shared hover / focus-ring treatment.
 */
import { ReactNode, useMemo } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createTableStyles, type TableStyles } from "./tableStyles";

export type TableColumnAlign = "center" | "left" | "right";

export type TableColumn = {
  /** Horizontal alignment of the column's header and cells. Defaults to `left`. */
  align?: TableColumnAlign;
  /** Flex grow factor when the column has no fixed `width`. Defaults to 1. */
  flex?: number;
  /** Stable identifier passed to `cell` and used as the cell's React key. */
  key: string;
  /** Header text. Columns without a label render an empty header cell. */
  label?: string;
  /** Fixed column width in px. Takes precedence over `flex`. */
  width?: number;
};

export type TableProps<Row> = {
  /** Accessible label for the whole table. */
  accessibilityLabel?: string;
  /** Renders the content for a given row and column key. */
  cell: (row: Row, columnKey: string) => ReactNode;
  /** Column definitions controlling layout, alignment, and the header labels. */
  columns: TableColumn[];
  /** Hide the header row, e.g. a continuation table stacked under another. */
  headless?: boolean;
  /** Press handler per row. Providing it makes every row a pressable button. */
  onRowPress?: (row: Row, index: number) => void;
  /** Mark a specific row as non-pressable (only relevant with `onRowPress`). */
  rowDisabled?: (row: Row, index: number) => boolean;
  /** Stable React key for a row. */
  rowKey: (row: Row, index: number) => string;
  /** Accessible label for a pressable row, e.g. `Open invoice INV-001`. */
  rowLabel?: (row: Row, index: number) => string;
  /** The data rows. */
  rows: Row[];
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the table container (e.g. a card border + radius). */
  style?: StyleProp<ViewStyle>;
};

/**
 * The shared data table. Headers are optional (`headless`), columns size with
 * `flex` or a fixed `width` and align left / center / right, and rows become
 * pressable buttons — with hover, the sage focus ring, and a disabled state —
 * when `onRowPress` is supplied. Plain (non-pressable) rows render as static
 * rows. Cell typography is handled by the consumer's `cell` callback; use
 * {@link TableCell} for the default text treatment.
 */
export function Table<Row>({
  accessibilityLabel,
  cell,
  columns,
  headless = false,
  onRowPress,
  rowDisabled,
  rowKey,
  rowLabel,
  rows,
  size = "md",
  style,
}: TableProps<Row>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTableStyles(theme, size), [theme, size]);

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.table, style]}>
      {headless ? null : (
        <View style={styles.headRow}>
          {columns.map((col) => (
            <View
              key={col.key}
              style={[colStyle(col), cellAlignStyle(col.align, styles)]}
            >
              <Text
                style={[styles.th, headerTextAlignStyle(col.align, styles)]}
              >
                {col.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      {rows.map((row, index) => {
        const last = index === rows.length - 1;
        const children = renderCells(row, columns, cell, styles);
        if (onRowPress) {
          return (
            <PressableTableRow
              disabled={rowDisabled?.(row, index) ?? false}
              key={rowKey(row, index)}
              label={rowLabel?.(row, index)}
              last={last}
              onPress={() => onRowPress(row, index)}
              styles={styles}
            >
              {children}
            </PressableTableRow>
          );
        }
        return (
          <View
            key={rowKey(row, index)}
            style={[styles.row, last ? styles.rowLast : null]}
          >
            {children}
          </View>
        );
      })}
    </View>
  );
}

/** Default text treatment for a body cell — `muted` greys it, `numeric` gives it tabular figures. */
export type TableCellProps = {
  /** Override the text alignment within the cell. */
  align?: TableColumnAlign;
  children: ReactNode;
  /** Render as secondary / muted text. */
  muted?: boolean;
  /** Tabular-figure numeric styling (bold, right-aligned), for amounts. */
  numeric?: boolean;
  /** Match the type scale to the table's `size`. Defaults to `md`. */
  size?: ControlSize;
};

/**
 * Plain body-cell text with the table's default typography. A convenience for
 * the common text cell — `cell` can return any node, but most cells are text,
 * and this keeps their colour, size, and (for amounts) tabular figures
 * consistent. `numeric` right-aligns; pair it with a `align: "right"` column so
 * the cell box hugs the right edge too.
 */
export function TableCell({
  align,
  children,
  muted,
  numeric,
  size = "md",
}: TableCellProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTableStyles(theme, size), [theme, size]);
  return (
    <Text
      style={[
        styles.td,
        muted ? styles.tdMuted : null,
        numeric ? styles.tdNumeric : null,
        align === "left" ? styles.tdLeft : null,
        align === "center" ? styles.tdCenter : null,
        align === "right" ? styles.tdRight : null,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * A pressable row, rendered when the table has an `onRowPress`. Mirrors the
 * shared button: `button` semantics, a hover wash, the sage focus ring (an inset
 * box-shadow so it shows on the bottom-bordered row), a pressed/disabled state,
 * and the hidden web outline. Keyboard activation (Enter / Space) comes from
 * react-native-web's Pressable for the `button` role, so no manual key handler
 * is needed.
 */
function PressableTableRow({
  children,
  disabled,
  label,
  last,
  onPress,
  styles,
}: {
  children: ReactNode;
  disabled: boolean;
  label?: string;
  last: boolean;
  onPress: () => void;
  styles: TableStyles;
}) {
  const focus = useFocusRing();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ hovered, pressed }: PressableHoverState) => [
        styles.row,
        styles.rowPressable,
        last ? styles.rowLast : null,
        hovered && !disabled ? styles.rowHover : null,
        pressed && !disabled ? styles.rowPressed : null,
        focus.focused ? styles.rowFocused : null,
        disabled ? styles.rowDisabled : null,
        hideWebOutlineView,
      ]}
    >
      {children}
    </Pressable>
  );
}

function renderCells<Row>(
  row: Row,
  columns: TableColumn[],
  cell: (row: Row, columnKey: string) => ReactNode,
  styles: TableStyles,
) {
  return columns.map((col) => (
    <View
      key={col.key}
      style={[colStyle(col), cellAlignStyle(col.align, styles)]}
    >
      {cell(row, col.key)}
    </View>
  ));
}

/** A fixed `width` column wins; otherwise the column shares space by `flex`. */
function colStyle(col: TableColumn): ViewStyle {
  return col.width !== undefined
    ? { width: col.width }
    : { flex: col.flex ?? 1, minWidth: 0 };
}

/** Aligns a cell box's content (right / center) to match the column. */
function cellAlignStyle(
  align: TableColumnAlign | undefined,
  styles: TableStyles,
) {
  if (align === "right") return styles.cellRight;
  if (align === "center") return styles.cellCenter;
  return null;
}

/** Aligns the header label text to match the column. */
function headerTextAlignStyle(
  align: TableColumnAlign | undefined,
  styles: TableStyles,
) {
  if (align === "right") return styles.thRight;
  if (align === "center") return styles.thCenter;
  return null;
}
