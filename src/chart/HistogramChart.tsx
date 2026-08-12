/** Distribution: how a single measure is spread, not what it totals. */
import { useMemo } from "react";

import { BarChart } from "./BarChart";
import { binValues } from "./series/stack";
import { compactNumber } from "./scale/ticks";
import type { ChartCommonProps } from "./types";

export type HistogramChartProps = Omit<
  ChartCommonProps,
  "categories" | "series" | "xScale"
> & {
  /** The raw observations. `null` entries are ignored, not binned as zero. */
  values: readonly (number | null)[];
  /** Number of equal-width bins. Defaults to Sturges' rule. */
  binCount?: number;
  /** Formats the bin bounds on the x axis. */
  binLabelFormat?: (start: number, end: number) => string;
};

/**
 * A histogram.
 *
 * Bars touch conceptually — the bins are contiguous — but they still keep the
 * family's 2px surface gap, because a solid block of ink reads as one mark
 * rather than as a distribution. It renders through `BarChart` so the hit
 * targets, keyboard model and table view come for free; only the binning is
 * new.
 */
export function HistogramChart({
  values,
  binCount,
  binLabelFormat,
  title,
  caption,
  testID,
  ...rest
}: HistogramChartProps) {
  const bins = useMemo(() => {
    // Sturges' rule: a sane default that scales with the sample rather than
    // fixing an arbitrary 10.
    const finite = values.filter(
      (v): v is number => v != null && Number.isFinite(v),
    );
    const suggested =
      finite.length === 0
        ? 1
        : Math.max(1, Math.ceil(Math.log2(finite.length) + 1));
    return binValues(values, binCount ?? suggested);
  }, [values, binCount]);

  const formatBin =
    binLabelFormat ??
    ((start: number, end: number) =>
      start === end
        ? compactNumber(start)
        : `${compactNumber(start)}–${compactNumber(end)}`);

  return (
    <BarChart
      {...rest}
      caption={caption}
      categories={bins.map((bin) => formatBin(bin.start, bin.end))}
      series={[
        {
          id: "count",
          label: "Count",
          data: bins.map((bin) => bin.count),
        },
      ]}
      title={title}
      // Forwarded explicitly rather than through the spread, so the testID
      // contract is visible here and the repo's forwarding guard can see it.
      testID={testID}
      // One series: the title says what is plotted, so a one-swatch legend
      // would only restate it.
      showLegend={false}
    />
  );
}
