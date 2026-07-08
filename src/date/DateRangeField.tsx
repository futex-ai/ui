/** Branded start–end date range built from two independent single-date inputs. */
import { useId, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { createDateFieldStyles } from "./dateFieldStyles";
import { DateInput, FieldLabel } from "./DateField";
import { dateFieldZIndex } from "./dateFieldLayers";
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
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** z-index for the open calendar wrappers and web popover frames. */
  zIndex?: number;
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
  size = "md",
  zIndex,
}: DateRangeFieldProps) {
  const theme = useSharedUiTheme();
  // The wrapper only reads size-independent chrome (label / error / hint / open
  // z-index); the per-size trigger geometry lives on the two DateInputs. Thread
  // `size` anyway so the range field stays in lockstep with DateField/DateInput
  // if a size-dependent token is ever added to the wrapper.
  const fieldStyles = useMemo(
    () => createDateFieldStyles(theme, size),
    [theme, size],
  );
  const styles = useMemo(() => createRangeStyles(theme), [theme]);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const anyOpen = startOpen || endOpen;
  const openLayer = useMemo(
    () => ({ zIndex: dateFieldZIndex(zIndex) }),
    [zIndex],
  );

  const orderInvalid = Boolean(
    value.start && value.end && compareIso(value.start, value.end) > 0,
  );
  const shownError =
    (orderInvalid ? "The period end must be on or after the start." : null) ??
    error ??
    null;
  const invalid = Boolean(shownError);

  // Stable ids so both endpoints can point `aria-describedby`/`aria-errormessage`
  // at the shared error/hint text (RNW does not map `accessibilityHint` to
  // `aria-describedby` on web) — WCAG 2.1 3.3.1 / 3.3.2 / 1.3.1.
  const errorId = useId();
  const hintId = useId();
  const describedBy =
    [shownError ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <View style={[fieldStyles.field, anyOpen ? openLayer : null]}>
      <FieldLabel label={label} required={required} />
      {/* react-native-web makes every View its own z-index:0 stacking context, so
          an open endpoint's calendar (nested inside this row) is trapped here and
          would be painted over by the later-DOM hint/error siblings unless the row
          itself is lifted above them. */}
      <View style={[styles.row, anyOpen ? openLayer : null]}>
        <DateInput
          clearable={clearable}
          describedById={describedBy}
          errorId={shownError ? errorId : undefined}
          errorText={shownError ?? undefined}
          flex
          hintText={hint}
          invalid={invalid}
          label={`${label} start`}
          max={max}
          min={min}
          onChange={(iso) => onChange({ start: iso, end: value.end })}
          onOpenChange={setStartOpen}
          placeholder="Start"
          required={required}
          size={size}
          value={value.start}
          variant={variant}
          zIndex={zIndex}
        />
        <Text style={styles.sep}>→</Text>
        <DateInput
          clearable={clearable}
          describedById={describedBy}
          errorId={shownError ? errorId : undefined}
          errorText={shownError ?? undefined}
          flex
          hintText={hint}
          invalid={invalid}
          label={`${label} end`}
          max={max}
          min={min}
          onChange={(iso) => onChange({ start: value.start, end: iso })}
          onOpenChange={setEndOpen}
          placeholder="End"
          required={required}
          size={size}
          value={value.end}
          variant={variant}
          zIndex={zIndex}
        />
      </View>
      {/* The error is a polite live region so a newly-shown validation message is
          announced without moving focus (WCAG 2.1 4.1.3 Status Messages, AA). */}
      {shownError ? (
        <Text
          accessibilityLiveRegion="polite"
          nativeID={errorId}
          style={fieldStyles.fieldError}
        >
          {shownError}
        </Text>
      ) : null}
      {hint ? (
        <Text nativeID={hintId} style={fieldStyles.hint}>
          {hint}
        </Text>
      ) : null}
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
