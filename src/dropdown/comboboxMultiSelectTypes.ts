/** Option and prop types for `ComboboxMultiSelect`. */
import type { IconComponent } from "../primitives/icons";

import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";

import type { DropdownHighlightVariant } from "./dropdownHighlightVariant";

/**
 * How a selected option's chip is painted: the primary tint (`default`) or a
 * neutral grey (`muted`), for a value that is still applied but no longer
 * current, such as an archived tag.
 */
export type ComboboxChipTone = "default" | "muted";

export type ComboboxMultiSelectOption = {
  /** Chip appearance for this option. Defaults to `"default"`. */
  chipTone?: ComboboxChipTone;
  /** Fill of the option's leading mark. Defaults to the theme `primary`. */
  color?: string;
  /**
   * Secondary line under the label, for example the business a tag belongs
   * to. It is the row's accessible description, so it can also say why a
   * `disabled` option cannot be chosen.
   */
  description?: string;
  /**
   * List the option but block choosing it. Assistive tech hears it as
   * disabled (`aria-disabled` on web). A value that is already selected can
   * still be removed.
   */
  disabled?: boolean;
  /**
   * Section heading the option is listed under. Groups keep the order of
   * their first option in `options`; options without a group come first,
   * with no heading.
   */
  group?: string;
  /**
   * Glyph drawn in the option's leading mark and inside its chip, for
   * example a house on property tags. Tinted by the library.
   */
  icon?: IconComponent;
  label: string;
  /** Text in the option's leading mark. Defaults to the label's first letter. */
  mark?: string;
  value: string;
};

/**
 * A pressable row pinned under the option list, outside its scroll area, for
 * an action such as creating a missing tag.
 */
export type ComboboxFooterAction = {
  /**
   * The row text for the current search query, for example `Create tag “van”`
   * for the query "van" and `Create tag` for an empty query. It is also the
   * row's accessible name.
   */
  label: (query: string) => string;
  /**
   * Runs with the current query when the row is pressed or activated with
   * Enter. The list then closes and the query clears.
   */
  onPress: (query: string) => void;
};

/**
 * Where the option list opens: an anchored `popover` below the field, or a
 * bottom `sheet` that holds the search input, its chips, and a Done action.
 */
export type ComboboxMultiSelectPresentation = "popover" | "sheet";

/** Label, help, validation, and sizing props of the field. */
export type ComboboxMultiSelectFieldProps = {
  /**
   * Accessible name for the search input. When a `label` is set the input is
   * already named from it (via `aria-labelledby`); pass this to name the bare,
   * label-less variant, or to override the name where `aria-labelledby` is not
   * honoured (e.g. iOS, which does not map it). Mirrors `Input`.
   */
  accessibilityLabel?: string;
  /** Focus the search input when the control mounts. */
  autoFocus?: boolean;
  /**
   * Corner radius (px) of the control box. Defaults to `theme.radii.md`; pass
   * `0` for square corners (e.g. an in-grid cell editor that must match a
   * square container).
   */
  borderRadius?: number;
  /** Validation message shown below the control; turns its border rose. */
  error?: string | null;
  /**
   * How the control shows keyboard focus: the shared `ring` glow, the browser's
   * `outline`, or `none` — no glow, no outline, and no focus border, which
   * leaves the caller to show focus some other way (WCAG 2.1 — 2.4.7 Focus
   * Visible, AA). Defaults to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  /** Static note rendered as the last line of the option list. */
  footer?: string;
  /** How the keyboard-focused row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  /** Helper text shown below the control. */
  hint?: string;
  /** Force the rose invalid border independent of `error`. */
  invalid?: boolean;
  /** Field label shown above the control. Omit for a bare, label-less control. */
  label?: string;
  /**
   * Supplementary help text revealed by an ⓘ button after the label. Pressing
   * the button opens a small bubble with this text (built on `Popover`);
   * screen-reader users get it from the button's description. Unlike `hint` it
   * is not shown until requested. Requires a `label` to anchor the button.
   */
  labelInfo?: string;
  /** Icon for the {@link labelInfo} button. Defaults to the lucide `Info` glyph. */
  labelInfoIcon?: IconComponent;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
  placeholder?: string;
  /** Marks the field required (adds a `*` to the label, wires `aria-required`). */
  required?: boolean;
  /**
   * Keep the control at one fixed-height row instead of wrapping selected chips,
   * showing the first selection plus a `+N` summary for the remainder. Useful
   * inside dense table and data-grid cells.
   */
  singleLine?: boolean;
  /** Control density. Defaults to `md`, matching the shared input size scale. */
  size?: ControlSize;
};

/** Grouped tag-picker behaviour. Every prop is optional and off by default. */
export type ComboboxMultiSelectPickerProps = {
  /** Pinned action row under the option list. See {@link ComboboxFooterAction}. */
  footerAction?: ComboboxFooterAction;
  /**
   * Selected values the user cannot remove: their chips have no remove
   * button and their rows show as selected but cannot be toggled. A locked
   * value missing from `values` is still shown as selected.
   */
  lockedValues?: string[];
  /** Where the option list opens. Defaults to `"popover"`. */
  presentation?: ComboboxMultiSelectPresentation;
  /**
   * Allow one selected option per `group`: choosing an option replaces the
   * group's current value, and choosing the selected option again removes
   * it. Options without a group are not limited.
   */
  singlePerGroup?: boolean;
};
