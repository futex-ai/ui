/** Decorative loading indicator shared by grid cells and responsive cards. */
import { View } from "react-native";

import { Spinner } from "../spinner";
import type { SharedUiTheme } from "../theme";

/**
 * Compact spinner for a cell whose surrounding container owns the busy state.
 * Keeping the indicator decorative avoids announcing both the cell and a nested
 * progressbar for the same save.
 */
export function DataGridCellLoadingIndicator({
  size,
  theme,
}: {
  size: number;
  theme: SharedUiTheme;
}) {
  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      testID="data-grid-cell-loading-indicator"
    >
      <Spinner color={theme.colors.muted} size={size} />
    </View>
  );
}
