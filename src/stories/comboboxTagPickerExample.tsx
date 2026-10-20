/** Bookfolio-shaped grouped tag picker fixtures for Storybook. */
import { Car, House } from "../primitives/icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { ComboboxMultiSelect, useSharedUiTheme } from "../index";
import type {
  ComboboxMultiSelectOption,
  ComboboxMultiSelectPresentation,
} from "../index";

const tagOptions: ComboboxMultiSelectOption[] = [
  {
    description: "UK rental property",
    group: "Properties",
    icon: House,
    label: "Flat 2, 14 Brook Street",
    value: "flat2",
  },
  {
    description: "UK rental property",
    group: "Properties",
    icon: House,
    label: "Flat 3, 14 Brook Street",
    value: "flat3",
  },
  {
    description: "UK rental property",
    group: "Vehicles",
    icon: Car,
    label: "Renault Kangoo BX19 KLM",
    value: "van",
  },
  {
    description: "Consultancy trade",
    disabled: true,
    group: "Vehicles",
    icon: Car,
    label: "Skoda Octavia WK21 LMN",
    value: "skoda",
  },
  {
    chipLeading: ({ color }) => <ChipMark color={color} letter="L" />,
    chipTone: "muted",
    description: "Archived",
    group: "Projects",
    label: "Loft conversion",
    value: "loft",
  },
  {
    chipLeading: ({ color }) => <ChipMark color={color} letter="W" />,
    description: "Consultancy trade",
    group: "Projects",
    label: "Website rebuild",
    value: "website",
  },
];

/** A project tag's text mark, drawn in the chip's text color. */
function ChipMark({ color, letter }: { color: string; letter: string }) {
  return <Text style={[styles.chipMark, { color }]}>{letter}</Text>;
}

/**
 * A transaction's Tags field: one tag per group, the posted property locked,
 * a tag from another business listed but unavailable, an archived tag in a
 * muted chip, and a pinned action that creates a tag from the search text.
 * `autoFocus` opens the popover list on mount, and `startOpen` opens the sheet,
 * so the snapshot and accessibility sweeps cover the open states.
 */
export function GroupedTagPickerExample({
  autoFocus = false,
  hint,
  presentation = "popover",
  startOpen = false,
}: {
  autoFocus?: boolean;
  hint?: string;
  presentation?: ComboboxMultiSelectPresentation;
  startOpen?: boolean;
}) {
  const theme = useSharedUiTheme();
  // The field has no `open` prop, so the story presses the sheet button once.
  useEffect(() => {
    if (startOpen && typeof document !== "undefined") {
      document
        .querySelector<HTMLElement>(
          '[data-testid="grouped-tag-picker"] [aria-haspopup="dialog"]',
        )
        ?.click();
    }
  }, [startOpen]);
  const [options, setOptions] = useState(tagOptions);
  const [values, setValues] = useState(["flat2", "loft"]);
  const [lastCreate, setLastCreate] = useState<string | null>(null);
  return (
    <View style={styles.example}>
      <ComboboxMultiSelect
        autoFocus={autoFocus}
        footerAction={{
          label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
          onPress: (query) => {
            const label = query || `Tag ${options.length + 1}`;
            const value = `tag-${options.length + 1}`;
            // A new tag has no group yet, so one-per-group leaves it alone.
            setOptions((current) => [...current, { label, value }]);
            setValues((current) => [...current, value]);
            setLastCreate(label);
          },
        }}
        hint={hint}
        label="Tags"
        labelInfo="Tags group transactions by property, vehicle, project or anything else you track."
        lockedValues={["flat2"]}
        onChange={setValues}
        options={options}
        placeholder="Add tag"
        presentation={presentation}
        singlePerGroup
        testID="grouped-tag-picker"
        values={values}
      />
      <Text style={[styles.status, { color: theme.colors.ink2 }]}>
        {lastCreate ? `Created tag: ${lastCreate}` : "No tag created yet"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipMark: { fontSize: 11, fontWeight: "800", lineHeight: 16 },
  example: { gap: 14, minWidth: 320 },
  status: { fontSize: 12, lineHeight: 18 },
});
