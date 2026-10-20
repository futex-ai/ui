/** Keeps focus in a combobox input while the pointer presses its list. */

/** The measurements of a list region that the scrollbar check reads. */
type DropdownListRegion = {
  clientHeight: number;
  clientWidth: number;
  getBoundingClientRect: () => { right: number };
  offsetWidth: number;
  scrollHeight: number;
};

/** The part of a `mousedown` event that the handler reads. */
export type DropdownListPressEvent = {
  button: number;
  clientX: number;
  currentTarget: DropdownListRegion | null;
  preventDefault: () => void;
};

/**
 * Web props for a region of rows in a list that a combobox input controls:
 * the scroll area, and the pinned rows below it. A primary-button press on a
 * row, a heading, or any other line of the region cancels the default action
 * of `mousedown`, so focus stays in the input and the keys still reach it
 * (WCAG 2.1.1). A press on the region's scrollbar keeps its default, so the
 * scrollbar still works.
 */
export function dropdownListKeepFocusProps({
  inputKeepsFocus,
  isWeb,
}: {
  inputKeepsFocus: boolean;
  isWeb: boolean;
}): object {
  return isWeb && inputKeepsFocus ? { onMouseDown: keepInputFocus } : {};
}

function keepInputFocus(event: DropdownListPressEvent) {
  if (event.button === 0 && !pressIsOnScrollbar(event)) {
    event.preventDefault();
  }
}

/**
 * Whether the press is on the region's vertical scrollbar: the region
 * overflows, and the press is in the strip between its content box and its
 * right edge.
 */
function pressIsOnScrollbar({
  clientX,
  currentTarget: region,
}: DropdownListPressEvent): boolean {
  if (
    typeof region?.getBoundingClientRect !== "function" ||
    region.scrollHeight <= region.clientHeight
  ) {
    return false;
  }
  const scrollbarWidth = region.offsetWidth - region.clientWidth;
  return (
    scrollbarWidth > 0 &&
    clientX >= region.getBoundingClientRect().right - scrollbarWidth
  );
}
