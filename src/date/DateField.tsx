/** Branded single-date input with a calendar picker. */
import { IconComponent } from "../primitives/icons";
import { useId, useMemo, useState } from "react";
import { Text, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { LabelInfo } from "../input";
import { useSharedUiTheme } from "../theme";

import { DateInput } from "./DateInput";
import { createDateFieldStyles } from "./dateFieldStyles";
import { dateFieldZIndex } from "./dateFieldLayers";
import { DatePickerVariant } from "./types";

// Re-exported so the date barrel keeps `triggerBorder` on its public surface.
export { triggerBorder } from "./DateTrigger";

/** Props for {@link DateField}. `value`/`onChange` use ISO `YYYY-MM-DD`. */
export type DateFieldProps = {
  /** Field label shown above the trigger. */
  label: string;
  /** Current ISO value, or `""` when unset. */
  value: string;
  /** Called with the next ISO value. */
  onChange: (iso: string) => void;
  /** Validation message shown below the field (and turns the border rose). */
  error?: string | null;
  /** Marks the field required (adds a `*` to the label). */
  required?: boolean;
  /** Optional helper text below the field. */
  hint?: string;
  /**
   * Supplementary help text revealed by an ⓘ button after the label. Pressing
   * the button opens a small bubble with this text (built on `Popover`);
   * screen-reader users get it from the button's description. Unlike `hint` it
   * is not shown until requested.
   */
  labelInfo?: string;
  /** Icon for the {@link labelInfo} button. Defaults to the lucide `Info` glyph. */
  labelInfoIcon?: IconComponent;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
  /** Earliest selectable ISO date (inclusive). */
  min?: string;
  /** Latest selectable ISO date (inclusive). */
  max?: string;
  /** Placeholder shown when no date is set. */
  placeholder?: string;
  /** Show a clear (✕) button once a value is set. Off by default. */
  clearable?: boolean;
  /** Calendar grid (default) or spinning day/month/year wheel bottom sheet. */
  variant?: DatePickerVariant;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** z-index for the open trigger wrappers and web calendar portal. */
  zIndex?: number;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * Single date field. Identical trigger on every platform; the opened picker is
 * platform-resolved (web calendar popover vs native sheet). Web is type-or-pick,
 * native is tap-to-pick. On web, clicking outside the open calendar dismisses it.
 * Pass `variant="wheel"` for the iOS-style spinning bottom-sheet picker instead.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  min,
  max,
  placeholder = "Select a date",
  clearable = false,
  variant = "calendar",
  size = "md",
  zIndex,
  testID,
}: DateFieldProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDateFieldStyles(theme, size),
    [theme, size],
  );
  const [open, setOpen] = useState(false);
  const openLayer = useMemo(
    () => ({ zIndex: dateFieldZIndex(zIndex) }),
    [zIndex],
  );
  const invalid = Boolean(error);
  // Stable ids so the trigger can point `aria-describedby`/`aria-errormessage`
  // at the visible error/hint text (RNW does not map `accessibilityHint` to
  // `aria-describedby` on web) — WCAG 2.1 3.3.1 / 3.3.2 / 1.3.1.
  const errorId = useId();
  const hintId = useId();
  // Concatenate both, so the error and hint are read together rather than the
  // single `accessibilityHint` slot being overloaded by one of them.
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <View style={[styles.field, open ? openLayer : null]} testID={testID}>
      <FieldLabel
        label={label}
        labelInfo={labelInfo}
        labelInfoIcon={labelInfoIcon}
        labelInfoLabel={labelInfoLabel}
        required={required}
      />
      <DateInput
        clearable={clearable}
        describedById={describedBy}
        errorId={error ? errorId : undefined}
        errorText={error ?? undefined}
        hintText={hint}
        invalid={invalid}
        label={label}
        max={max}
        min={min}
        onChange={onChange}
        onOpenChange={setOpen}
        placeholder={placeholder}
        required={required}
        size={size}
        value={value}
        variant={variant}
        zIndex={zIndex}
      />
      {/* The error is a polite live region so a newly-shown validation message is
          announced without moving focus (WCAG 2.1 4.1.3 Status Messages, AA). */}
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          nativeID={errorId}
          style={styles.fieldError}
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

/** Shared label with an optional required `*` and ⓘ info button. */
export function FieldLabel({
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  required,
}: {
  label: string;
  labelInfo?: string;
  labelInfoIcon?: IconComponent;
  labelInfoLabel?: string;
  required: boolean;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDateFieldStyles(theme), [theme]);
  const labelInfoName = labelInfoLabel ?? `More information about ${label}`;
  return (
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>
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
