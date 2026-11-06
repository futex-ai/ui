/**
 * The viewport overflow rule of CSS: the viewport takes the `overflow` of the
 * root element, or of `<body>` when the root element's `overflow` is `visible`
 * on both axes. The element whose overflow the viewport takes does not scroll
 * itself; the document scrolls in its place. The scroll-container search and
 * the scroll axes of the document both read this rule.
 */

/** The element whose computed `overflow` the viewport takes. */
export function dragSelectableViewportOverflowElement(
  ownerDocument: Document,
): Element {
  const root = ownerDocument.documentElement;
  const style = getComputedStyle(root);
  if (
    style.overflowX === "visible" &&
    style.overflowY === "visible" &&
    ownerDocument.body
  ) {
    return ownerDocument.body;
  }
  return root;
}
