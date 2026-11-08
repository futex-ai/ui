/** The option, sizing, variant, and props types of {@link SegmentedControl}. */
import type { IconComponent } from "../primitives/icons";
import type { ReactNode } from "react";

import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";

export type SegmentOption<T extends string> = {
  /**
   * Overridable accessible name for the segment. Defaults to `label`. Set it to
   * disambiguate duplicate visible labels across controls or pin a
   * locale-stable name for `getByRole("radio", { name })`. Required in effect
   * when the control is `iconOnly` (the hidden label is the accessible name).
   */
  accessibilityLabel?: string;
  disabled?: boolean;
  /**
   * Leading lucide glyph shown before the label, tinted to match the segment's
   * text colour and sized to the control. Use {@link iconNode} for a non-lucide
   * glyph.
   */
  icon?: IconComponent;
  /**
   * A caller-supplied leading icon node (e.g. an `@expo/vector-icons` glyph),
   * rendered as-is — the caller owns its colour and size. Takes precedence over
   * {@link icon} and is hidden from assistive tech on web.
   */
  iconNode?: ReactNode;
  label: string;
  value: T;
};

export type SegmentedControlSizing = "content" | "equal";

export type SegmentedControlVariant = "outline" | "pill";

export type SegmentedControlProps<T extends string> = {
  accessibilityLabel?: string;
  /**
   * Whether the `pill` variant's selection thumb slides between options.
   * Defaults to `true`; pass `false` to snap it into place with no transition
   * (also forced off when the OS "reduce motion" setting is on). No effect on
   * the `outline` variant, which has no thumb.
   */
  animated?: boolean;
  disabled?: boolean;
  error?: string | null;
  /**
   * How the option buttons show keyboard focus: the shared `ring` glow, the
   * browser's `outline`, or `none` for no focus styling at all, which leaves
   * the caller to show focus some other way (WCAG 2.1 — 2.4.7 Focus Visible,
   * AA). Defaults to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  hint?: string;
  /**
   * Hide every option's visible label, rendering the leading icon alone for a
   * compact toolbar. Each option's (hidden) label — or its `accessibilityLabel`
   * — remains the accessible name (WCAG 1.1.1 / 4.1.2), so every option must
   * supply an `icon` or `iconNode`. Defaults to `false`.
   */
  iconOnly?: boolean;
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
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  required?: boolean;
  /** Control density. Defaults to `md`. */
  size?: ControlSize;
  /** Width strategy: `content` (default) hugs each label; `equal` shares width evenly. */
  sizing?: SegmentedControlSizing;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  value: T;
  /**
   * Visual style: `pill` (default) renders a tab-like track with the selected
   * option as a raised surface; `outline` renders separate bordered cells, the
   * right fit for rows of filter pills.
   */
  variant?: SegmentedControlVariant;
  wrap?: boolean;
};
