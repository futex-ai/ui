/** Shared contract and surface chrome for portal-backed dropdown menus. */
import { useMemo } from "react";
import type { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { DROPDOWN_LAYERS } from "./dropdownLayers";
import type {
  DropdownPlacement,
  DropdownPlacementOptions,
} from "./dropdownGeometry";
import type { DropdownHoverProps } from "./useDropdownHover";

/** Props accepted by both the native and web `DropdownPortal` implementations. */
export type DropdownPortalProps = DropdownPlacementOptions & {
  anchorRef: RefObject<View | null>;
  children: (placement: DropdownPlacement) => ReactNode;
  /** Let the surface grow to its intrinsic content width between its width bounds. */
  fitContentWidth?: boolean;
  onClose: () => void;
  open: boolean;
  surfaceHoverProps?: DropdownHoverProps;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  zIndex?: number;
};

/** Absolute-position rect that pins a dropdown surface to its placement. */
export function dropdownSurfaceRect(
  placement: DropdownPlacement,
  fitContentWidth = false,
) {
  const position = {
    bottom: placement.bottom,
    left: placement.left,
    maxHeight: placement.maxHeight,
    top: placement.top,
  } as const;
  return fitContentWidth
    ? position
    : ({ ...position, width: placement.width } as const);
}

/** Shared dropdown surface chrome used by the portal and combobox paths. */
export function useDropdownSurfaceStyles() {
  const theme = useSharedUiTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        surface: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          boxShadow: "0 14px 40px rgba(20, 28, 22, 0.16)",
          overflow: "hidden",
          padding: 6,
          position: "absolute",
          zIndex: DROPDOWN_LAYERS.surface,
        },
      }),
    [theme],
  );
}
