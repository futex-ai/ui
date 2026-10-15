/** The chips and leading marks that `ComboboxMultiSelect` draws per option. */
import { Pressable, Text, View } from "../primitives/reactNative";

import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type {
  ComboboxChipTone,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";

/** Fill, edge, and text colors for one chip tone. */
export type ComboboxChipColors = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

export type ComboboxChipPalette = Record<ComboboxChipTone, ComboboxChipColors>;

/**
 * Chips for the selected options, in the order given. A locked chip has no
 * remove button. With `singleLine` only the first chip shows, followed by a
 * `+N` summary, and no chip has a remove button.
 */
export function ComboboxChips({
  iconSize,
  isLocked,
  onRemove,
  options,
  palette,
  singleLine,
  styles,
}: {
  iconSize: number;
  isLocked: (value: string) => boolean;
  onRemove: (value: string) => void;
  options: ComboboxMultiSelectOption[];
  palette: ComboboxChipPalette;
  singleLine: boolean;
  styles: ComboboxMultiSelectStyles;
}) {
  const visible = singleLine ? options.slice(0, 1) : options;
  const hiddenCount = options.length - visible.length;
  return (
    <>
      {visible.map((option) => {
        const colors = palette[option.chipTone ?? "default"];
        const Icon = option.icon;
        return (
          <View
            key={option.value}
            style={[
              styles.chip,
              {
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            {Icon ? (
              <Icon aria-hidden color={colors.color} size={iconSize} />
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.chipText, { color: colors.color }]}
            >
              {option.label}
            </Text>
            {singleLine || isLocked(option.value) ? null : (
              <Pressable
                accessibilityLabel={`Remove ${option.label}`}
                accessibilityRole="button"
                onPress={() => onRemove(option.value)}
                style={styles.chipRemove}
              >
                {/* The visible "x" is decorative — the Pressable's name is
                    "Remove {label}". Hide it from AT so the name is not polluted
                    by the glyph (WCAG 2.5.3 Label in Name). */}
                <Text
                  aria-hidden
                  style={[styles.chipRemoveText, { color: colors.color }]}
                >
                  x
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {hiddenCount > 0 ? (
        <View
          style={[
            styles.chip,
            styles.chipSummary,
            {
              backgroundColor: palette.default.backgroundColor,
              borderColor: palette.default.borderColor,
            },
          ]}
        >
          <Text
            accessibilityLabel={`${hiddenCount} more selected`}
            style={[styles.chipText, { color: palette.default.color }]}
          >
            +{hiddenCount}
          </Text>
        </View>
      ) : null}
    </>
  );
}

/** The round mark that leads an option row: its icon, or a text mark. */
export function ComboboxOptionMark({
  option,
  styles,
}: {
  option: ComboboxMultiSelectOption;
  styles: ComboboxMultiSelectStyles;
}) {
  const Icon = option.icon;
  return (
    <View
      style={[
        styles.mark,
        option.color ? { backgroundColor: option.color } : null,
      ]}
    >
      {Icon ? (
        <Icon aria-hidden color={styles.markText.color} size={13} />
      ) : (
        <Text style={styles.markText}>
          {option.mark ?? option.label[0] ?? "?"}
        </Text>
      )}
    </View>
  );
}
