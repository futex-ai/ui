/** The accessible name, description, and state of a combobox search input. */

/** Where the search input sits: in the field, or in the sheet presentation. */
export type ComboboxSearchInputPlacement = "field" | "sheet";

/** The ids of the field's visible label, error, and hint text. */
export type ComboboxFieldTextIds = {
  errorId: string;
  hintId: string;
  labelId: string;
};

/** The field's error and hint text, and where they live. */
export type ComboboxFieldText = {
  error?: string | null;
  hint?: string;
  ids: ComboboxFieldTextIds;
  /** Web: emit the literal `aria-*` description props. Native: the hint only. */
  isWeb: boolean;
};

export type ComboboxSearchInputA11yOptions = ComboboxFieldText & {
  accessibilityLabel?: string;
  invalid: boolean;
  label?: string;
  placeholder: string;
  placement: ComboboxSearchInputPlacement;
  required: boolean;
};

/**
 * The description of a control in the field: the error, then the hint. Web
 * links their ids through `aria-describedby`, because the web backend does not
 * map `accessibilityHint` to it (WCAG 1.3.1, 3.3.1). Native reads the hint.
 */
export function comboboxFieldDescriptionA11y({
  error,
  hint,
  ids,
  isWeb,
}: ComboboxFieldText): object {
  const describedBy =
    [error ? ids.errorId : null, hint ? ids.hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    accessibilityHint: error ?? hint,
    ...(isWeb
      ? {
          "aria-describedby": describedBy,
          "aria-errormessage": error ? ids.errorId : undefined,
        }
      : {}),
  };
}

/**
 * Props for the search input of `ComboboxMultiSelect`, the same rules for the
 * input in the field and the input in the sheet:
 *
 * - Name: an explicit `accessibilityLabel` wins. Otherwise the field input
 *   points `aria-labelledby` at the visible label, so its name is that text
 *   (WCAG 2.5.3). The sheet input sits in a dialog away from the label, so it
 *   takes the label text, else the placeholder.
 * - Description: see {@link comboboxFieldDescriptionA11y}.
 * - State: `aria-invalid` and `aria-required`.
 */
export function comboboxSearchInputA11y({
  accessibilityLabel,
  error,
  hint,
  ids,
  invalid,
  isWeb,
  label,
  placeholder,
  placement,
  required,
}: ComboboxSearchInputA11yOptions): object {
  const name =
    placement === "field"
      ? {
          accessibilityLabel,
          "aria-labelledby":
            accessibilityLabel === undefined && label ? ids.labelId : undefined,
        }
      : { accessibilityLabel: accessibilityLabel ?? label ?? placeholder };
  return {
    ...name,
    ...comboboxFieldDescriptionA11y({ error, hint, ids, isWeb }),
    "aria-invalid": invalid,
    "aria-required": required,
  };
}
