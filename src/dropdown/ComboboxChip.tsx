/** A selected-value chip in `ComboboxMultiSelect`'s control. */
import { Lock } from "../primitives/icons";
import { Pressable, Text, View } from "../primitives/reactNative";

import type { ComboboxMultiSelectOption } from "./comboboxMultiSelectTypes";

/** The `ComboboxMultiSelect` styles a chip reads. */
export type ComboboxChipStyles = {
  chip: object;
  chipMuted: object;
  chipRemove: object;
  chipRemoveText: object;
  chipText: object;
  chipTextMuted: object;
};

/**
 * A chip shows the option's `icon` (when set) and label, then its trailing
 * control: a `Remove {label}` button, or, for a locked value, a decorative
 * lock in the same slot. `trailing={false}` drops the control entirely, as the
 * single-line field does.
 */
export function ComboboxChip({
  glyphColors,
  glyphSize,
  locked,
  onRemove,
  option,
  styles,
  trailing,
}: {
  /** Glyph ink per tone: `primaryDeep` for default chips, `muted` for muted. */
  glyphColors: { default: string; muted: string };
  glyphSize: number;
  locked: boolean;
  onRemove: () => void;
  option: ComboboxMultiSelectOption;
  styles: ComboboxChipStyles;
  trailing: boolean;
}) {
  const muted = option.chipTone === "muted";
  const glyphColor = muted ? glyphColors.muted : glyphColors.default;
  const Icon = option.icon;
  return (
    <View style={[styles.chip, muted ? styles.chipMuted : null]}>
      {Icon ? <Icon color={glyphColor} size={glyphSize} /> : null}
      <Text
        numberOfLines={1}
        style={[styles.chipText, muted ? styles.chipTextMuted : null]}
      >
        {option.label}
      </Text>
      {!trailing ? null : locked ? (
        // No remove button: the value is fixed. The lock explains the missing
        // control to sighted users; the list row announces the locked state.
        <View aria-hidden style={styles.chipRemove}>
          <Lock color={glyphColor} size={glyphSize - 1} />
        </View>
      ) : (
        <Pressable
          accessibilityLabel={`Remove ${option.label}`}
          accessibilityRole="button"
          onPress={onRemove}
          style={styles.chipRemove}
        >
          {/* The visible "x" is decorative — the Pressable's name is
              "Remove {label}". Hide it from AT so the name is not polluted
              by the glyph (WCAG 2.5.3 Label in Name). */}
          <Text
            aria-hidden
            style={[styles.chipRemoveText, muted ? styles.chipTextMuted : null]}
          >
            x
          </Text>
        </Pressable>
      )}
    </View>
  );
}
