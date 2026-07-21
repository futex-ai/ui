/** The trailing "+ New record" row at the bottom of the grid body. */
import { Plus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { gridcellRole } from "./dataGridLayout";
import type { DataGridStyles } from "./dataGridStyles";

export function DataGridAddRow({
  onPress,
  styles,
  theme,
  iconSize,
}: {
  onPress: () => void;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  iconSize: number;
}) {
  // Wrapped in row > gridcell so the button is valid inside a grid (a button may
  // not be a direct child of `rowgroup`/`row`). The opaque `surface` keeps the
  // row on white above a bounded grid's muted grey empty zone.
  return (
    <View role="row" style={{ backgroundColor: theme.colors.surface }}>
      <View {...gridcellRole()} style={{ flex: 1 }}>
        <Pressable
          accessibilityLabel="New record"
          accessibilityRole="button"
          onPress={onPress}
          style={({ hovered }: PressableHoverState) => [
            styles.addRow,
            hovered ? styles.addRowHover : null,
            hideWebOutlineView,
          ]}
        >
          <Plus color={theme.colors.muted} size={iconSize} />
          <Text style={styles.addRowText}>New record</Text>
        </Pressable>
      </View>
    </View>
  );
}
