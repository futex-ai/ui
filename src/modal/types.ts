/**
 * Shared prop contract for the modal frame. Both platform implementations
 * (`WebModalFrame.web.tsx` for React Native Web, `WebModalFrame.tsx` for native
 * iOS/Android) implement `WebModalFrameProps`, so the caller seam is identical on
 * every platform. Mirrors the date module's `types.ts` convention.
 */
import type { ReactNode, RefObject } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import type { WebModalPlacement, WebModalSize } from "./webModalModel";

/** Minimal focusable handle for `initialFocusRef` (web focus management only). */
export type Focusable = { focus?: () => void };

export type WebModalFrameProps = {
  body?: ReactNode;
  children?: ReactNode;
  closeDisabled?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
  footer?: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  /** Web-only: element focused when the modal opens. Ignored on native. */
  initialFocusRef?: RefObject<Focusable | null>;
  onClose: () => void;
  /** `center` (default) or `bottom-sheet` (pinned full-width to the bottom). */
  placement?: WebModalPlacement;
  scroll?: boolean;
  showCloseButton?: boolean;
  size?: WebModalSize;
  subtitleStyle?: StyleProp<TextStyle>;
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Header subtitle; a node so callers can embed inline links. */
  subtitle?: ReactNode;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  visible?: boolean;
};
