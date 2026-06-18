/** Pure state helpers for the anchored popover controller. */

export type PopoverOpenState = {
  /** True when the open state is driven by the `open` prop. */
  controlled: boolean;
  /** Effective open state after reconciling controlled and internal state. */
  open: boolean;
};

/**
 * Role advertised on the popover surface (and used to pick the trigger's
 * `aria-haspopup` token). `dialog` for interactive content the keyboard should
 * enter; `region` for a labelled, non-modal disclosure; `tooltip` for a
 * supplemental, non-focus-managed hint.
 */
export type PopoverSurfaceRole = "dialog" | "region" | "tooltip";

/** `aria-haspopup` token forwarded to the DOM (WAI-ARIA `aria-haspopup` enum). */
export type PopoverHasPopup = "dialog" | "true";

/** Accessibility and press props shared by every popover trigger. */
export type PopoverTriggerProps = {
  /** Surface id the trigger owns, so AT can relate the two (WCAG 1.3.1). */
  "aria-controls"?: string;
  "aria-expanded": boolean;
  /** Signals that pressing the trigger reveals an overlay of this kind. */
  "aria-haspopup": PopoverHasPopup;
  onPress: () => void;
};

/**
 * Reconciles the optional controlled `open` prop with the component's own
 * internal state. When `controlledOpen` is provided the popover is controlled
 * and the internal state is ignored; otherwise the internal state wins.
 */
export function resolvePopoverOpen(
  controlledOpen: boolean | undefined,
  uncontrolledOpen: boolean,
): PopoverOpenState {
  const controlled = controlledOpen !== undefined;
  return { controlled, open: controlled ? controlledOpen : uncontrolledOpen };
}

/**
 * The `aria-haspopup` token that matches a surface role. A `dialog` surface
 * advertises `aria-haspopup="dialog"`; every other surface uses the generic
 * `"true"` (no standard `aria-haspopup` token exists for `region`/`tooltip`).
 */
export function popoverHasPopup(role: PopoverSurfaceRole): PopoverHasPopup {
  return role === "dialog" ? "dialog" : "true";
}

/**
 * Builds the props spread onto a popover trigger so every trigger toggles the
 * surface on press and exposes its relationship to assistive tech: the expanded
 * state, the kind of overlay it opens (`aria-haspopup`), and — once the surface
 * mounts — the id of the surface it controls (`aria-controls`, WCAG 1.3.1).
 *
 * These are kept as flat top-level props rather than nested under
 * `accessibilityState` so a consumer's own `accessibilityState` (e.g.
 * `{ disabled }`) cannot silently clobber them when the props are spread. React
 * Native maps `aria-expanded` onto `accessibilityState.expanded` on native, and
 * React Native Web forwards every literal `aria-*` prop straight to the DOM.
 */
export function popoverTriggerProps(
  open: boolean,
  onPress: () => void,
  options: { hasPopup?: PopoverHasPopup; surfaceId?: string } = {},
): PopoverTriggerProps {
  const { hasPopup = "true", surfaceId } = options;
  return {
    // Only advertise the controlled surface while it exists in the DOM.
    "aria-controls": open ? surfaceId : undefined,
    "aria-expanded": open,
    "aria-haspopup": hasPopup,
    onPress,
  };
}
