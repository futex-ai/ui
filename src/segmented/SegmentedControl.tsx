/** Single-select segmented controls for compact one-of-N choices. */
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { hideWebOutlineView, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  createSegmentedControlStyles,
  type SegmentedControlStyles,
} from "./segmentedControlStyles";

export type SegmentOption<T extends string> = {
  disabled?: boolean;
  label: string;
  value: T;
};

export type SegmentedControlSizing = "content" | "equal";

export type SegmentedControlVariant = "outline" | "pill";

export type SegmentedControlProps<T extends string> = {
  accessibilityLabel?: string;
  disabled?: boolean;
  error?: string | null;
  hint?: string;
  label?: string;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  required?: boolean;
  sizing?: SegmentedControlSizing;
  value: T;
  variant?: SegmentedControlVariant;
  wrap?: boolean;
};

export function SegmentedControl<T extends string>({
  accessibilityLabel,
  disabled = false,
  error,
  hint,
  label,
  onChange,
  options,
  required = false,
  sizing = "equal",
  value,
  variant = "outline",
  wrap = false,
}: SegmentedControlProps<T>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSegmentedControlStyles(theme), [theme]);
  const pill = variant === "pill";
  const invalid = Boolean(error);

  return (
    <View style={styles.field}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        accessibilityHint={error ?? hint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="radiogroup"
        aria-invalid={invalid}
        aria-required={required}
        style={[pill ? styles.track : styles.row, wrap ? styles.rowWrap : null]}
      >
        {options.map((option) => (
          <SegmentedControlButton
            disabled={disabled || option.disabled === true}
            key={option.value}
            onChange={onChange}
            option={option}
            selected={option.value === value}
            sizing={sizing}
            styles={styles}
            variant={variant}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function SegmentedControlButton<T extends string>({
  disabled,
  onChange,
  option,
  selected,
  sizing,
  styles,
  variant,
}: {
  disabled: boolean;
  onChange: (value: T) => void;
  option: SegmentOption<T>;
  selected: boolean;
  sizing: SegmentedControlSizing;
  styles: SegmentedControlStyles;
  variant: SegmentedControlVariant;
}) {
  const focus = useFocusRing();
  const pill = variant === "pill";
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={() => {
        if (!selected) {
          onChange(option.value);
        }
      }}
      style={[
        pill ? styles.pill : styles.cell,
        sizing === "content" ? styles.contentSegment : null,
        selected ? (pill ? styles.pillActive : styles.cellSelected) : null,
        focus.focused ? focus.focusRingStyle : null,
        disabled ? styles.disabled : null,
        hideWebOutlineView,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          pill ? styles.pillText : styles.cellText,
          selected
            ? pill
              ? styles.pillTextActive
              : styles.cellTextSelected
            : null,
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}
