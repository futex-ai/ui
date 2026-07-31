/** Body-level portal for a viewport-positioned drag ghost on web. */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type DragGhostPortalProps = {
  children: ReactNode;
};

/**
 * Escapes transformed or scrolling ancestors so a ghost's `position: fixed`
 * coordinates stay in the same viewport coordinate system as the pointer's
 * client coordinates. A transformed ancestor (any `transform`, `filter`, or
 * `will-change`) becomes the containing block for fixed descendants, which
 * would otherwise offset the clone by that ancestor's position — so the clone
 * is rendered into `document.body` instead. Shared by every drag surface that
 * lifts a floating clone: {@link Kanban} and {@link SortableList}.
 */
export function DragGhostPortal({ children }: DragGhostPortalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
