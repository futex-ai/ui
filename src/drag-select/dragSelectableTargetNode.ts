/**
 * The element of a registered target that carries its accessibility props.
 * It is the registered root, or a descendant of it when the row also holds
 * other controls, so that no control is nested inside the target's
 * `checkbox`.
 */

/** The attribute that `a11yProps` writes on web, with the target id. */
export const DRAG_SELECTABLE_TARGET_ATTRIBUTE = "data-drag-select-target";

type FocusableNode = { focus?: () => void };

type QueryableNode = FocusableNode & {
  getAttribute?: (name: string) => string | null;
  querySelectorAll?: (selector: string) => Iterable<Element>;
};

/**
 * The node that takes keyboard focus for a target: the registered node when
 * it carries the target's `a11yProps`, else the descendant that carries
 * them, else the registered node.
 */
export function dragSelectableFocusNode(
  node: unknown,
  id: string,
): FocusableNode | undefined {
  const root = node as QueryableNode | undefined;
  if (
    !root ||
    typeof root.getAttribute !== "function" ||
    typeof root.querySelectorAll !== "function"
  ) {
    return root;
  }
  if (root.getAttribute(DRAG_SELECTABLE_TARGET_ATTRIBUTE) === id) {
    return root;
  }
  for (const candidate of root.querySelectorAll(
    `[${DRAG_SELECTABLE_TARGET_ATTRIBUTE}]`,
  )) {
    if (candidate.getAttribute(DRAG_SELECTABLE_TARGET_ATTRIBUTE) === id) {
      return candidate as unknown as FocusableNode;
    }
  }
  return root;
}
