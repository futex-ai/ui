/** The option and props types of {@link ComboboxMultiSelect}. */
import type { IconComponent } from "../primitives/icons";

import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";

import type { DropdownHighlightVariant } from "./dropdownListStyles";

export type ComboboxMultiSelectOption = {
  color?: string;
  label: string;
  mark?: string;
  value: string;
};

export type ComboboxMultiSelectProps = {
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
  onChange: (values: string[]) => void;
  options: ComboboxMultiSelectOption[];
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  values: string[];
};
