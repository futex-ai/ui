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

import { createInputStyles, inputIconSize } from "./inputStyles";

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
  /** Force the active (primary) border, e.g. while an attached popover is open. */
  active?: boolean;
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
  inputRef,
  inputStyle,
  invalid = false,
  onClear,
  onSuffixIconPress,
  prefixIcon: PrefixIcon,
  required = false,
  size = "md",
  style,
  suffixIcon: SuffixIcon,
  suffixIconLabel,
  suffixIconStyle,
  ...props
}: InputFrameProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInputStyles(theme, size), [theme, size]);
  const iconSize = inputIconSize(size);
  const focus = useFocusRing();
  const multiline = Boolean(props.multiline);
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
        multiline ? styles.boxMultiline : null,
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
        onFocus={(event) => {
          focus.onFocus();
          props.onFocus?.(event);
        }}
        style={[
          multiline ? styles.textareaInput : styles.input,
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
