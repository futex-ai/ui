/** Native-safe fallback for the web-only modal primitive. */
import type { ReactNode } from "react";

import type { WebModalPlacement, WebModalSize } from "./webModalModel";

export type WebModalFrameProps = {
  body?: ReactNode;
  children?: ReactNode;
  closeDisabled?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
  footer?: ReactNode;
  bodyStyle?: unknown;
  footerStyle?: unknown;
  headerStyle?: unknown;
  initialFocusRef?: unknown;
  onClose: () => void;
  placement?: WebModalPlacement;
  scroll?: boolean;
  showCloseButton?: boolean;
  size?: WebModalSize;
  subtitleStyle?: unknown;
  surfaceStyle?: unknown;
  subtitle?: ReactNode;
  title: string;
  titleStyle?: unknown;
  visible?: boolean;
};

export function WebModalFrame(_props: WebModalFrameProps) {
  return null;
}
