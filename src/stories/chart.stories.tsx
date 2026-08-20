import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "react-native";

import {
  createSharedUiTheme,
  darkSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
  useSharedUiTheme,
  type SharedUiTheme,
  type SharedUiThemeOverrides,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/Palette",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A labelled row of swatches. Text stays in theme ink rather than the swatch
 * colour — a light categorical hue is illegible as text, and identity is meant
 * to come from the mark beside the label, never from colouring the label.
 */
function Swatches({
  colors,
  caption,
  labels,
  title,
}: {
  colors: readonly string[];
  caption?: string;
  labels?: readonly string[];
  title: string;
}) {
  const theme = useSharedUiTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{ color: theme.colors.ink, fontSize: 13, fontWeight: "600" }}
      >
        {title}
      </Text>
      {caption ? (
        <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
          {caption}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {colors.map((color, index) => (
          <View
            key={`${color}-${index}`}
            style={{ alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                backgroundColor: color,
                borderRadius: theme.radii.sm,
                height: 40,
                width: 56,
              }}
            />
            <Text style={{ color: theme.colors.muted, fontSize: 10 }}>
              {labels?.[index] ?? String(index + 1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SERIES_HUES = [
  "blue",
  "green",
  "magenta",
  "yellow",
  "aqua",
  "orange",
  "violet",
  "red",
];

function Palette() {
  const theme = useSharedUiTheme();
  const { charts } = theme;
  return (
    <View style={{ gap: 24, maxWidth: 640 }}>
      <Swatches
        caption="Identity. Assigned in slot order and never cycled — a ninth series folds into Other."
        colors={charts.series}
        labels={SERIES_HUES}
        title="Categorical series"
      />
      <Swatches
        caption="Magnitude. One hue, light to dark; the lightest step may recede toward the surface."
        colors={charts.sequential}
        labels={charts.sequential.map((_, i) => String(100 + i * 50))}
        title="Sequential"
      />
      <Swatches
        caption="Ordered marks — funnel stages, tiers, buckets. The step nearest the surface still clears 2:1."
        colors={charts.ordinal}
        title="Ordinal"
      />
      <Swatches
        caption="Polarity. Warm and cool poles with a neutral grey midpoint, so zero reads as nothing."
        colors={[
          charts.diverging.negative,
          charts.diverging.neutral,
          charts.diverging.positive,
        ]}
        labels={["negative", "neutral", "positive"]}
        title="Diverging"
      />
      <Swatches
        caption="Reserved state — never assigned as a series colour, and always shipped with an icon and a label."
        colors={[
          charts.status.good,
          charts.status.warning,
          charts.status.serious,
          charts.status.critical,
        ]}
        labels={["good", "warning", "serious", "critical"]}
        title="Status"
      />
      <Swatches
        caption="Chart furniture, derived from this theme's own neutrals."
        colors={[charts.grid, charts.axis, charts.label, charts.deemphasis]}
        labels={["grid", "axis", "label", "de-emphasis"]}
        title="Furniture"
      />
    </View>
  );
}

function PaletteFor(theme: SharedUiTheme | SharedUiThemeOverrides) {
  return (
    <StorySurface theme={theme}>
      <Palette />
    </StorySurface>
  );
}

export const Default: Story = {
  render: () => PaletteFor(createSharedUiTheme()),
};

export const Juno: Story = {
  render: () => PaletteFor(junoSharedUiTheme),
};

export const Dark: Story = {
  render: () => PaletteFor(darkSharedUiTheme),
};

export const JunoDark: Story = {
  render: () => PaletteFor(junoDarkSharedUiTheme),
};

/**
 * A brand supplying its own series hues. The furniture still derives from the
 * theme's neutrals, so only the identity slots change.
 */
export const BrandOverride: Story = {
  render: () =>
    PaletteFor(
      createSharedUiTheme({
        charts: {
          series: [
            "#2a78d6",
            "#4a3aa7",
            "#e34948",
            "#eb6834",
            "#008300",
            "#1baf7a",
            "#e87ba4",
            "#eda100",
          ],
        },
      }),
    ),
};
