/** Native-safe fallback for the web-only drag ghost portal. */
import type { ReactNode } from "react";

export type DragGhostPortalProps = {
  children: ReactNode;
};

/** Pointer dragging is web-only, so native never renders a drag ghost. */
export function DragGhostPortal(_props: DragGhostPortalProps) {
  return null;
}
