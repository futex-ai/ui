/** Single-select segmented controls for compact one-of-N choices. */
import { useCallback, useId, useMemo, useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { hideWebOutlineView, useFocusRing } from "../focusRing";
import {
  type FocusableRef,
  focusItemAt,
  nextNavIndex,
  rovingTabIndex,
} from "../keyboardNavigation";
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
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Width strategy: `content` (default) hugs each label; `equal` shares width evenly. */
  sizing?: SegmentedControlSizing;
  value: T;
  /**
   * Visual style: `pill` (default) renders a tab-like track with the selected
   * option as a raised surface; `outline` renders separate bordered cells, the
   * right fit for rows of filter pills.
   */
  variant?: SegmentedControlVariant;
  wrap?: boolean;
};

type SegmentKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
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
  size = "md",
  sizing = "content",
  value,
  variant = "pill",
  wrap = false,
}: SegmentedControlProps<T>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createSegmentedControlStyles(theme, size),
    [theme, size],
  );
  const pill = variant === "pill";
  const invalid = Boolean(error);

  const reactId = useId();
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;
  // RNW does not map `accessibilityHint` to `aria-describedby`, so associate the
  // visible error/hint Text by id (WCAG 3.3.1 / 1.3.1). Errors take precedence.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // Each segment needs a focusable ref so arrow keys can move a roving focus
  // between options (WCAG 2.1.1 Keyboard / 4.1.2). The whole group is a single
  // Tab stop: only the active option carries `tabIndex 0`.
  const itemRefs = useRef<{ current: FocusableRef }[]>([]);
  itemRefs.current = options.map(
    (_, index) => itemRefs.current[index] ?? { current: null },
  );

  // The roving tab stop is the selected option, falling back to the first
  // enabled option when the selected value is itself disabled/absent.
  const selectedIndex = options.findIndex((option) => option.value === value);
  const firstEnabledIndex = options.findIndex(
    (option) => !(disabled || option.disabled === true),
  );
  const activeIndex =
    selectedIndex >= 0 &&
    !(disabled || options[selectedIndex]?.disabled === true)
      ? selectedIndex
      : firstEnabledIndex;

  const moveFocus = useCallback(
    (key: string, fromIndex: number) => {
      const count = options.length;
      if (count === 0) {
        return;
      }
      let nextIndex = nextNavIndex({
        key,
        index: fromIndex,
        count,
        orientation: "horizontal",
      });
      if (nextIndex === null) {
        return;
      }
      // Skip disabled options in the arrow direction, wrapping with the helper.
      const forward = key === "ArrowRight" || key === "Home";
      let guard = 0;
      while (
        (disabled || options[nextIndex]?.disabled === true) &&
        guard < count
      ) {
        const step = nextNavIndex({
          key: forward ? "ArrowRight" : "ArrowLeft",
          index: nextIndex,
          count,
          orientation: "horizontal",
        });
        if (step === null) {
          return;
        }
        nextIndex = step;
        guard += 1;
      }
      if (disabled || options[nextIndex]?.disabled === true) {
        return;
      }
      focusItemAt(itemRefs.current, nextIndex);
      // Follow the APG radio pattern: moving focus selects the option.
      const nextValue = options[nextIndex]?.value;
      if (nextValue !== undefined && nextValue !== value) {
        onChange(nextValue);
      }
    },
    [disabled, onChange, options, value],
  );

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
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-required={required}
        style={[pill ? styles.track : styles.row, wrap ? styles.rowWrap : null]}
      >
        {options.map((option, index) => (
          <SegmentedControlButton
            disabled={disabled || option.disabled === true}
            index={index}
            itemRef={itemRefs.current[index]}
            key={option.value}
            onChange={onChange}
            onMoveFocus={moveFocus}
            option={option}
            rovingTabIndex={rovingTabIndex(index, activeIndex)}
            selected={option.value === value}
            sizing={sizing}
            styles={styles}
            variant={variant}
          />
        ))}
      </View>
      {error ? (
        <Text nativeID={errorId} style={styles.error}>
          {error}
        </Text>
      ) : null}
      {hint ? (
        <Text nativeID={hintId} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function SegmentedControlButton<T extends string>({
  disabled,
  index,
  itemRef,
  onChange,
  onMoveFocus,
  option,
  rovingTabIndex: tabIndex,
  selected,
  sizing,
  styles,
  variant,
}: {
  disabled: boolean;
  index: number;
  itemRef: { current: FocusableRef };
  onChange: (value: T) => void;
  onMoveFocus: (key: string, fromIndex: number) => void;
  option: SegmentOption<T>;
  rovingTabIndex: 0 | -1;
  selected: boolean;
  sizing: SegmentedControlSizing;
  styles: SegmentedControlStyles;
  variant: SegmentedControlVariant;
}) {
  const pill = variant === "pill";
  // Inset the ring on the pill: it lives inside the rounded track and an outset
  // outline would be clipped by the neighbouring pill (WCAG 2.4.7).
  const focus = useFocusRing(pill ? { offset: -2 } : {});

  const handleKeyDown = (event: SegmentKeyEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (
      key !== "ArrowLeft" &&
      key !== "ArrowRight" &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    onMoveFocus(key, index);
  };
  const keyProps = Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {};

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
      ref={(node) => {
        itemRef.current = node as unknown as FocusableRef;
      }}
      tabIndex={tabIndex}
      {...keyProps}
      style={[
        pill ? styles.pill : styles.cell,
        sizing === "equal" ? styles.equalSegment : styles.contentSegment,
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
