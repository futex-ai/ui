import type { Meta, StoryObj } from "@storybook/react-vite";
import { View } from "react-native";

import {
  BarChart,
  ChartGrid,
  LineChart,
  compactNumber,
  darkSharedUiTheme,
  sharedExtent,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/SmallMultiples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const REGIONS = [
  { id: "eu", title: "EU", data: [3200, 3800, 4100, 3900, 4800, 5200] },
  { id: "us", title: "US", data: [5400, 5100, 6200, 6800, 7100, 7600] },
  { id: "apac", title: "APAC", data: [1800, 2100, 2600, 3100, 3400, 4200] },
  { id: "latam", title: "LATAM", data: [900, 1100, 1000, 1400, 1600, 1500] },
];

/**
 * Ten series on one plot is spaghetti and past eight the palette runs out
 * anyway. Faceting is the answer — and every panel shares one domain, because
 * facets on independent scales look comparable while being nothing of the sort.
 */
export const Facets: Story = {
  render: () => {
    const domain = sharedExtent(REGIONS);
    return (
      <StorySurface>
        <View style={{ maxWidth: 720, width: "100%" }}>
          <ChartGrid
            accessibilityLabel="Sessions by region"
            facets={REGIONS}
            sharedDomain={domain}
          >
            {(facet) => (
              <LineChart
                accessibilityLabel={`Sessions in ${facet.title}`}
                area
                categories={MONTHS}
                height={150}
                series={[
                  { id: facet.id, label: facet.title, data: facet.data },
                ]}
                showTableView={false}
                valueFormat={compactNumber}
              />
            )}
          </ChartGrid>
        </View>
      </StorySurface>
    );
  },
};

/**
 * Emphasis: one series keeps its hue, the rest recede. Often the honest answer
 * to "make this chart clearer" — when the story is one series, eight
 * identities bury it.
 */
export const Emphasis: Story = {
  render: () => (
    <StorySurface>
      <View style={{ maxWidth: 560, width: "100%" }}>
        <LineChart
          accessibilityLabel="Sessions by region, APAC emphasised"
          categories={MONTHS}
          emphasisId="apac"
          series={REGIONS.map((r) => ({
            id: r.id,
            label: r.title,
            data: r.data,
          }))}
          title="APAC is the story"
          valueFormat={compactNumber}
        />
      </View>
    </StorySurface>
  ),
};

/**
 * The texture channel. Opt-in only — for full colour-vision deficiency,
 * greyscale print or `forced-colors`. Never decorative: a dense angled field
 * is a vestibular risk and reads as noise on a value scale.
 */
export const Texture: Story = {
  render: () => (
    <StorySurface>
      <View style={{ maxWidth: 560, width: "100%" }}>
        <BarChart
          accessibilityLabel="Sessions by region and month, textured"
          categories={MONTHS.slice(0, 4)}
          series={REGIONS.slice(0, 3).map((r) => ({
            id: r.id,
            label: r.title,
            data: r.data.slice(0, 4),
          }))}
          texture
          title="Identity by hatch as well as hue"
          valueFormat={compactNumber}
        />
      </View>
    </StorySurface>
  ),
};

/** Facets on a dark surface. */
export const Dark: Story = {
  render: () => {
    const domain = sharedExtent(REGIONS);
    return (
      <StorySurface theme={darkSharedUiTheme}>
        <View style={{ maxWidth: 720, width: "100%" }}>
          <ChartGrid
            accessibilityLabel="Sessions by region"
            facets={REGIONS}
            sharedDomain={domain}
          >
            {(facet) => (
              <LineChart
                accessibilityLabel={`Sessions in ${facet.title}`}
                area
                categories={MONTHS}
                height={150}
                series={[
                  { id: facet.id, label: facet.title, data: facet.data },
                ]}
                showTableView={false}
                valueFormat={compactNumber}
              />
            )}
          </ChartGrid>
        </View>
      </StorySurface>
    );
  },
};
