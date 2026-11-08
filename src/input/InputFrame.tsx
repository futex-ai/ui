/** The bare bordered input box: prefix/suffix icons, clear button, focus ring. */
import { CircleX } from "../primitives/icons";
import { useCallback, useMemo, useRef } from "react";
import { Pressable, TextInput, View } from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useTouchSurface } from "../touchSurface";

import type { InputFrameProps } from "./inputFrameProps";
import {
  autoGrowTextareaBounds,
  inputIconSize,
  touchInputSizeTokens,
} from "./inputSizing";
import { createInputStyles, createTouchInputStyles } from "./inputStyles";
import { SuffixAdornment } from "./SuffixAdornment";
import { useAutoGrowTextarea } from "./useAutoGrowTextarea";

/**
 * The bordered box around a `TextInput`, with optional leading/trailing icons
 * and an accessible clear button. Owns the sage focus ring, the rose invalid
 * border, and the `aria-invalid` / `aria-required` wiring, but renders no label
 * or messages — embed it directly (e.g. inside the date field's trigger), use
 * {@link Input} for the full labelled field, or pass `multiline` for textarea
 * geometry.
 */
export function InputFrame({
  active = false,
  clearable = false,
  clearAccessibilityLabel,
  clearVisible,
  focusIndicator,
  focusRingInset = false,
  inputRef,
  inputStyle,
  invalid = false,
  maxLines,
  onClear,
  onSuffixIconPress,
  prefixIcon: PrefixIcon,
  required = false,
  size = "md",
  style,
  suffixIcon: SuffixIcon,
  suffixIconLabel,
  suffixIconStyle,
  variant = "framed",
  ...props
}: InputFrameProps) {
  const theme = useSharedUiTheme();
  // A touch surface draws every size with the touch metrics: a 44px input in a
  // 46px frame, 16px text, and 44px actions.
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      touch ? createTouchInputStyles(theme) : createInputStyles(theme, size),
    [theme, size, touch],
  );
  const iconSize = touch
    ? touchInputSizeTokens().iconSize
    : inputIconSize(size);
  const actionHitSlop = touch ? undefined : 8;
  // An inset ring survives an `overflow: hidden` ancestor that would clip the
  // default outset glow — the pattern the date wheel and data-grid resize handle
  // already use for controls nested inside clipping containers.
  const focus = useFocusRing({
    ...(focusRingInset ? { offset: -2 } : {}),
    indicator: focusIndicator,
    target: "descendant",
  });
  const plain = variant === "plain";
  const seamless = variant === "seamless";
  const multiline = Boolean(props.multiline);
  const seamlessMultiline = seamless && multiline;
  const showClear = clearable && (clearVisible ?? Boolean(props.value));
  // `none` drops the focus border too; an explicit `active` still applies.
  const borderActive = active || (focus.focused && focus.indicator !== "none");
  const clearLabel =
    clearAccessibilityLabel ??
    (props.accessibilityLabel ? `Clear ${props.accessibilityLabel}` : "Clear");
  // Keep an internal handle on the input (for refocus-after-clear) while still
  // forwarding the caller's `inputRef` to the same node.
  const internalRef = useRef<TextInput | null>(null);
  const setInputRef = useCallback(
    (node: TextInput | null) => {
      internalRef.current = node;
      if (typeof inputRef === "function") {
        inputRef(node);
      } else if (inputRef) {
        (inputRef as { current: TextInput | null }).current = node;
      }
    },
    [inputRef],
  );
  // Auto-grow: a multiline field with a `maxLines` cap above its `numberOfLines`
  // floor grows with content between the two row-derived pixel bounds. The floor
  // defaults to two rows (one for a seamless field, which starts as a single
  // line of text) when the caller sets no `numberOfLines`.
  const minRows = props.numberOfLines ?? (seamlessMultiline ? 1 : 2);
  // A seamless multiline field always auto-grows — it reads as body text, so it
  // grows to fit ALL its content, uncapped (`maxLines` still caps it). A framed
  // / plain field only auto-grows with an explicit `maxLines` above the floor.
  const autoGrowEnabled =
    seamlessMultiline || (multiline && maxLines != null && maxLines > minRows);
  const maxRows = maxLines ?? (seamlessMultiline ? Infinity : minRows);
  // Touch textareas keep the `lg` lines, which the touch metrics share.
  const bounds = touch
    ? autoGrowTextareaBounds("lg", minRows, maxRows)
    : autoGrowTextareaBounds(size, minRows, maxRows);
  const autoGrow = useAutoGrowTextarea({
    enabled: autoGrowEnabled,
    lineHeight: bounds.lineHeight,
    maxHeight: bounds.maxHeight,
    minHeight: bounds.minHeight,
    nodeRef: internalRef,
    value: typeof props.value === "string" ? props.value : undefined,
  });
  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    props.onChangeText?.("");
    // Return focus to the now-empty input so keyboard users keep their place
    // instead of dropping to the document body when the button unmounts.
    internalRef.current?.focus();
  };

  return (
    <View
      {...focus.focusRingProps}
      style={[
        styles.box,
        // `plain` strips the border / fill / horizontal padding for a
        // chrome-less inline editor. It sits before the active / invalid border
        // layers below so their `borderColor` becomes inert against the zeroed
        // `borderWidth` (there is no border to recolor on a plain field).
        plain ? styles.boxPlain : null,
        multiline ? styles.boxMultiline : null,
        // `seamless` strips the same chrome plus the reserved height and all
        // padding, so it must sit AFTER `boxMultiline` to override its vertical
        // padding, and (like `plain`) before the active / invalid border layers.
        seamless ? styles.boxSeamless : null,
        invalid ? styles.boxInvalid : borderActive ? styles.boxActive : null,
        style,
        focus.focusRingVariables,
      ]}
    >
      {PrefixIcon ? (
        <View aria-hidden style={styles.icon}>
          <PrefixIcon color={theme.colors.muted} size={iconSize} />
        </View>
      ) : null}
      <TextInput
        {...focus.focusTargetProps}
        ref={setInputRef}
        aria-invalid={invalid}
        aria-required={required}
        // `placeholder` clears 4.5:1 on surface (WCAG 2.1 1.4.3, AA); `faint`
        // was only ~2.26:1. A placeholder is never the only label (3.3.2 A).
        placeholderTextColor={theme.colors.placeholder}
        {...props}
        onBlur={(event) => {
          focus.onBlur();
          props.onBlur?.(event);
        }}
        onContentSizeChange={(event) => {
          // Native measures its height here; the caller's handler still fires.
          autoGrow.onContentSizeChange?.(event);
          props.onContentSizeChange?.(event);
        }}
        onFocus={(event) => {
          focus.onFocus(event);
          props.onFocus?.(event);
        }}
        style={[
          // `seamless` uses the chrome-less, height-less text styles so the
          // field flows like ordinary copy; the others keep the fixed-height box.
          multiline
            ? seamless
              ? styles.textareaSeamless
              : styles.textareaInput
            : seamless
              ? styles.inputSeamless
              : styles.input,
          // The auto-grow bounds (min/max/height + line height) override the
          // fixed textarea min-height; a caller `inputStyle` still wins.
          autoGrow.style,
          // On a touch surface the input itself keeps the 44px target, also
          // when its variant sizes it to one line of text.
          seamless ? styles.seamlessFloor : null,
          inputStyle,
        ]}
      />
      {/* The clear button is a distinct action with no keyboard equivalent on the
          input, so it stays an accessible button (in the tab order and a11y
          tree). Opt-in, and only shown once there is a value to remove. It keeps
          the browser's own focus outline: the frame's CSS glow follows only the
          input, so the outline is what tells a keyboard user the next Enter
          clears the field rather than submitting it (WCAG 2.1 — 2.4.7). */}
      {showClear ? (
        <Pressable
          accessibilityLabel={clearLabel}
          accessibilityRole="button"
          // On a touch surface the 44px box is the whole target: no hit slop
          // overlaps the input beside it.
          hitSlop={actionHitSlop}
          onPress={handleClear}
          style={styles.iconButton}
        >
          <CircleX color={theme.colors.muted} size={iconSize} />
        </Pressable>
      ) : null}
      {SuffixIcon ? (
        <SuffixAdornment
          Icon={SuffixIcon}
          color={theme.colors.muted}
          hitSlop={actionHitSlop}
          label={suffixIconLabel}
          onPress={onSuffixIconPress}
          size={iconSize}
          style={[styles.iconButton, suffixIconStyle]}
        />
      ) : null}
    </View>
  );
}
