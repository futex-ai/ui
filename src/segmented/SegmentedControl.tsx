/** Single-select segmented controls for compact one-of-N choices. */
import { useCallback, useId, useMemo, useState } from "react";
import {
  Platform,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "../primitives/reactNative";

import { devWarn } from "../devWarn";
import { LabelInfo } from "../input";
import { rovingTabIndex } from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";
import { useReducedMotion } from "../useReducedMotion";

import {
  type PillRect,
  SegmentedControlButton,
} from "./SegmentedControlButton";
import {
  createSegmentedControlStyles,
  createTouchSegmentedControlStyles,
  segmentIconSize,
} from "./segmentedControlStyles";
import type { SegmentedControlProps } from "./segmentedControlTypes";
import { useSegmentedRovingFocus } from "./useSegmentedRovingFocus";

// A brisk Material-style decelerate for the sliding pill thumb. Like the Switch
// knob, this is a web-only CSS transition (native snaps) and is dropped under
// reduced motion. Moving from a narrow tab to a wider one interpolates `left`
// and `width` together, so the surface grows as it glides.
const THUMB_SLIDE = "0.2s cubic-bezier(0.4, 0, 0.2, 1)";
const THUMB_TRANSITION = `left ${THUMB_SLIDE}, top ${THUMB_SLIDE}, width ${THUMB_SLIDE}, height ${THUMB_SLIDE}`;
const TEXT_TRANSITION = "color 0.2s ease";

export function SegmentedControl<T extends string>({
  accessibilityLabel,
  animated = true,
  disabled = false,
  error,
  focusIndicator,
  hint,
  iconOnly = false,
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  onChange,
  options,
  required = false,
  size = "md",
  sizing = "content",
  testID,
  value,
  variant = "pill",
  wrap = false,
}: SegmentedControlProps<T>) {
  const theme = useSharedUiTheme();
  // On a touch surface every segment is a 44px target, whatever the size.
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      touch
        ? createTouchSegmentedControlStyles(theme)
        : createSegmentedControlStyles(theme, size),
    [theme, size, touch],
  );
  const pill = variant === "pill";
  const invalid = Boolean(error);
  const reducedMotion = useReducedMotion();
  const iconSize = touch ? touchControlMetrics.iconSize : segmentIconSize(size);

  // The ⓘ button anchors to the label row, so it needs a label to sit beside.
  // Guard on truthiness to match the label row's own `{label ? ...}` gate — an
  // empty-string label drops the row, so it must also warn (not just `undefined`).
  if (labelInfo && !label) {
    devWarn(
      "SegmentedControl: `labelInfo` needs a `label` to anchor the ⓘ button; " +
        "it is ignored without one.",
    );
  }
  // An `iconOnly` control hides the visible labels, so a label-only option would
  // render as an empty, unnameable box. Warn (and let it fall back to the label
  // text) rather than silently dropping the glyph.
  if (iconOnly && options.some((o) => o.icon == null && o.iconNode == null)) {
    devWarn(
      "SegmentedControl: `iconOnly` needs every option to supply an `icon` or " +
        "`iconNode`; options without one render their label text instead.",
    );
  }
  const labelInfoName =
    labelInfoLabel ??
    (label ? `More information about ${label}` : "More information");

  const reactId = useId();
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;
  // RNW does not map `accessibilityHint` to `aria-describedby`, so associate the
  // visible error/hint Text by id (WCAG 3.3.1 / 1.3.1). Errors take precedence.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const { activeIndex, itemRefs, moveFocus, selectedIndex } =
    useSegmentedRovingFocus({ disabled, onChange, options, value });

  // The measured box of each pill, keyed by its option value (not array index,
  // which would point at a different pill after a reorder), so the sliding thumb
  // can be placed over the selected one. Only the `pill` (tab-track) variant
  // draws a thumb, so the `outline` cells skip measuring entirely.
  const [pillRects, setPillRects] = useState<Record<string, PillRect>>({});
  const handleMeasure = useCallback((key: string, rect: PillRect) => {
    setPillRects((prev) => {
      const current = prev[key];
      if (
        current &&
        current.x === rect.x &&
        current.y === rect.y &&
        current.width === rect.width &&
        current.height === rect.height
      ) {
        return prev;
      }
      return { ...prev, [key]: rect };
    });
  }, []);

  // The thumb tracks the selected pill (matching `pillActive`, which shows even
  // when the selected option is disabled). It only renders once that pill has a
  // real measured width, so it appears already in place — CSS never animates a
  // freshly inserted element, so there is no slide-in on first paint.
  const thumbRect = pill && selectedIndex >= 0 ? pillRects[value] : undefined;
  const thumbVisible = Boolean(thumbRect && thumbRect.width > 0);
  // Fade the thumb in step with the pill when a disabled option is the selected
  // value (the whole control disabled, or that option disabled), so the raised
  // surface does not stay bright behind faded text.
  const thumbDisabled =
    selectedIndex >= 0 &&
    (disabled || options[selectedIndex]?.disabled === true);

  // The slide is web-only and opt-outable: dropped under the `animated={false}`
  // prop or the OS reduce-motion setting, leaving the thumb to snap into place.
  const slide = animated && !reducedMotion && Platform.OS === "web";
  const thumbTransition = slide
    ? ({ transition: THUMB_TRANSITION } as unknown as ViewStyle)
    : null;
  // Crossfade the label colour as a pill gains/loses selection, so the text
  // settles in step with the gliding surface instead of flipping instantly.
  const textTransition =
    pill && slide
      ? ({ transition: TEXT_TRANSITION } as unknown as TextStyle)
      : null;

  return (
    <View style={styles.field} testID={testID}>
      {label ? (
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
        {thumbVisible && thumbRect ? (
          <View
            // Purely decorative: the selection is announced by each radio's
            // checked state, so keep the thumb off the accessibility tree on
            // web, iOS, and Android.
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            testID="segmentedThumb"
            style={[
              styles.pillThumb,
              styles.pillActive,
              {
                height: thumbRect.height,
                left: thumbRect.x,
                top: thumbRect.y,
                width: thumbRect.width,
              },
              thumbDisabled ? styles.disabled : null,
              thumbTransition,
            ]}
          />
        ) : null}
        {options.map((option, index) => (
          <SegmentedControlButton
            disabled={disabled || option.disabled === true}
            focusIndicator={focusIndicator}
            iconOnly={iconOnly}
            iconSize={iconSize}
            index={index}
            itemRef={itemRefs.current[index]}
            key={option.value}
            onChange={onChange}
            onMeasure={pill ? handleMeasure : undefined}
            onMoveFocus={moveFocus}
            option={option}
            rovingTabIndex={rovingTabIndex(index, activeIndex)}
            selected={option.value === value}
            sizing={sizing}
            styles={styles}
            textTransition={textTransition}
            theme={theme}
            thumbActive={thumbVisible}
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
