/**
 * DOM helpers shared by the library's pointer drags: the sortable list, the
 * drag-select provider, and the data grid.
 *
 * Every function no-ops outside the browser, so a component may import this
 * module on any platform and call it only from its web paths.
 */

/**
 * Swallow the click a committed drag produces, so a drag-release does not
 * activate whatever sits under the pointer. The click fires synchronously after
 * pointerup, before the next frame, so a one-shot capture listener eats exactly
 * it and is removed on the next frame.
 */
export function suppressNextClick(): void {
  if (typeof document === "undefined") {
    return;
  }
  const eat = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  document.addEventListener("click", eat, true);
  const remove = () => document.removeEventListener("click", eat, true);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(remove);
  } else {
    setTimeout(remove, 0);
  }
}
