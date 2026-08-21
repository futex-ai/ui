/** The dependable identity channel: a legend, present whenever there are ≥2 series. */
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { checkedAria } from "./chartAria";
import { CHART_MARKS } from "./chartMarks";

/** Legend keys mirror the mark: a rect for fills, a line for lines. */
export type LegendKeyShape = "rect" | "line";

export type ChartLegendEntry = {
  id: string;
  label: string;
  color: string;
};

export type ChartLegendProps = {
  entries: readonly ChartLegendEntry[];
  /** Ids currently hidden; those entries render dimmed. */
  hidden?: ReadonlySet<string>;
  /** Supplying this makes each entry a toggle. */
  onToggle?: (id: string) => void;
  keyShape?: LegendKeyShape;
  disableFocusRing?: boolean;
  testID?: string;
};

/**
 * A legend, always present for two or more series.
 *
 * It is the reliable identity channel — direct labels supplement it, they do
 * not replace it, and a reader should never have to match colours by eye. The
 * label text wears theme ink rather than the series colour: a light categorical
 * hue is illegible as text, so the coloured key beside the label carries
 * identity instead.
 *
 * A single series gets no legend from the caller — the title already names what
 * is plotted, and a one-swatch box just restates it.
 */
export function ChartLegend({
  entries,
  hidden,
  onToggle,
  keyShape = "rect",
  disableFocusRing = false,
  testID,
}: ChartLegendProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => ({
      row: {
        alignItems: "center" as const,
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: 14,
        paddingTop: 8,
      },
      entry: {
        alignItems: "center" as const,
        flexDirection: "row" as const,
        gap: 6,
      },
      label: {
        color: theme.colors.muted,
        fontFamily: theme.fonts.sans,
        fontSize: 12,
      },
    }),
    [theme],
  );

  return (
    <View role="list" style={styles.row} testID={testID}>
      {entries.map((entry) => (
        <LegendEntry
          disableFocusRing={disableFocusRing}
          entry={entry}
          hidden={hidden?.has(entry.id) ?? false}
          key={entry.id}
          keyShape={keyShape}
          labelStyle={styles.label}
          onToggle={onToggle}
          rowStyle={styles.entry}
        />
      ))}
    </View>
  );
}

function LegendEntry({
  disableFocusRing,
  entry,
  hidden,
  keyShape,
  labelStyle,
  onToggle,
  rowStyle,
}: {
  disableFocusRing: boolean;
  entry: ChartLegendEntry;
  hidden: boolean;
  keyShape: LegendKeyShape;
  labelStyle: object;
  onToggle?: (id: string) => void;
  rowStyle: object;
}) {
  const theme = useSharedUiTheme();
  const focus = useFocusRing({ disabled: disableFocusRing });

  const swatch =
    keyShape === "line" ? (
      <View
        style={{
          backgroundColor: entry.color,
          borderRadius: CHART_MARKS.lineWidth,
          height: CHART_MARKS.lineWidth,
          width: 14,
        }}
      />
    ) : (
      <View
        style={{
          backgroundColor: entry.color,
          borderRadius: 3,
          height: 10,
          width: 10,
        }}
      />
    );

  const body = (
    <>
      {swatch}
      <Text style={labelStyle}>{entry.label}</Text>
    </>
  );

  if (!onToggle) {
    return (
      <View role="listitem" style={rowStyle}>
        {body}
      </View>
    );
  }

  // A `listitem` wrapper holds the switch so the structure stays valid ARIA
  // (`list` > `listitem` > `switch`) instead of putting a switch directly
  // inside a list, which fails `aria-required-children`. The wrapper is purely
  // structural; the switch keeps the label, the state and the focus. Same
  // shape the `Heatmap` uses for `gridcell` > `button`.
  return (
    <View role="listitem">
      <Pressable
        {...checkedAria(!hidden)}
        accessibilityLabel={`${entry.label}${hidden ? ", hidden" : ""}`}
        accessibilityRole="switch"
        // `checked` reports visibility, so a screen reader announces the state
        // the toggle controls rather than only its label.
        accessibilityState={{ checked: !hidden }}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={() => onToggle(entry.id)}
        style={[
          rowStyle,
          // Hidden series dim rather than disappear, so the toggle that brings
          // them back is still visible and still in the tab order.
          hidden ? { opacity: 0.4 } : null,
          focus.webOutlineReset,
          focus.focusVisible && focus.ringEnabled
            ? {
                backgroundColor: theme.colors.soft,
                borderRadius: theme.radii.sm,
              }
            : null,
        ]}
      >
        {body}
      </Pressable>
    </View>
  );
}
