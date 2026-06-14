/** Pure state helpers for the anchored popover controller. */

export type PopoverOpenState = {
  /** True when the open state is driven by the `open` prop. */
  controlled: boolean;
  /** Effective open state after reconciling controlled and internal state. */
  open: boolean;
};

/** Accessibility and press props shared by every popover trigger. */
export type PopoverTriggerProps = {
  "aria-expanded": boolean;
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
 * Builds the props spread onto a popover trigger so every trigger toggles the
 * surface on press and reports its expanded state to assistive tech.
 *
 * `aria-expanded` is kept as a single flat prop rather than nested under
 * `accessibilityState` so a consumer's own `accessibilityState` (e.g.
 * `{ disabled }`) cannot silently clobber it when the props are spread. React
 * Native maps `aria-expanded` onto `accessibilityState.expanded` on native, and
 * React Native Web maps it onto the `aria-expanded` DOM attribute on web.
 */
export function popoverTriggerProps(
  open: boolean,
  onPress: () => void,
): PopoverTriggerProps {
  return {
    "aria-expanded": open,
    onPress,
  };
}
