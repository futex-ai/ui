/** Single-select segmented controls for compact one-of-N choices. */
import { LucideIcon } from "lucide-react-native";
import {
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { useFocusRing } from "../focusRing";
import { LabelInfo } from "../input";
import {
  type FocusableRef,
  focusItemAt,
  nextNavIndex,
  rovingTabIndex,
} from "../keyboardNavigation";
import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import {
  createSegmentedControlStyles,
  segmentIconSize,
  type SegmentedControlStyles,
} from "./segmentedControlStyles";

// A brisk Material-style decelerate for the sliding pill thumb. Like the Switch
// knob, this is a web-only CSS transition (native snaps) and is dropped under
// reduced motion. Moving from a narrow tab to a wider one interpolates `left`
// and `width` together, so the surface grows as it glides.
const THUMB_SLIDE = "0.2s cubic-bezier(0.4, 0, 0.2, 1)";
const THUMB_TRANSITION = `left ${THUMB_SLIDE}, top ${THUMB_SLIDE}, width ${THUMB_SLIDE}, height ${THUMB_SLIDE}`;
const TEXT_TRANSITION = "color 0.2s ease";

export type SegmentOption<T extends string> = {
  /**
   * Overridable accessible name for the segment. Defaults to `label`. Set it to
   * disambiguate duplicate visible labels across controls or pin a
   * locale-stable name for `getByRole("radio", { name })`. Required in effect
   * when the control is `iconOnly` (the hidden label is the accessible name).
   */
  accessibilityLabel?: string;
  disabled?: boolean;
  /**
   * Leading lucide glyph shown before the label, tinted to match the segment's
   * text colour and sized to the control. Use {@link iconNode} for a non-lucide
   * glyph.
   */
  icon?: LucideIcon;
  /**
   * A caller-supplied leading icon node (e.g. an `@expo/vector-icons` glyph),
   * rendered as-is — the caller owns its colour and size. Takes precedence over
   * {@link icon} and is hidden from assistive tech on web.
   */
  iconNode?: ReactNode;
  label: string;
  value: T;
};

export type SegmentedControlSizing = "content" | "equal";

export type SegmentedControlVariant = "outline" | "pill";

export type SegmentedControlProps<T extends string> = {
  accessibilityLabel?: string;
  /**
   * Whether the `pill` variant's selection thumb slides between options.
   * Defaults to `true`; pass `false` to snap it into place with no transition
   * (also forced off when the OS "reduce motion" setting is on). No effect on
   * the `outline` variant, which has no thumb.
   */
  animated?: boolean;
  disabled?: boolean;
  /**
   * Disable the shared focus glow on the option buttons. They then fall back to
   * the browser's default focus outline so keyboard focus stays visible (WCAG
   * 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  error?: string | null;
  hint?: string;
  /**
   * Hide every option's visible label, rendering the leading icon alone for a
   * compact toolbar. Each option's (hidden) label — or its `accessibilityLabel`
   * — remains the accessible name (WCAG 1.1.1 / 4.1.2), so every option must
   * supply an `icon` or `iconNode`. Defaults to `false`.
   */
  iconOnly?: boolean;
  label?: string;
  /**
   * Supplementary help text revealed by an ⓘ button after the label. Pressing
   * the button opens a small bubble with this text (built on `Popover`);
   * screen-reader users get it from the button's description. Unlike `hint` it
   * is not shown until requested. Requires a `label` to anchor the button.
   */
  labelInfo?: string;
  /** Icon for the {@link labelInfo} button. Defaults to the lucide `Info` glyph. */
  labelInfoIcon?: LucideIcon;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  required?: boolean;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Width strategy: `content` (default) hugs each label; `equal` shares width evenly. */
  sizing?: SegmentedControlSizing;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
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

/** A pill's measured box within the track, used to place the sliding thumb. */
type PillRect = { height: number; width: number; x: number; y: number };

export function SegmentedControl<T extends string>({
  accessibilityLabel,
  animated = true,
  disabled = false,
  disableFocusRing = false,
  error,
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
  const styles = useMemo(
    () => createSegmentedControlStyles(theme, size),
    [theme, size],
  );
  const pill = variant === "pill";
  const invalid = Boolean(error);
  const reducedMotion = useReducedMotion();
  const iconSize = segmentIconSize(size);

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
            disableFocusRing={disableFocusRing}
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

function SegmentedControlButton<T extends string>({
  disabled,
  disableFocusRing,
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
  disableFocusRing: boolean;
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
  // The focus glow hugs the raised thumb: the pill and the absolutely-positioned
  // thumb share the same measured box, so an outset glow around the (transparent)
  // pill reads as a halo around the selected tab. It sits in the track's
  // padding/gap and isn't clipped (the track sets no `overflow: hidden`). An
  // inset glow instead painted a band *inside* the pill, over the thumb, which
  // looked like a misaligned ring rather than a focus halo (WCAG 2.4.7).
  const focus = useFocusRing({ disabled: disableFocusRing });

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
        focus.focused ? focus.focusRingStyle : null,
        disabled ? styles.disabled : null,
        focus.webOutlineReset,
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
