/**
 * The pieces that both selectors share: the trigger chevron size, the trigger's
 * accessible label, and the label row with its optional info button.
 */
import { IconComponent } from "../primitives/icons";
import { Text, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { inputIconSize, LabelInfo } from "../input";
import { touchControlMetrics } from "../touchMetrics";

import type { DropdownSelectorStyles } from "./dropdownSelectorStyles";
import type { SelectorVariant } from "./dropdownSelectorTypes";

/**
 * The chevron of a trigger: the icon of the `field` size, the touch icon of a
 * `field` on a touch surface, or the 13px glyph of the bespoke variants.
 */
export function selectorChevronSize(
  variant: SelectorVariant,
  size: ControlSize,
  touch: boolean,
) {
  if (touch && variant === "field") return touchControlMetrics.iconSize;
  return variant === "field" ? inputIconSize(size) : 13;
}

export function selectorAccessibleLabel(
  label: string | undefined,
  value: string,
) {
  return label ? `${label}, ${value}` : value;
}

export function SelectorLabel({
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  required,
  styles,
}: {
  label: string;
  labelInfo?: string;
  labelInfoIcon?: IconComponent;
  labelInfoLabel?: string;
  required: boolean;
  styles: DropdownSelectorStyles;
}) {
  const labelInfoName = labelInfoLabel ?? `More information about ${label}`;
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {labelInfo ? (
        <LabelInfo
          accessibilityLabel={labelInfoName}
          icon={labelInfoIcon}
          info={labelInfo}
        />
      ) : null}
    </View>
  );
}
