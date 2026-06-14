/** Branded start–end date range built from two independent single-date inputs. */
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { createDateFieldStyles } from "./dateFieldStyles";
import { DateInput, FieldLabel } from "./DateField";
import { compareIso, DateRange } from "./dateMath";
import { DatePickerVariant } from "./types";

/** Props for {@link DateRangeField}. `value` is an ISO `{ start, end }` range. */
export type DateRangeFieldProps = {
  /** Field label shown above the two inputs. */
  label: string;
  /** Current ISO range; either side may be `""` when unset. */
  value: DateRange;
  /** Called with the next range. */
  onChange: (next: DateRange) => void;
  /** Validation message shown below the field (and turns the borders rose). */
  error?: string | null;
  /** Marks the field required (adds a `*` to the label). */
  required?: boolean;
  /** Optional helper text below the field. */
  hint?: string;
  /** Earliest selectable ISO date (inclusive). */
  min?: string;
  /** Latest selectable ISO date (inclusive). */
  max?: string;
  /** Show a clear (✕) button on each endpoint once it has a value. Off by default. */
  clearable?: boolean;
  /** Calendar grid (default) or spinning day/month/year wheel bottom sheet. */
  variant?: DatePickerVariant;
};

/**
 * Start–end range field. The two endpoints are independent single-date calendars
 * — a one-calendar range picker is awkward for a long range — so each accepts any
 * date. The ordering is validated: an error shows when the start is after the end.
 */
export function DateRangeField({
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
  min,
  max,
  clearable = false,
  variant = "calendar",
}: DateRangeFieldProps) {
  const theme = useSharedUiTheme();
  const fieldStyles = useMemo(() => createDateFieldStyles(theme), [theme]);
  const styles = useMemo(() => createRangeStyles(theme), [theme]);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const anyOpen = startOpen || endOpen;

  const orderInvalid = Boolean(
    value.start && value.end && compareIso(value.start, value.end) > 0,
  );
  const shownError =
    (orderInvalid ? "The period end must be on or after the start." : null) ??
    error ??
    null;
  const invalid = Boolean(shownError);

  return (
    <View style={[fieldStyles.field, anyOpen ? fieldStyles.fieldOpen : null]}>
      <FieldLabel label={label} required={required} />
      {/* react-native-web makes every View its own z-index:0 stacking context, so
          an open endpoint's calendar (nested inside this row) is trapped here and
          would be painted over by the later-DOM hint/error siblings unless the row
          itself is lifted above them. */}
      <View style={[styles.row, anyOpen ? fieldStyles.fieldOpen : null]}>
        <DateInput
          clearable={clearable}
          flex
          invalid={invalid}
          label={`${label} start`}
          max={max}
          min={min}
          onChange={(iso) => onChange({ start: iso, end: value.end })}
          onOpenChange={setStartOpen}
          placeholder="Start"
          required={required}
          value={value.start}
          variant={variant}
        />
        <Text style={styles.sep}>→</Text>
        <DateInput
          clearable={clearable}
          flex
          invalid={invalid}
          label={`${label} end`}
          max={max}
          min={min}
          onChange={(iso) => onChange({ start: value.start, end: iso })}
          onOpenChange={setEndOpen}
          placeholder="End"
          required={required}
          value={value.end}
          variant={variant}
        />
      </View>
      {shownError ? (
        <Text style={fieldStyles.fieldError}>{shownError}</Text>
      ) : null}
      {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createRangeStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    row: { alignItems: "center", flexDirection: "row", gap: 8 },
    sep: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
  });
}
