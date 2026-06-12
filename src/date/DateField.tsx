/** Branded single-date input with a calendar picker. */
import { CalendarDays } from "lucide-react-native";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { hideWebOutline, hideWebOutlineView } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createDateFieldStyles, DateFieldStyles } from "./dateFieldStyles";
import { DatePickerOverlay } from "./DatePickerOverlay";
import { todayIso } from "./dateMath";
import { DateFieldController, useDateField } from "./useDateField";
import { useOutsideClose } from "./useOutsideClose";

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
}: DateFieldProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDateFieldStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const invalid = Boolean(error);
  return (
    <View style={[styles.field, open ? styles.fieldOpen : null]}>
      <FieldLabel label={label} required={required} />
      <DateInput
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
          field={field}
          invalid={invalid}
          label={label}
          placeholder={placeholder}
          required={required}
          styles={styles}
        />
      ) : (
        <NativeTrigger
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

type TriggerProps = {
  field: DateFieldController;
  invalid: boolean;
  label: string;
  placeholder: string;
  required: boolean;
  styles: DateFieldStyles;
};

function WebTrigger({
  field,
  invalid,
  label,
  placeholder,
  required,
  styles,
}: TriggerProps) {
  const theme = useSharedUiTheme();
  const [text, setText] = useState(field.display);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) {
      setText(field.display);
    }
  }, [editing, field.display]);
  // Commit typed text, then let the `editing` toggle + effect normalize the input
  // to the canonical `D Mon YYYY` (or revert to the last value when unparseable).
  const commitFromText = () => {
    setEditing(false);
    if (!field.commitText(text)) {
      setText(field.display);
    }
  };
  // `editing` doubles as the focus state, so the focus ring shows on the whole
  // field box (primary border) rather than the browser's default ring on the
  // inner input.
  return (
    <View
      style={[
        styles.trigger,
        triggerBorder(styles, invalid, field.open || editing),
      ]}
    >
      <TextInput
        accessibilityHint={field.display ? undefined : placeholder}
        accessibilityLabel={label}
        aria-invalid={invalid}
        aria-required={required}
        // Commit live as the user types so a valid date moves the calendar.
        onBlur={commitFromText}
        onChangeText={(next) => {
          setText(next);
          field.commitText(next);
        }}
        // Focusing the input opens the calendar.
        onFocus={() => {
          setEditing(true);
          field.setOpen(true);
        }}
        onSubmitEditing={commitFromText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.faint}
        style={[styles.triggerInput, hideWebOutline]}
        value={text}
      />
      {/* The input opens the calendar on focus, so the icon is a mouse-only
          affordance: keep it out of the tab order (`tabIndex={-1}`; RNW's
          Pressable ignores `focusable`) and the a11y tree, matching the mockup's
          aria-hidden icon. The outline is hidden so a mouse click leaves no ring. */}
      <Pressable
        aria-hidden
        onPress={() => field.setOpen(true)}
        style={[styles.triggerIcon, hideWebOutlineView]}
        tabIndex={-1}
      >
        <CalendarDays color={theme.colors.muted} size={16} />
      </Pressable>
    </View>
  );
}

function NativeTrigger({
  field,
  invalid,
  label,
  placeholder,
  required,
  styles,
}: TriggerProps) {
  const theme = useSharedUiTheme();
  return (
    <Pressable
      accessibilityLabel={`${label}: ${field.display || placeholder}`}
      accessibilityRole="button"
      aria-invalid={invalid}
      aria-required={required}
      onPress={() => field.setOpen(true)}
      style={[styles.trigger, triggerBorder(styles, invalid, false)]}
    >
      <Text
        style={field.display ? styles.triggerValue : styles.triggerPlaceholder}
      >
        {field.display || placeholder}
      </Text>
      <CalendarDays color={theme.colors.muted} size={16} />
    </Pressable>
  );
}

/** Border style for a trigger: rose when invalid, primary when open, else default. */
export function triggerBorder(
  styles: DateFieldStyles,
  invalid: boolean,
  open: boolean,
) {
  if (invalid) {
    return styles.triggerInvalid;
  }
  return open ? styles.triggerActive : null;
}
