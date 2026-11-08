/** The props of the interactive {@link DropdownSelector}. */
import type { IconComponent } from "../primitives/icons";
import type { ReactNode, Ref } from "react";
import type { View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";

import type { DropdownHighlightVariant } from "./dropdownListStyles";
import type {
  DropdownSelectorOption,
  DropdownSelectorSection,
  SelectorVariant,
} from "./dropdownSelectorTypes";

export type DropdownSelectorProps = {
  error?: string | null;
  /**
   * How the trigger shows keyboard focus: the shared `ring` glow, the browser's
   * `outline`, or `none` for no focus styling at all, which leaves the caller
   * to show focus some other way (WCAG 2.1 — 2.4.7 Focus Visible, AA). Defaults
   * to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  footer?: ReactNode;
  header?: ReactNode;
  /** How focused/selected option rows are highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  hint?: string;
  invalid?: boolean;
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
  /** Maximum popup width. Defaults to 360; the trigger remains the minimum. */
  menuMaxWidth?: number;
  /** Optional popup minimum above the trigger width or variant default. */
  menuMinWidth?: number;
  onValueChange?: (value: string) => void;
  options: DropdownSelectorOption[];
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  searchable?: boolean;
  sections?: DropdownSelectorSection[];
  /** Control density of the default `field` variant: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * Handle on the underlying pressable trigger for callers that must move
   * focus imperatively, such as a modal form whose first field mounts after
   * async hydration. The selector keeps the same node as its popup anchor.
   */
  triggerRef?: Ref<View>;
  /**
   * Stable, value-independent accessible name for the trigger. When set, the
   * trigger name stays constant as the selected value changes (the value stays
   * visible in the trigger text), so `getByRole("button", { name })` keeps
   * resolving. Defaults to the composed `"{label}, {value}"` name.
   */
  triggerLabel?: string;
  value: string;
  variant?: SelectorVariant;
};
