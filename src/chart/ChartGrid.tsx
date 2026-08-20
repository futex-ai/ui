/**
 * Small multiples: the same chart repeated per facet.
 *
 * The right answer whenever a chart has more series than its form can carry —
 * past the palette's caps, faceting beats inventing hues, and it beats an
 * eight-line spaghetti plot even when the palette could technically manage it.
 */
import { type ReactNode, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useSharedUiTheme } from "../theme";

export { sharedExtent } from "./chartFacets";

export type ChartGridFacet<T> = {
  id: string;
  title: string;
  data: T;
};

export type ChartGridProps<T> = {
  facets: readonly ChartGridFacet<T>[];
  /**
   * Renders one facet. It is handed the **shared** domain so every panel is
   * drawn on the same scale — facets on independent scales look comparable
   * while being nothing of the sort, which is the whole failure mode small
   * multiples exist to avoid.
   */
  children: (
    facet: ChartGridFacet<T>,
    sharedDomain: [number, number],
  ) => ReactNode;
  /** The domain every facet shares. Compute it across all facets. */
  sharedDomain: [number, number];
  /** Minimum panel width before the grid drops to fewer columns. */
  minPanelWidth?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function ChartGrid<T>({
  facets,
  children,
  sharedDomain,
  minPanelWidth = 220,
  accessibilityLabel,
  style,
  testID,
}: ChartGridProps<T>) {
  const theme = useSharedUiTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (Math.abs(next - width) > 0.5) {
      setWidth(next);
    }
  };

  const columns = Math.max(1, Math.floor(width / minPanelWidth) || 1);
  const panelWidth = columns > 0 ? width / columns : width;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      role={accessibilityLabel ? "group" : undefined}
      style={[{ flexDirection: "row", flexWrap: "wrap", width: "100%" }, style]}
      testID={testID}
    >
      {facets.map((facet) => (
        <View
          key={facet.id}
          style={{
            padding: 6,
            width: width > 0 ? panelWidth : "100%",
          }}
        >
          <Text
            style={{
              color: theme.colors.ink,
              fontFamily: theme.fonts.sans,
              fontSize: 12,
              fontWeight: "600",
              paddingBottom: 2,
            }}
          >
            {facet.title}
          </Text>
          {width > 0 ? children(facet, sharedDomain) : null}
        </View>
      ))}
    </View>
  );
}
