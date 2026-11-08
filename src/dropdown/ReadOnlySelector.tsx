/** A selector's trigger as static text, for values that cannot change. */
import { ChevronDown } from "../primitives/icons";
import { useMemo } from "react";
import { Text, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";
import { useTouchSurface } from "../touchSurface";

import {
  selectorAccessibleLabel,
  selectorChevronSize,
  SelectorLabel,
} from "./dropdownSelectorParts";
import {
  createDropdownSelectorStyles,
  createTouchDropdownSelectorStyles,
  triggerStyle,
  valueStyle,
} from "./dropdownSelectorStyles";
import type { SelectorVariant } from "./dropdownSelectorTypes";

export function ReadOnlySelector({
  label,
  required = false,
  size = "md",
  testID,
  value,
  variant = "field",
}: {
  label?: string;
  required?: boolean;
  /** Control density of the default `field` variant: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  value: string;
  variant?: SelectorVariant;
}) {
  const theme = useSharedUiTheme();
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      touch
        ? createTouchDropdownSelectorStyles(theme)
        : createDropdownSelectorStyles(theme, size),
    [theme, size, touch],
  );
  const accessibleLabel = selectorAccessibleLabel(label, value);
  return (
    <View style={label ? styles.field : null} testID={testID}>
      {label ? (
        <SelectorLabel label={label} required={required} styles={styles} />
      ) : null}
      <View
        accessibilityLabel={accessibleLabel}
        style={[triggerStyle(styles, variant), styles.readOnly]}
      >
        <Text numberOfLines={1} style={valueStyle(styles, variant)}>
          {value}
        </Text>
        <ChevronDown
          color={theme.colors.muted}
          size={selectorChevronSize(variant, size, touch)}
        />
      </View>
    </View>
  );
}
