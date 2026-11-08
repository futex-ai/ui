/**
 * The option, section, and trigger-variant types of {@link DropdownSelector}.
 */
import type { DropdownListEntry, DropdownRowSlot } from "./dropdownListTypes";

export type DropdownSelectorOption = {
  /**
   * Overridable accessible name for the option row. Defaults to `label`. Set it
   * to disambiguate duplicate visible labels or pin a locale-stable name for
   * `getByRole("option", { name })`.
   */
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  /** Trailing slot; see {@link DropdownRowSlot}. */
  right?: DropdownRowSlot;
  /** Trailing text (e.g. an account code); see {@link DropdownListEntry}. */
  rightText?: string;
  secondary?: string;
  /** Test identifier forwarded to this option's row (`data-testid` on web). */
  testID?: string;
  value: string;
};

export type DropdownSelectorSection = {
  options: DropdownSelectorOption[];
  title?: string;
};

export type SelectorVariant = "field" | "map" | "mobilePeriod" | "pill";
