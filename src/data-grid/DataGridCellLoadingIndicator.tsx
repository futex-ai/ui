/** Inline loading content shared by grid cells and responsive cards. */
import type { ReactNode } from "react";
import { View } from "react-native";

import { Spinner } from "../spinner";
import type { SharedUiTheme } from "../theme";

import type { DataGridStyles } from "./dataGridStyles";

/** Keep a cell's current value visible beside its compact loading indicator. */
export function DataGridCellLoadingContent({
  children,
  size,
  styles,
  theme,
}: {
  children: ReactNode;
  size: number;
  styles: DataGridStyles;
  theme: SharedUiTheme;
}) {
  return (
    <View
      style={styles.cellLoadingContent}
      testID="data-grid-cell-loading-content"
    >
      <View style={styles.cellLoadingValue}>{children}</View>
      <DataGridCellLoadingIndicator size={size} theme={theme} />
    </View>
  );
}

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
