/** Branded single-date input with a calendar picker. */
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Platform, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createDateFieldStyles } from "./dateFieldStyles";
import { DatePickerOverlay } from "./DatePickerOverlay";
import { todayIso } from "./dateMath";
import { NativeTrigger, WebTrigger } from "./DateTrigger";
import { useDateField } from "./useDateField";
import { useOutsideClose } from "./useOutsideClose";

// Re-exported so the date barrel keeps `triggerBorder` on its public surface.
export { triggerBorder } from "./DateTrigger";

// Report open/close before paint (so the parent raises z-index in the same frame
// the calendar appears), falling back to useEffect during server pre-render.
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
  /** Earliest selectable ISO date (inclusive). */
  min?: string;
  /** Latest selectable ISO date (inclusive). */
  max?: string;
  /** Placeholder shown when no date is set. */
  placeholder?: string;
  /** Show a clear (✕) button once a value is set. Off by default. */
  clearable?: boolean;
};

/**
 * Single date field. Identical trigger on every platform; the opened picker is
 * platform-resolved (web calendar popover vs native sheet). Web is type-or-pick,
 * native is tap-to-pick. On web, clicking outside the open calendar dismisses it.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
  min,
  max,
  placeholder = "Select a date",
  clearable = false,
}: DateFieldProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDateFieldStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const invalid = Boolean(error);
  return (
    <View style={[styles.field, open ? styles.fieldOpen : null]}>
      <FieldLabel label={label} required={required} />
      <DateInput
        clearable={clearable}
        invalid={invalid}
        label={label}
        max={max}
        min={min}
        onChange={onChange}
        onOpenChange={setOpen}
        placeholder={placeholder}
        required={required}
        value={value}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
}: DateInputProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDateFieldStyles(theme), [theme]);
  const field = useDateField({ value, onChange, min, max });
  const today = useMemo(() => todayIso(new Date()), []);
  const rootRef = useOutsideClose(field.open, () => field.setOpen(false));
  // Layout effect (not passive) so the parent raises its z-index in the same
  // frame the calendar first paints, otherwise the popover is one frame late and
  // a later sibling can flash over it on open.
  useIsoLayoutEffect(() => {
    onOpenChange?.(field.open);
  }, [field.open, onOpenChange]);
  return (
    <View
      ref={rootRef}
      style={[
        styles.anchor,
        flex ? styles.triggerFlex : null,
        field.open ? styles.fieldOpen : null,
      ]}
    >
      {Platform.OS === "web" ? (
        <WebTrigger
          clearable={clearable}
          field={field}
          invalid={invalid}
          label={label}
          placeholder={placeholder}
          required={required}
          styles={styles}
        />
      ) : (
        <NativeTrigger
          clearable={clearable}
          field={field}
          invalid={invalid}
          label={label}
          placeholder={placeholder}
          required={required}
          styles={styles}
        />
      )}
      {field.open ? (
        <DatePickerOverlay
          max={field.max}
          min={field.min}
          onClose={() => field.setOpen(false)}
          onSelect={field.commit}
          today={today}
          value={field.value}
        />
      ) : null}
    </View>
  );
}

/** Shared label with an optional required `*`. */
export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDateFieldStyles(theme), [theme]);
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}
