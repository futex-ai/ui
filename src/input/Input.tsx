/** Labelled text input field with validation, icons, and an optional clear button. */
import { useMemo } from "react";
import { Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { InputFrame, InputFrameProps } from "./InputFrame";
import { createInputStyles } from "./inputStyles";

export type InputProps = InputFrameProps & {
  /** Field label shown above the input. Omit for the bare variant (box + messages, no label row). */
  label?: string;
  /** Validation message: shown below the input and turns the border rose. */
  error?: string | null;
  /** Helper text shown below the input. */
  hint?: string;
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
  error,
  hint,
  invalid = false,
  label,
  required = false,
  ...props
}: InputProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInputStyles(theme), [theme]);
  const isInvalid = Boolean(error) || invalid;
  return (
    <View style={styles.field}>
      {label === undefined ? null : (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      )}
      <InputFrame
        // Tie the visible label to the input so assistive tech names it (the
        // `<Text>` label is not a programmatic `<label>`). An explicit
        // `accessibilityLabel` still wins.
        accessibilityHint={error ?? hint}
        accessibilityLabel={accessibilityLabel ?? label}
        invalid={isInvalid}
        required={required}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
