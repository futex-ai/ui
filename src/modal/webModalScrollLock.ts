/**
 * Page scroll lock for web modals. While a dialog is open, the page under it
 * does not scroll, and hiding its scrollbar does not shift the layout. The
 * web modal stack calls the lock on its first push and the unlock on its last
 * removal, so stacked dialogs lock once and unlock once.
 */
import { webModalScrollLockPadding } from "./webModalStackModel";

/** An element's inline declaration, saved so the scroll lock can put it back. */
type InlineDeclaration = {
  readonly element: HTMLElement;
  readonly priority: string;
  readonly property: string;
  readonly value: string;
};

let scrollLockDeclarations: readonly InlineDeclaration[] = [];

/**
 * Hides the page overflow on the root element and the body, because iOS
 * Safari ignores the lock on one element alone, and pads the body by the width
 * that the hidden scrollbar gives back. Measuring that width, rather than
 * assuming a scrollbar, leaves a page that reserves its gutter unpadded. The
 * touched inline declarations are saved first, so the unlock restores them.
 */
export function lockPageScroll(): void {
  const root = document.documentElement;
  const { body } = document;
  scrollLockDeclarations = [
    saveInlineDeclaration(root, "overflow-x"),
    saveInlineDeclaration(root, "overflow-y"),
    saveInlineDeclaration(body, "overflow-x"),
    saveInlineDeclaration(body, "overflow-y"),
    saveInlineDeclaration(body, "padding-right"),
  ];
  const paddingRight =
    Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
  const clientWidthBefore = root.clientWidth;
  root.style.setProperty("overflow", "hidden");
  body.style.setProperty("overflow", "hidden");
  const padding = webModalScrollLockPadding(
    paddingRight,
    clientWidthBefore,
    root.clientWidth,
  );
  if (padding !== null) {
    body.style.setProperty("padding-right", `${padding}px`);
  }
}

/**
 * Puts back every inline declaration that the scroll lock changed, and removes
 * each property that had no inline value before the lock.
 */
export function unlockPageScroll(): void {
  for (const declaration of scrollLockDeclarations) {
    restoreInlineDeclaration(declaration);
  }
  scrollLockDeclarations = [];
}

/** Saves one property's inline value and priority on an element. */
function saveInlineDeclaration(
  element: HTMLElement,
  property: string,
): InlineDeclaration {
  return {
    element,
    priority: element.style.getPropertyPriority(property),
    property,
    value: element.style.getPropertyValue(property),
  };
}

/** Restores the saved value, or removes a property that had no inline value. */
function restoreInlineDeclaration({
  element,
  priority,
  property,
  value,
}: InlineDeclaration): void {
  if (value === "") {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value, priority);
  }
}
