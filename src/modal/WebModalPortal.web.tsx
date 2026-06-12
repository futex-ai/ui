/** DOM portal used by Expo web modal surfaces. */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type WebModalPortalProps = {
  children: ReactNode;
  visible?: boolean;
};

export function WebModalPortal({
  children,
  visible = true,
}: WebModalPortalProps) {
  if (!visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
