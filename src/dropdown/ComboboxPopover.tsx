/** Native-safe fallback for input-backed combobox popovers. */
import { useMemo } from "react";
import { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  DropdownPlacement,
  DropdownPlacementOptions,
} from "./dropdownGeometry";
import { DROPDOWN_LAYERS } from "./dropdownLayers";

type ComboboxPopoverProps = DropdownPlacementOptions & {
  anchorRef?: RefObject<View | null>;
  children: (placement: DropdownPlacement) => ReactNode;
  onClose: () => void;
  open: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function ComboboxPopover({
  children,
  maxHeight = 280,
  maxWidth,
  minWidth = 220,
  open,
  testID,
}: ComboboxPopoverProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        surface: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          boxShadow: "0 14px 40px rgba(20, 28, 22, 0.16)",
          left: 0,
          overflow: "hidden",
          padding: 6,
          position: "absolute",
          top: "100%",
          zIndex: DROPDOWN_LAYERS.surface,
        },
      }),
    [theme],
  );
  if (!open) {
    return null;
  }
  const placement: DropdownPlacement = {
    left: 0,
    maxHeight,
    side: "bottom",
    top: 0,
    width: minWidth,
  };
  return (
    <View
      style={[styles.surface, { maxHeight, maxWidth, minWidth }]}
      testID={testID}
    >
      {children(placement)}
    </View>
  );
}
