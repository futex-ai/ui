/** The accessible table twin every chart ships alongside its marks. */
import { useMemo } from "react";

import { Table, type TableColumn } from "../table";

import type { NormalizedSeries } from "./series/stack";

export type ChartTableViewProps = {
  /** Column headers of the chart's x axis. */
  categories: readonly (string | number)[];
  /** The same series the marks render, already normalized. */
  series: readonly NormalizedSeries[];
  /** Header for the leading category column. Defaults to "Category". */
  categoryLabel?: string;
  /** Formats each value; defaults to the number's own string form. */
  valueFormat?: (value: number) => string;
  /** Accessible label for the table. */
  accessibilityLabel?: string;
  testID?: string;
};

type TableRow = {
  key: string;
  category: string;
  values: (number | null)[];
};

/**
 * Renders a chart's data as a real table.
 *
 * This is not a fallback — it is the WCAG-clean equivalent of the chart, and
 * it is what lets tooltips *enhance* rather than gate: every value a tooltip
 * shows is reachable here without hovering anything. It also carries the
 * relief the palette's three sub-3:1 light-mode slots require.
 *
 * Series run across the columns rather than down the rows so the shape matches
 * the chart: one row per category, exactly as the x axis reads.
 */
export function ChartTableView({
  categories,
  series,
  categoryLabel = "Category",
  valueFormat,
  accessibilityLabel,
  testID,
}: ChartTableViewProps) {
  const columns = useMemo<TableColumn[]>(
    () => [
      { key: "category", label: categoryLabel, flex: 1.4 },
      // Numbers right-align so digits line up down the column.
      ...series.map((entry) => ({
        key: entry.id,
        label: entry.label,
        align: "right" as const,
        flex: 1,
      })),
    ],
    [categoryLabel, series],
  );

  const rows = useMemo<TableRow[]>(
    () =>
      categories.map((category, index) => ({
        key: `${index}-${String(category)}`,
        category: String(category),
        values: series.map((entry) => entry.data[index] ?? null),
      })),
    [categories, series],
  );

  const format = (value: number | null): string => {
    if (value == null) {
      // An em dash reads as "no data" rather than as a measured zero.
      return "—";
    }
    return valueFormat ? valueFormat(value) : String(value);
  };

  return (
    <Table<TableRow>
      accessibilityLabel={accessibilityLabel}
      cell={(row, columnKey) => {
        if (columnKey === "category") {
          return row.category;
        }
        const index = series.findIndex((entry) => entry.id === columnKey);
        return format(index === -1 ? null : row.values[index]);
      }}
      columns={columns}
      rowKey={(row) => row.key}
      rows={rows}
      testID={testID}
    />
  );
}
