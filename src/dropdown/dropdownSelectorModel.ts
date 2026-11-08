/**
 * Pure helpers of the interactive selector: the trigger's web ARIA props, its
 * accessible name, and the list entries built from the option sections.
 */
import { Platform } from "../primitives/reactNative";

import type { DropdownListEntry } from "./dropdownListTypes";
import type { DropdownSelectorSection } from "./dropdownSelectorTypes";

/**
 * Web-only ARIA props for the select-only `button` trigger: it advertises the
 * popup listbox (`aria-haspopup`) and, while open, links to the list container
 * (`aria-controls`). `aria-activedescendant` is deliberately omitted — it is not
 * an allowed attribute on `role=button` (the active option is still conveyed
 * visually and via the option's `aria-selected`). RNW's bundled types omit these
 * literal attributes, so they are built as a cast object (RNW forwards them at
 * runtime; native keeps the RN `accessibilityRole`/`accessibilityState` above).
 */
export function selectorTriggerA11y({
  controls,
  describedBy,
  interactive,
  open,
}: {
  controls: string;
  describedBy?: string;
  interactive: boolean;
  open: boolean;
}): object {
  if (Platform.OS !== "web" || !interactive) {
    return describedBy
      ? ({ "aria-describedby": describedBy } as unknown as object)
      : {};
  }
  return {
    "aria-controls": open ? controls : undefined,
    "aria-describedby": describedBy,
    "aria-haspopup": "listbox",
  } as unknown as object;
}

// Prefer an explicit, value-independent `triggerLabel` when the caller wants a
// stable test/automation handle; otherwise fall back to the composed
// `"{label}, {value}"` name so existing selectors keep resolving.
export function selectorTriggerName(
  triggerLabel: string | undefined,
  fallback: string,
) {
  return triggerLabel ?? fallback;
}

export function selectorEntries(
  sections: DropdownSelectorSection[],
  value: string,
  onSelect: (value: string) => void,
): DropdownListEntry[] {
  return sections.flatMap((section, sectionIndex) => {
    const sectionRows: DropdownListEntry[] = section.title
      ? [
          {
            id: `section-${sectionIndex}`,
            label: section.title,
            type: "section",
          },
        ]
      : [];
    return [
      ...sectionRows,
      ...section.options.map((option) => ({
        accessibilityLabel: option.accessibilityLabel,
        disabled: option.disabled,
        id: option.value,
        label: option.label,
        onPress: () => onSelect(option.value),
        right: option.right,
        rightText: option.rightText,
        secondary: option.secondary,
        selected: option.value === value,
        testID: option.testID,
        type: "item" as const,
      })),
    ];
  });
}
