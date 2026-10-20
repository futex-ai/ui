/** Shared, unstyled body-level portal container for web modal frames. */

/** Identifies the shared modal container, which is never background page content. */
export const WEB_MODAL_ROOT_ATTRIBUTE = "data-firna-modal-root";

let root: HTMLElement | null = null;

/** Reuses the connected root, finds or creates one, and returns null during SSR. */
export function getWebModalRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  if (root?.isConnected) {
    return root;
  }
  root = document.querySelector<HTMLElement>(`[${WEB_MODAL_ROOT_ATTRIBUTE}]`);
  if (!root) {
    root = document.createElement("div");
    root.setAttribute(WEB_MODAL_ROOT_ATTRIBUTE, "");
    document.body.appendChild(root);
  }
  return root;
}
