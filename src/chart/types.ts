/** The prop contract shared by every chart in the family. */
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type { ChartSeries } from "./series/stack";

export type { ChartSeries };

/** A single datum, as reported to consumer callbacks. */
export type ChartDatumRef = {
  seriesId: string;
  index: number;
  value: number | null;
};

/**
 * How the x axis spaces its categories.
 *
 * `band` gives every category an equal slot. `time` and `linear` space by
 * *value*, which is what an irregular series needs — a month with missing days
 * should show a gap, not compress into even steps.
 */
export type ChartXScale = "band" | "time" | "linear";

export type ChartCommonProps = {
  /** Band labels, or numeric/epoch positions when `xScale` is not `"band"`. */
  categories: readonly (string | number)[];
  /** Defaults to `"band"`. */
  xScale?: ChartXScale;
  series: readonly ChartSeries[];
  title?: string;
  caption?: string;
  /** Total frame height, inclusive of the axis, legend and title bands. */
  height?: number;
  /** Width used before `onLayout` reports the real one (SSR and tests). */
  defaultWidth?: number;
  /** Hold the previous render at reduced opacity while new data arrives. */
  loading?: boolean;
  emptyState?: ReactNode;
  /**
   * Defaults to `true` when `series.length >= 2`. Keyed off the *provided*
   * count, never the visible one: keying off visibility would unmount the
   * legend once isolate left a single series showing, removing the only
   * control that could bring the others back.
   */
  showLegend?: boolean;
  hiddenSeriesIds?: readonly string[];
  onHiddenSeriesIdsChange?: (ids: string[]) => void;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  onDatumPress?: (ref: ChartDatumRef) => void;
  /** Formats values in labels, tooltips and the table view. */
  valueFormat?: (value: number) => string;
  /**
   * Highlight one series and grey the rest. Often the honest answer to "make
   * this chart clearer": when the story is one series, eight identities bury it.
   */
  emphasisId?: string;
  /** Show the accessible data table below the chart. Defaults to `true`. */
  showTableView?: boolean;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Resolve the default number formatter. */
export function resolveValueFormat(
  format: ((value: number) => string) | undefined,
): (value: number) => string {
  return format ?? ((value: number) => String(value));
}
