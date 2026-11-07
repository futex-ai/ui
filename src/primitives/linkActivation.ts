/**
 * When a link runs the app's navigation, and when it keeps the platform's own
 * link behaviour. The native and the web link hosts share this rule.
 */

/** The fields of a DOM click that decide whether the app navigates. */
export type LinkClick = {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

/**
 * Whether an activation of a link runs the app's navigation action.
 *
 * A link without an action always keeps the platform default. On native there
 * is no click to read, so every activation of a link with an action navigates
 * in the app, a new-tab link included: the new tab is a browser behaviour.
 *
 * On web, `click` is the DOM click. Each activation of a new-tab link keeps
 * the browser default, and so does every click but a primary click without
 * Ctrl, Meta, Shift, or Alt: a modified click opens a new tab or window, or
 * downloads, and a middle click is not a primary click. Enter on a link fires
 * a primary click, so it takes the same path. A click that something inside
 * the link already handled keeps its outcome.
 */
export function navigatesInApp(
  link: { hasAction: boolean; newTab: boolean },
  click?: LinkClick,
): boolean {
  if (!link.hasAction) {
    return false;
  }
  if (click === undefined) {
    return true;
  }
  return (
    !link.newTab &&
    click.button === 0 &&
    !click.altKey &&
    !click.ctrlKey &&
    !click.metaKey &&
    !click.shiftKey &&
    !click.defaultPrevented
  );
}
