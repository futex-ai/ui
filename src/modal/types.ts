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
  /**
   * Disable the shared focus glow on the close button. It then falls back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  dismissible?: boolean;
  footer?: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  /**
   * Web-only: element focused when the modal opens, overriding the default —
   * the first focusable control the caller rendered (the close button is
   * skipped despite coming first in DOM order). Point it at the safe action on
   * a destructive confirmation, where the default would land on the
   * destructive one. Ignored on native, which has no tab order.
   */
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  visible?: boolean;
};
