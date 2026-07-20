/** The bare bordered input box: prefix/suffix icons, clear button, focus ring. */
import { CircleX, LucideIcon } from "lucide-react-native";
import { Ref, useCallback, useMemo, useRef } from "react";
import {
  Pressable,
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { hideWebOutline, hideWebOutlineView, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  autoGrowTextareaBounds,
  createInputStyles,
  inputIconSize,
} from "./inputStyles";
import { useAutoGrowTextarea } from "./useAutoGrowTextarea";

export type InputFrameProps = Omit<TextInputProps, "style"> & {
  /**
   * Space-separated id list of the element(s) describing this input (hint /
   * error text). RNW forwards it as a literal `aria-describedby` on the DOM
   * input — RNW does NOT map `accessibilityHint` to it. (WCAG 2.1 3.3.1 / 3.3.2)
   */
  "aria-describedby"?: string;
  /**
   * Id of the error-message element. Forwarded as a literal `aria-errormessage`;
   * only meaningful while `invalid` (which sets `aria-invalid`). (WCAG 2.1 3.3.1)
   */
  "aria-errormessage"?: string;
  /** Renders the rose invalid border (independent of any message). */
  invalid?: boolean;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /**
   * Box treatment. `framed` (default) draws the bordered surface box; `plain`
   * drops the border, background, and horizontal padding for a chrome-less
   * inline editor embedded in a row (an inline title / label editor), while
   * keeping the focus ring, the clear button, and the invalid / required a11y
   * wiring. `seamless` goes further: it also drops the reserved control height
   * and all padding so the field collapses onto its text and reads as ordinary
   * copy that is invisibly editable — an inline-editable title, cell, or
   * paragraph. It works on a single-line field and a `multiline` one (which
   * grows to fit its content, capped by `maxLines` if set); style the text
   * through `inputStyle` to match the surrounding copy. On `plain` / `seamless`
   * the invalid state has no border to recolor — surface the error via the
   * surrounding field / message instead.
   */
  variant?: "framed" | "plain" | "seamless";
  /**
   * Opt a `multiline` field into auto-grow: it starts at `numberOfLines` rows
   * (the min) and grows one line at a time as content is added, up to `maxLines`
   * rows, after which it scrolls. Ignored on a single-line field, or when
   * `maxLines` is not greater than `numberOfLines`. On web this needs a
   * controlled `value` — growth is measured whenever `value` changes. A
   * `seamless` multiline field auto-grows even without `maxLines` (it grows to
   * fit ALL its content so it reads as body text); pass `maxLines` to cap it.
   */
  maxLines?: number;
  /** Force the active (primary) border, e.g. while an attached popover is open. */
  active?: boolean;
  /**
   * Draw the focus ring *inset* (inside the box) rather than as the default
   * outset glow. An outset glow is clipped by an `overflow: hidden` ancestor, so
   * a chrome-less `plain` / `seamless` field embedded in a table cell, data-grid
   * cell, or truncating card — which has no border to recolor and hides the
   * native outline — should opt in to keep a visible focus indicator (WCAG 2.1
   * 2.4.7). On a zero-padding `seamless` field the inset ring paints over the
   * text edges, so prefer reserving a little padding on the clipping ancestor
   * where you can. Ignored on native, where the OS focus affordance applies.
   */
  focusRingInset?: boolean;
  /** Marks the input required (wires `aria-required`). */
  required?: boolean;
  /** Leading decorative icon shown inside the box. */
  prefixIcon?: LucideIcon;
  /** Trailing icon shown inside the box, after the clear button. */
  suffixIcon?: LucideIcon;
  /**
   * Accessible label for the suffix icon. When set together with
   * {@link onSuffixIconPress} the icon becomes a focusable button; without it,
   * an `onSuffixIconPress` icon stays a mouse-only affordance (out of the tab
   * order and a11y tree) for actions that already have a keyboard path.
   */
  suffixIconLabel?: string;
  /** Press handler for the suffix icon. Omit for a purely decorative icon. */
  onSuffixIconPress?: () => void;
  /** Extra style for the suffix icon wrapper (e.g. an optical nudge). */
  suffixIconStyle?: StyleProp<ViewStyle>;
  /** Show an accessible clear (✕) button while there is a value to remove. */
  clearable?: boolean;
  /**
   * Override the clear button's visibility instead of deriving it from `value`.
   * Use when the value is committed separately from the live input text (e.g.
   * the date field, whose `value` is the typed buffer, not the committed date).
   */
  clearVisible?: boolean;
  /** Press handler for the clear button. Defaults to `onChangeText("")`. */
  onClear?: () => void;
  /** Accessible label for the clear button. Defaults to `Clear {accessibilityLabel}`. */
  clearAccessibilityLabel?: string;
  /** Ref forwarded to the underlying `TextInput` (e.g. for programmatic focus). */
  inputRef?: Ref<TextInput>;
  /** Style for the underlying `TextInput`. */
  inputStyle?: StyleProp<TextStyle>;
  /** Style for the outer box. */
  style?: StyleProp<ViewStyle>;
};

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
  const styles = useMemo(() => createInputStyles(theme, size), [theme, size]);
  const iconSize = inputIconSize(size);
  // An inset ring survives an `overflow: hidden` ancestor that would clip the
  // default outset glow — the pattern the date wheel and data-grid resize handle
  // already use for controls nested inside clipping containers.
  const focus = useFocusRing(focusRingInset ? { offset: -2 } : {});
  const plain = variant === "plain";
  const seamless = variant === "seamless";
  const multiline = Boolean(props.multiline);
  const seamlessMultiline = seamless && multiline;
  const showClear = clearable && (clearVisible ?? Boolean(props.value));
  const borderActive = focus.focused || active;
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
  const bounds = autoGrowTextareaBounds(size, minRows, maxRows);
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
        // The focus ring (a geometry-bearing outline, not just a border
        // recolor) goes last so it survives a caller `style` override and is
        // visible even on an invalid (rose-bordered) field — WCAG 2.1 2.4.7
        // Focus Visible (AA). Only paints when the input itself is focused
        // (not for the `active`/popover-open border).
        focus.focused ? focus.focusRingStyle : null,
      ]}
    >
      {PrefixIcon ? (
        <View aria-hidden style={styles.icon}>
          <PrefixIcon color={theme.colors.muted} size={iconSize} />
        </View>
      ) : null}
      <TextInput
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
          focus.onFocus();
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
          hideWebOutline,
          inputStyle,
        ]}
      />
      {/* The clear button is a distinct action with no keyboard equivalent on the
          input, so it stays an accessible button (in the tab order and a11y
          tree). Opt-in, and only shown once there is a value to remove. */}
      {showClear ? (
        <Pressable
          accessibilityLabel={clearLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleClear}
          style={[styles.iconButton, hideWebOutlineView]}
        >
          <CircleX color={theme.colors.muted} size={iconSize} />
        </Pressable>
      ) : null}
      {SuffixIcon ? (
        <SuffixAdornment
          Icon={SuffixIcon}
          color={theme.colors.muted}
          label={suffixIconLabel}
          onPress={onSuffixIconPress}
          size={iconSize}
          style={[styles.iconButton, suffixIconStyle]}
        />
      ) : null}
    </View>
  );
}

/**
 * The trailing icon. With a `label` + `onPress` it is a focusable button; with
 * `onPress` alone it is a mouse-only affordance (kept out of the tab order and
 * a11y tree, matching the date field's calendar icon); otherwise it is purely
 * decorative.
 */
function SuffixAdornment({
  Icon,
  color,
  label,
  onPress,
  size,
  style,
}: {
  Icon: LucideIcon;
  color: string;
  label?: string;
  onPress?: () => void;
  size: number;
  style: StyleProp<ViewStyle>;
}) {
  const icon = <Icon color={color} size={size} />;
  if (!onPress) {
    return (
      <View aria-hidden style={style}>
        {icon}
      </View>
    );
  }
  if (label) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={style}
      >
        {icon}
      </Pressable>
    );
  }
  // Mouse-only affordance: a real press target, but skipped by the keyboard
  // (`tabIndex={-1}`) and hidden from assistive tech, because the action it
  // triggers already has an accessible path (e.g. focusing the input).
  return (
    <Pressable aria-hidden onPress={onPress} style={style} tabIndex={-1}>
      {icon}
    </Pressable>
  );
}
