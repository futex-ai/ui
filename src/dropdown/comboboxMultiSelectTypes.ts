/** Public option and action types for {@link ComboboxMultiSelect}. */
import type { IconComponent } from "../primitives/iconTypes";

/** Chip styling for a selected option. */
export type ComboboxChipTone = "default" | "muted";

export type ComboboxMultiSelectOption = {
  /**
   * Chip styling: `"default"` (the soft primary chip) or `"muted"` (a grey
   * chip, for example for an archived tag). Defaults to `"default"`.
   */
  chipTone?: ComboboxChipTone;
  /** Fill of the row's mark circle. Defaults to `primary`. */
  color?: string;
  /**
   * Secondary line under the label, for example the business a tag belongs
   * to. On a disabled option it is the place to say why. Web announces it as
   * the row's description. Not searched.
   */
  description?: string;
  /**
   * List the option but stop it being chosen: the row is dimmed, a press or
   * Enter does nothing, and it is exposed as disabled (`aria-disabled`). Arrow
   * keys still reach it so assistive tech announces it. A selected disabled
   * option keeps a removable chip; use `lockedValues` to fix it in place.
   */
  disabled?: boolean;
  /**
   * Section heading the option is listed under. Options that share a group
   * render together, groups in the order of their first option; options
   * without one render first, with no heading. A query that matches the group
   * name lists the whole group.
   */
  group?: string;
  /**
   * Glyph shown in the row's mark (in place of the letter) and at the start of
   * the option's chip, for example a house on property tags.
   */
  icon?: IconComponent;
  label: string;
  /** Row mark text. Defaults to the label's first character. Row only. */
  mark?: string;
  value: string;
};

/** A pressable row pinned under the option list, such as "Create tag". */
export type ComboboxFooterAction = {
  /**
   * Row label for the current trimmed query, for example
   * `(query) => (query ? \`Create tag “${query}”\` : "Create tag")`.
   */
  label: (query: string) => string;
  /**
   * Runs with the trimmed query when the row is pressed or activated with
   * Enter. The list then closes and the query clears.
   */
  onPress: (query: string) => void;
};
