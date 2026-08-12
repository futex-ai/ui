/** The key for a continuous scale: a gradient strip with labelled ends. */
import { Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

export type ScaleLegendProps = {
  /** Ordered ramp steps, light to dark. */
  ramp: readonly string[];
  minLabel: string;
  maxLabel: string;
  /** Names the quantity, e.g. "Sessions". */
  title?: string;
  testID?: string;
};

/**
 * A sequential or diverging key.
 *
 * A continuous scale has no legend entries to match against, so the strip plus
 * its two end labels is the only way to read a value back out of a colour —
 * which is why a heatmap without one is unreadable rather than merely terse.
 * Rendered as discrete swatches rather than a CSS gradient so it looks
 * identical on native and web.
 */
export function ScaleLegend({
  ramp,
  minLabel,
  maxLabel,
  title,
  testID,
}: ScaleLegendProps) {
  const theme = useSharedUiTheme();
  const label = {
    color: theme.charts.label,
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontVariant: ["tabular-nums" as const],
  };
  return (
    <View
      accessibilityLabel={`${title ? `${title}. ` : ""}Scale from ${minLabel} to ${maxLabel}`}
      role="group"
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        paddingTop: 10,
      }}
      testID={testID}
    >
      <Text style={label}>{minLabel}</Text>
      {/* The swatches carry no information the two labels do not, so they are
          hidden from assistive technology rather than announced as N nodes. */}
      <View aria-hidden style={{ flexDirection: "row" }}>
        {ramp.map((step, index) => (
          <View
            key={`${step}-${index}`}
            style={{
              backgroundColor: step,
              borderBottomRightRadius: index === ramp.length - 1 ? 2 : 0,
              borderTopRightRadius: index === ramp.length - 1 ? 2 : 0,
              borderBottomLeftRadius: index === 0 ? 2 : 0,
              borderTopLeftRadius: index === 0 ? 2 : 0,
              height: 10,
              width: 14,
            }}
          />
        ))}
      </View>
      <Text style={label}>{maxLabel}</Text>
    </View>
  );
}
