/** One option of {@link SegmentedControl}: a radio with its icon and label. */
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  type TextStyle,
  View,
} from "../primitives/reactNative";

import { type FocusIndicator, useFocusRing } from "../focusRing";
import type { FocusableRef } from "../keyboardNavigation";
import type { SharedUiTheme } from "../theme";

import type { SegmentedControlStyles } from "./segmentedControlStyles";
import type {
  SegmentedControlSizing,
  SegmentedControlVariant,
  SegmentOption,
} from "./segmentedControlTypes";

type SegmentKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/** A pill's measured box within the track, used to place the sliding thumb. */
export type PillRect = { height: number; width: number; x: number; y: number };

export function SegmentedControlButton<T extends string>({
  disabled,
  focusIndicator,
  iconOnly,
  iconSize,
  index,
  itemRef,
  onChange,
  onMeasure,
  onMoveFocus,
  option,
  rovingTabIndex: tabIndex,
  selected,
  sizing,
  styles,
  textTransition,
  theme,
  thumbActive,
  variant,
}: {
  disabled: boolean;
  focusIndicator: FocusIndicator | undefined;
  iconOnly: boolean;
  iconSize: number;
  index: number;
  itemRef: { current: FocusableRef };
  onChange: (value: T) => void;
  onMeasure?: (key: string, rect: PillRect) => void;
  onMoveFocus: (key: string, fromIndex: number) => void;
  option: SegmentOption<T>;
  rovingTabIndex: 0 | -1;
  selected: boolean;
  sizing: SegmentedControlSizing;
  styles: SegmentedControlStyles;
  textTransition: TextStyle | null;
  theme: SharedUiTheme;
  thumbActive: boolean;
  variant: SegmentedControlVariant;
}) {
  const pill = variant === "pill";
  // The leading glyph (a caller node wins over a tinted lucide icon). Its tint
  // matches the segment's resolved text colour so the icon and label read as
  // one unit and shift together on selection.
  const OptionIcon = option.icon;
  const iconTint = pill
    ? selected
      ? theme.colors.ink
      : theme.colors.ink2
    : selected
      ? theme.colors.primaryDeep
      : theme.colors.ink2;
  const leadingIcon =
    option.iconNode != null ? (
      option.iconNode
    ) : OptionIcon ? (
      <OptionIcon color={iconTint} size={iconSize} />
    ) : null;
  // The visible label is dropped in `iconOnly` mode, but only when the segment
  // actually has an icon to show — otherwise it falls back to the label so the
  // segment is never an empty box (a dev warning fired above).
  const showLabel = !iconOnly || leadingIcon == null;
  // Keep the CSS ring inside the segment so it remains visible in compact,
  // clipped segmented-control hosts.
  const focus = useFocusRing({ offset: -2, indicator: focusIndicator });

  const handleKeyDown = (event: SegmentKeyEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    // Space checks the focused segment, as the radio-group pattern requires.
    // React Native Web's press responder binds Spacebar to `button` roles only,
    // so on a `radio` it neither presses nor is swallowed — Space would scroll
    // the page. Enter is left to the responder: it presses on every role, so
    // claiming it here too would fire `onChange` twice.
    if (key === " " || key === "Spacebar") {
      event.preventDefault?.(); // and do not scroll the page
      event.stopPropagation?.();
      if (!disabled && !selected) {
        onChange(option.value);
      }
      return;
    }
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

  // When the sliding thumb is covering the selected pill, drop the pill's own
  // fill so the raised surface is drawn once, by the thumb. Until the first
  // measurement lands (or under the outline variant), the pill keeps painting
  // its own selected fill, so the selection never flickers off on load.
  const selectedStyle = selected
    ? pill
      ? thumbActive
        ? null
        : styles.pillActive
      : styles.cellSelected
    : null;

  return (
    <Pressable
      accessibilityLabel={option.accessibilityLabel ?? option.label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      disabled={disabled}
      {...focus.focusRingProps}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onLayout={
        onMeasure
          ? (event: LayoutChangeEvent) => {
              const { height, width, x, y } = event.nativeEvent.layout;
              onMeasure(option.value, { height, width, x, y });
            }
          : undefined
      }
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
        selectedStyle,
        disabled ? styles.disabled : null,
        focus.focusRingVariables,
      ]}
    >
      {leadingIcon != null ? (
        // The glyph is decorative: the Pressable's `accessibilityLabel` (the
        // label / its override) is the accessible name, so hide the icon from
        // assistive tech on web to avoid a duplicate/raw-name announcement.
        <View
          aria-hidden={Platform.OS === "web" ? true : undefined}
          style={styles.segmentIcon}
        >
          {leadingIcon}
        </View>
      ) : null}
      {showLabel ? (
        <Text
          numberOfLines={1}
          style={[
            pill ? styles.pillText : styles.cellText,
            selected
              ? pill
                ? styles.pillTextActive
                : styles.cellTextSelected
              : null,
            textTransition,
          ]}
        >
          {option.label}
        </Text>
      ) : null}
    </Pressable>
  );
}
