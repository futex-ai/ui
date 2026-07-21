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
import { PressableHoverState, useFocusRing } from "../focusRing";
import { SkeletonBar, SkeletonPulseProvider } from "../skeleton";
import { useSharedUiTheme } from "../theme";

import { createTableStyles, type TableStyles } from "./tableStyles";

/**
 * Placeholder bar widths cycled across a skeleton row's cells (by row + column
 * index) so the loading table reads as varied content rather than a rigid grid.
 */
const SKELETON_BAR_WIDTHS = ["72%", "56%", "84%", "64%"] as const;

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
  /**
   * Disable the shared focus glow on pressable rows. They then fall back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Hide the header row, e.g. a continuation table stacked under another. */
  headless?: boolean;
  /**
   * Show placeholder skeleton rows instead of `rows` while the data loads. The
   * table announces `aria-busy` and the placeholder rows are non-interactive and
   * hidden from assistive technology.
   */
  loading?: boolean;
  /** Number of skeleton rows to render while `loading`. Defaults to 6. */
  loadingRowCount?: number;
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
  /**
   * Per-row container style, merged over the base row style — use it to shade
   * grouped rows such as a balance sheet's section-header and subtotal bands.
   * Returning a falsy value leaves the row at its default. For pressable rows
   * the interactive states (hover, pressed, focus) still layer on top.
   */
  rowStyle?: (row: Row, index: number) => StyleProp<ViewStyle>;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the table container (e.g. a card border + radius). */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
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
  disableFocusRing = false,
  headless = false,
  loading = false,
  loadingRowCount = 6,
  onRowPress,
  rowDisabled,
  rowKey,
  rowLabel,
  rows,
  rowStyle,
  size = "md",
  style,
  testID,
}: TableProps<Row>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTableStyles(theme, size), [theme, size]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      // While loading, announce the table as busy (matching the Spinner / busy
      // Button) so assistive tech says "loading" rather than reading the empty
      // placeholder rows.
      accessibilityState={loading ? { busy: true } : undefined}
      aria-busy={loading || undefined}
      style={[styles.table, style]}
      testID={testID}
    >
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
      {loading ? (
        <SkeletonPulseProvider>
          {Array.from({ length: loadingRowCount }).map((_, index) => {
            const last = index === loadingRowCount - 1;
            return (
              // The placeholder row is decorative; the busy table announces the
              // loading state, so keep the row off the accessibility tree.
              <View
                aria-hidden
                key={`skeleton-${index}`}
                style={[styles.row, last ? styles.rowLast : null]}
              >
                {columns.map((col, colIndex) => (
                  <View
                    key={col.key}
                    style={[colStyle(col), cellAlignStyle(col.align, styles)]}
                  >
                    <SkeletonBar
                      width={
                        SKELETON_BAR_WIDTHS[
                          (index + colIndex) % SKELETON_BAR_WIDTHS.length
                        ]
                      }
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </SkeletonPulseProvider>
      ) : (
        rows.map((row, index) => {
          const last = index === rows.length - 1;
          const children = renderCells(row, columns, cell, styles);
          if (onRowPress) {
            return (
              <PressableTableRow
                customStyle={rowStyle?.(row, index)}
                disabled={rowDisabled?.(row, index) ?? false}
                disableFocusRing={disableFocusRing}
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
              style={[
                styles.row,
                last ? styles.rowLast : null,
                rowStyle?.(row, index),
              ]}
            >
              {children}
            </View>
          );
        })
      )}
    </View>
  );
}

/** Default text treatment for a body cell — `muted` greys it, `numeric` gives it tabular figures. */
export type TableCellProps = {
  /** Override the text alignment within the cell. */
  align?: TableColumnAlign;
  /** Render the text bold, e.g. a subtotal / total label. (`numeric` is already bold.) */
  bold?: boolean;
  children: ReactNode;
  /** Render as secondary / muted text. */
  muted?: boolean;
  /** Tabular-figure numeric styling (bold, right-aligned), for amounts. */
  numeric?: boolean;
  /** Match the type scale to the table's `size`. Defaults to `md`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
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
  bold,
  children,
  muted,
  numeric,
  size = "md",
  testID,
}: TableCellProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTableStyles(theme, size), [theme, size]);
  return (
    <Text
      style={[
        styles.td,
        bold ? styles.tdBold : null,
        muted ? styles.tdMuted : null,
        numeric ? styles.tdNumeric : null,
        align === "left" ? styles.tdLeft : null,
        align === "center" ? styles.tdCenter : null,
        align === "right" ? styles.tdRight : null,
      ]}
      testID={testID}
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
  customStyle,
  disabled,
  disableFocusRing,
  label,
  last,
  onPress,
  styles,
}: {
  children: ReactNode;
  customStyle?: StyleProp<ViewStyle>;
  disabled: boolean;
  disableFocusRing: boolean;
  label?: string;
  last: boolean;
  onPress: () => void;
  styles: TableStyles;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
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
        customStyle,
        hovered && !disabled ? styles.rowHover : null,
        pressed && !disabled ? styles.rowPressed : null,
        focus.focused && focus.ringEnabled ? styles.rowFocused : null,
        disabled ? styles.rowDisabled : null,
        focus.webOutlineReset,
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
