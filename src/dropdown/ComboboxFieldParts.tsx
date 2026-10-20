/** The label row and the messages around the `ComboboxMultiSelect` control. */
import type { IconComponent } from "../primitives/icons";
import { Text, View } from "../primitives/reactNative";

import { devWarn } from "../devWarn";
import { LabelInfo } from "../input";

import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";

/**
 * The field label with its required `*` and the optional ⓘ help button.
 * Renders nothing without a `label`, and warns in development when
 * `labelInfo` has no label to sit beside.
 */
export function ComboboxFieldLabel({
  label,
  labelId,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  required,
  styles,
}: {
  label?: string;
  labelId: string;
  labelInfo?: string;
  labelInfoIcon?: IconComponent;
  labelInfoLabel?: string;
  required: boolean;
  styles: ComboboxMultiSelectStyles;
}) {
  // The ⓘ button anchors to the label row, so it needs a label to sit beside.
  if (labelInfo && !label) {
    devWarn(
      "ComboboxMultiSelect: `labelInfo` needs a `label` to anchor the ⓘ " +
        "button; it is ignored without one.",
    );
  }
  if (!label) {
    return null;
  }
  return (
    <View style={styles.labelRow}>
      {/* The label <Text> carries its own `nativeID`, so the input's
          `aria-labelledby` name is the visible label text alone — the ⓘ
          button is a sibling, never folded into the accessible name. */}
      <Text nativeID={labelId} style={styles.label}>
        {label}
        {/* Visual-only `*`; the required state is conveyed programmatically
            via `aria-required`. Hide it from AT so it does not leak into the
            input's `aria-labelledby` name. */}
        {required ? (
          <Text aria-hidden style={styles.required}>
            {" *"}
          </Text>
        ) : null}
      </Text>
      {labelInfo ? (
        <LabelInfo
          accessibilityLabel={
            labelInfoLabel ?? `More information about ${label}`
          }
          icon={labelInfoIcon}
          info={labelInfo}
        />
      ) : null}
    </View>
  );
}

/** The validation error and the helper hint under the control. */
export function ComboboxFieldMessages({
  error,
  errorId,
  hint,
  hintId,
  styles,
}: {
  error?: string | null;
  errorId: string;
  hint?: string;
  hintId: string;
  styles: ComboboxMultiSelectStyles;
}) {
  return (
    <>
      {error ? (
        // `role="alert"` (assertive live region) announces a newly-shown
        // validation message without moving focus — WCAG 2.1 4.1.3 (AA).
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
    </>
  );
}
