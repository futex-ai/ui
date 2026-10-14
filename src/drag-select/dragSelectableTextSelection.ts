/**
 * Blocks text selection for a started drag. The block begins at the start,
 * not at the press, so a double-click or a triple-click still selects a word
 * or a paragraph.
 */

type UserSelectStyle = CSSStyleDeclaration & { webkitUserSelect?: string };

/**
 * Removes the current text highlight, blocks `selectstart`, and sets
 * `user-select: none` on the document element. Returns the function that
 * restores the old values.
 */
export function blockDragSelectableTextSelection(): () => void {
  const style = document.documentElement.style as UserSelectStyle;
  const previous = {
    userSelect: style.userSelect,
    webkitUserSelect: style.webkitUserSelect,
  };
  window.getSelection()?.removeAllRanges();
  style.userSelect = "none";
  style.webkitUserSelect = "none";
  const blockSelectStart = (event: Event) => event.preventDefault();
  document.addEventListener("selectstart", blockSelectStart, true);
  return () => {
    document.removeEventListener("selectstart", blockSelectStart, true);
    style.userSelect = previous.userSelect;
    style.webkitUserSelect = previous.webkitUserSelect ?? "";
  };
}
