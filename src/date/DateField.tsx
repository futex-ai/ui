/** Branded single-date input with a calendar picker. */
import { LucideIcon } from "lucide-react-native";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { LabelInfo } from "../input";
import { useSharedUiTheme } from "../theme";

import { createDateFieldStyles } from "./dateFieldStyles";
import { DatePickerOverlay } from "./DatePickerOverlay";
import { dateFieldZIndex } from "./dateFieldLayers";
import { todayIso } from "./dateMath";
import { NativeTrigger, WebTrigger } from "./DateTrigger";
import { DatePickerVariant } from "./types";
import { useDateField } from "./useDateField";

// Re-exported so the date barrel keeps `triggerBorder` on its public surface.
export { triggerBorder } from "./DateTrigger";

// Report open/close before paint so parent trigger chrome reflects the state in
// the same frame, falling back to useEffect during server pre-render.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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
  labelInfoIcon?: LucideIcon;
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

/** Props for {@link DateInput}: the bare trigger + single-date picker. */
export type DateInputProps = {
  /** Current ISO value, or `""` when unset. */
  value: string;
  /** Called with the next ISO value. */
  onChange: (iso: string) => void;
  /** Label used for the input's accessibility name. */
  label: string;
  /** Renders the rose invalid border. */
  invalid: boolean;
  /** Marks the input required (a11y only). */
  required?: boolean;
  /** Placeholder shown when no date is set. */
  placeholder?: string;
  /** Earliest selectable ISO date (inclusive). */
  min?: string;
  /** Latest selectable ISO date (inclusive). */
  max?: string;
  /** Fill the available row width (range endpoints). */
  flex?: boolean;
  /** Notifies the parent when the picker opens/closes (so it can raise z-index). */
  onOpenChange?: (open: boolean) => void;
  /** Show a clear (✕) button once a value is set. Off by default. */
  clearable?: boolean;
  /** Calendar grid (default) or spinning day/month/year wheel bottom sheet. */
  variant?: DatePickerVariant;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /**
   * Corner radius (px) of the trigger box. Defaults to `theme.radii.md`; pass
   * `0` for square corners (e.g. an in-grid cell editor that must match a
   * square container).
   */
  borderRadius?: number;
  /** z-index for the open trigger wrapper and web calendar portal. */
  zIndex?: number;
  /**
   * Space-separated id list of the error/hint text describing this field, wired
   * to the trigger as a literal `aria-describedby` (WCAG 2.1 3.3.1 / 3.3.2).
   */
  describedById?: string;
  /** Id of the error-message element, wired as `aria-errormessage`. */
  errorId?: string;
  /** Error message text, also folded into the native `accessibilityHint`. */
  errorText?: string;
  /** Helper text, also folded into the native `accessibilityHint`. */
  hintText?: string;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * The trigger + its own single-date picker, without a label/error/hint. Used by
 * {@link DateField} and by each endpoint of `DateRangeField` (so the two
 * endpoints are independent single-date calendars). On web, clicking outside the
 * open calendar dismisses it.
 */
export function DateInput({
  value,
  onChange,
  label,
  invalid,
  required = false,
  placeholder = "Select a date",
  min,
  max,
  flex = false,
  onOpenChange,
  clearable = false,
  variant = "calendar",
  size = "md",
  borderRadius,
  zIndex,
  describedById,
  errorId,
  errorText,
  hintText,
  testID,
}: DateInputProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDateFieldStyles(theme, size, borderRadius),
    [theme, size, borderRadius],
  );
  const field = useDateField({ value, onChange, min, max });
  const today = useMemo(() => todayIso(new Date()), []);
  const openLayer = useMemo(
    () => ({ zIndex: dateFieldZIndex(zIndex) }),
    [zIndex],
  );
  // The web calendar portal measures this wrapper and owns outside/Escape
  // dismissal. Native sheets use the same ref-shaped seam but do not measure it.
  const rootRef = useRef<View>(null);
  // Layout effect (not passive) keeps parent trigger chrome in sync with the
  // portal's first frame.
  useIsoLayoutEffect(() => {
    onOpenChange?.(field.open);
  }, [field.open, onOpenChange]);
  return (
    <View
      ref={rootRef}
      style={[
        styles.anchor,
        flex ? styles.triggerFlex : null,
        field.open ? openLayer : null,
      ]}
      testID={testID}
    >
      {/* The editable type-or-pick input only fits the calendar popover. The
          wheel is a tap-to-open sheet (typing a date doesn't pair with a
          spinner), and its focus-restoring modal would re-trigger the input's
          open-on-focus — so the wheel uses the tap trigger on every platform. */}
      {Platform.OS === "web" && variant === "calendar" ? (
        <WebTrigger
          borderRadius={borderRadius}
          clearable={clearable}
          describedById={describedById}
          errorId={errorId}
          field={field}
          invalid={invalid}
          label={label}
          placeholder={placeholder}
          required={required}
          size={size}
          styles={styles}
        />
      ) : (
        <NativeTrigger
          clearable={clearable}
          describedById={describedById}
          errorId={errorId}
          errorText={errorText}
          field={field}
          hintText={hintText}
          invalid={invalid}
          label={label}
          placeholder={placeholder}
          required={required}
          size={size}
          styles={styles}
        />
      )}
      {field.open ? (
        <DatePickerOverlay
          anchorRef={rootRef}
          label={label}
          max={field.max}
          min={field.min}
          onClose={() => field.setOpen(false)}
          onSelect={field.commit}
          today={today}
          value={field.value}
          variant={variant}
          zIndex={zIndex}
        />
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
  labelInfoIcon?: LucideIcon;
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
