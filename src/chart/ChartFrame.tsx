/**
 * The container every chart mounts inside: measurement, title, empty state,
 * the loading hold, and the table-view toggle.
 */
import { type ReactNode, useCallback, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { chartLayout, type ChartLayout } from "./chartLayout";
import { expandedAria } from "./chartAria";
import { CHART_LOADING_OPACITY } from "./chartMarks";
import { createChartStyles, type ChartStyles } from "./chartStyles";

export type ChartFrameProps = {
  /** Total frame height, inclusive of the axis, legend and title bands. */
  height?: number;
  /** Width used before `onLayout` reports the real one (SSR and tests). */
  defaultWidth?: number;
  title?: string;
  caption?: string;
  /** Hold the previous render at reduced opacity while new data arrives. */
  loading?: boolean;
  /** Shown instead of the plot when there is nothing to draw. */
  emptyState?: ReactNode;
  /** Whether the chart has any data at all. */
  isEmpty?: boolean;
  /** Rendered below the plot — the legend row. */
  legend?: ReactNode;
  /** Height the legend occupies, subtracted from the plot. */
  legendHeight?: number;
  /** The accessible table twin, revealed by the toggle. */
  tableView?: ReactNode;
  /** Hide the table-view toggle (a bare sparkline has no plot to tabulate). */
  hideTableToggle?: boolean;
  xAxisHeight?: number;
  yAxisWidth?: number;
  /** Receives the resolved layout and paints the marks and axes. */
  children: (layout: ChartLayout, styles: ChartStyles) => ReactNode;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const TITLE_BLOCK_HEIGHT = 22;
const CAPTION_BLOCK_HEIGHT = 18;

/**
 * Measures its container and hands the derived plot rect to `children`.
 *
 * Two behaviours are deliberate and easy to get wrong:
 *
 * - **The first render does not jump.** `onLayout` only reports a width after
 *   the first layout pass, so the chrome renders immediately at the declared
 *   height while the marks are held at opacity 0 — mounted, not unmounted, so
 *   there is no reflow when they appear.
 * - **Refetch holds the frame.** `loading` dims the previous render rather than
 *   swapping in a skeleton, so the numbers refresh without a flash or a jump.
 */
export function ChartFrame({
  height = 240,
  defaultWidth = 0,
  title,
  caption,
  loading = false,
  emptyState,
  isEmpty = false,
  legend,
  legendHeight = 0,
  tableView,
  hideTableToggle = false,
  xAxisHeight,
  yAxisWidth,
  children,
  accessibilityLabel,
  disableFocusRing = false,
  style,
  testID,
}: ChartFrameProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createChartStyles(theme), [theme]);
  const [measuredWidth, setMeasuredWidth] = useState(defaultWidth);
  const [showTable, setShowTable] = useState(false);
  const focus = useFocusRing({ disabled: disableFocusRing });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setMeasuredWidth((current) =>
      Math.abs(current - next) < 0.5 ? current : next,
    );
  }, []);

  const titleHeight =
    (title ? TITLE_BLOCK_HEIGHT : 0) + (caption ? CAPTION_BLOCK_HEIGHT : 0);

  const layout = useMemo(
    () =>
      chartLayout({
        width: measuredWidth,
        height,
        titleHeight: 0,
        legendHeight,
        xAxisHeight,
        yAxisWidth,
      }),
    [measuredWidth, height, legendHeight, xAxisHeight, yAxisWidth],
  );

  const plotHeight = Math.max(0, height - titleHeight);
  const measured = measuredWidth > 0;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, style]}
      testID={testID}
    >
      {title || caption ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
      ) : null}

      {isEmpty ? (
        <View style={[styles.empty, { height: plotHeight }]}>
          {emptyState ?? <Text style={styles.emptyText}>No data</Text>}
        </View>
      ) : (
        <View
          style={[
            styles.plotArea,
            { height: plotHeight },
            loading ? { opacity: CHART_LOADING_OPACITY } : null,
          ]}
        >
          {/* Marks are mounted but transparent until the width is known, so
              revealing them costs no layout. */}
          <View style={{ opacity: measured ? 1 : 0 }}>
            {children(layout, styles)}
          </View>
        </View>
      )}

      {legend}

      {tableView && !hideTableToggle ? (
        <View style={styles.footer}>
          <Pressable
            {...expandedAria(showTable)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showTable }}
            onBlur={focus.onBlur}
            onFocus={focus.onFocus}
            onPress={() => setShowTable((value) => !value)}
            style={[
              styles.toggle,
              focus.webOutlineReset,
              focus.focused && focus.ringEnabled ? styles.toggleFocused : null,
            ]}
          >
            <Text style={styles.toggleText}>
              {showTable ? "Hide data table" : "Show data table"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showTable && tableView ? (
        <View style={styles.tableWrap}>{tableView}</View>
      ) : null}
    </View>
  );
}
