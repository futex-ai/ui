/** Labelled text input field with validation, icons, and an optional clear button. */
import { LucideIcon } from "lucide-react-native";
import { useId, useMemo } from "react";
import { Text, View } from "react-native";

import { devWarn } from "../devWarn";
import { useSharedUiTheme } from "../theme";

import { InputFrame, InputFrameProps } from "./InputFrame";
import { createInputStyles } from "./inputStyles";
import { LabelInfo } from "./LabelInfo";

export type InputProps = InputFrameProps & {
  /** Field label shown above the input. Omit for the bare variant (box + messages, no label row). */
  label?: string;
  /** Validation message: shown below the input and turns the border rose. */
  error?: string | null;
  /** Helper text shown below the input. */
  hint?: string;
  /**
   * Supplementary help text revealed by an ⓘ button after the label. Pressing
   * the button opens a small bubble with this text (built on `Popover`);
   * screen-reader users get it from the button's description. Unlike `hint` it
   * is not shown until requested, so use it for occasional "what is this / why
   * we ask" detail rather than always-on guidance. Requires a `label` — it is
   * ignored on the bare variant.
   */
  labelInfo?: string;
  /** Icon for the {@link labelInfo} button. Defaults to the lucide `Info` glyph. */
  labelInfoIcon?: LucideIcon;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
};

/**
 * The shared labelled text input. Wraps {@link InputFrame} with a label row
 * (and required `*`), and renders the error / hint messages below. Always wires
 * `aria-invalid` / `aria-required` and the sage focus ring.
 *
 * Supports validation highlighting (`error`), leading/trailing icons
 * (`prefixIcon` / `suffixIcon`), and a `clearable` ✕ button. Omit `label` for
 * the bare variant (input + messages, no label row); for an unframed inline box
 * use {@link InputFrame} directly.
 */
export function Input({
  accessibilityLabel,
  clearAccessibilityLabel,
  error,
  hint,
  invalid = false,
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  required = false,
  ...props
}: InputProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInputStyles(theme), [theme]);
  const isInvalid = Boolean(error) || invalid;
  // The input is named via `aria-labelledby` (not `aria-label`), so InputFrame
  // can't derive the clear button's "Clear {name}" label from `accessibilityLabel`
  // — supply it here from the resolved visible name. A caller override still wins.
  const resolvedName = accessibilityLabel ?? label;
  const clearLabel =
    clearAccessibilityLabel ??
    (resolvedName ? `Clear ${resolvedName}` : undefined);
  // The ⓘ button anchors to the label row, so it needs a label to sit beside.
  if (labelInfo && label === undefined) {
    devWarn(
      "Input: `labelInfo` needs a `label` to anchor the ⓘ button; it is " +
        "ignored on the bare (label-less) variant.",
    );
  }
  const labelInfoName =
    labelInfoLabel ??
    (resolvedName
      ? `More information about ${resolvedName}`
      : "More information");
  // Stable ids tie the visible label / error / hint <Text> nodes to the input.
  // RNW maps `nativeID → id`, so these become real `id`s in the DOM that the
  // literal `aria-*` attributes below reference.
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const errorId = `${baseId}-error`;
  const hintId = `${baseId}-hint`;
  // Describe the input with whichever messages exist (error first so it reads
  // before the hint) — WCAG 2.1 3.3.2 Labels or Instructions / 3.3.1 Error
  // Identification (A). RNW does NOT map `accessibilityHint → aria-describedby`,
  // so we emit the literal `aria-describedby` ourselves.
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <View style={styles.field}>
      {label === undefined ? null : (
        <View style={styles.labelRow}>
          {/* The label <Text> keeps its own `nativeID`, so `aria-labelledby`
              names the input by the visible label text alone — the ⓘ button is
              a sibling, never folded into the accessible name. */}
          <Text nativeID={labelId} style={styles.fieldLabel}>
            {label}
            {/* The `*` is purely visual; the required state is conveyed
                programmatically via `aria-required`. Hide it from AT so it does
                not leak into the input's `aria-labelledby` name as "Email *". */}
            {required ? (
              <Text aria-hidden style={styles.required}>
                {" *"}
              </Text>
            ) : null}
          </Text>
          {labelInfo ? (
            <LabelInfo
              accessibilityLabel={labelInfoName}
              icon={labelInfoIcon}
              info={labelInfo}
            />
          ) : null}
        </View>
      )}
      <InputFrame
        // Name the input from the visible label via a programmatic association
        // (`aria-labelledby`), not an `aria-label` copy, so the accessible name
        // IS the visible text — WCAG 2.1 2.5.3 Label in Name / 1.3.1 Info and
        // Relationships (A). An explicit `accessibilityLabel` still wins; fall
        // back to `aria-labelledby` only for the labelled variant. Native still
        // gets `accessibilityHint` for the error/hint (RNW ignores it on web).
        accessibilityHint={error ?? hint}
        accessibilityLabel={accessibilityLabel}
        aria-describedby={describedBy}
        clearAccessibilityLabel={clearLabel}
        // `aria-errormessage` points at the live error text; only meaningful
        // alongside `aria-invalid`, which InputFrame sets from `invalid`.
        aria-errormessage={error ? errorId : undefined}
        aria-labelledby={
          accessibilityLabel === undefined && label !== undefined
            ? labelId
            : undefined
        }
        invalid={isInvalid}
        required={required}
        {...props}
      />
      {error ? (
        // `role="alert"` (assertive live region) announces a newly-shown
        // validation message without moving focus — WCAG 2.1 4.1.3 Status
        // Messages (AA). `accessibilityLiveRegion` covers native.
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          nativeID={errorId}
          style={styles.error}
        >
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
