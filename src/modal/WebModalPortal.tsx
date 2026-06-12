/** Native-safe fallback for the web modal DOM portal. */
import type { ReactNode } from "react";

export type WebModalPortalProps = {
  children: ReactNode;
  visible?: boolean;
};

export function WebModalPortal(_props: WebModalPortalProps) {
  return null;
}
