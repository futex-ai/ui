/** Native-safe fallback for the web-only Kanban drag ghost portal. */
import type { ReactNode } from "react";

export type KanbanDragGhostPortalProps = {
  children: ReactNode;
};

/** Pointer dragging is web-only, so native never renders a drag ghost. */
export function KanbanDragGhostPortal(_props: KanbanDragGhostPortalProps) {
  return null;
}
