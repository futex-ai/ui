/** Body-level portal for the viewport-positioned Kanban drag ghost on web. */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type KanbanDragGhostPortalProps = {
  children: ReactNode;
};

/**
 * Escapes transformed or scrolling board ancestors so fixed ghost coordinates
 * remain in the same viewport coordinate system as pointer client coordinates.
 */
export function KanbanDragGhostPortal({
  children,
}: KanbanDragGhostPortalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
