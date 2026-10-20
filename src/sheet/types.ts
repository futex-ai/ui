/**
 * Shared cross-platform prop contract for the {@link Sheet} primitive. Both
 * platform builds (`Sheet.tsx` native, `Sheet.web.tsx` web) implement
 * `SheetProps`, so the caller seam is identical everywhere — mirroring the
 * modal module's `types.ts` convention.
 */
import type { ReactNode, RefObject } from "react";
import type { TextInputProps } from "../primitives/reactNative";

/** State handed to a `Sheet` children render function. */
export type SheetContentState = {
  /**
   * Close the sheet. On native it animates the sheet down, and its dismiss then
   * fires `onClose`. On web it calls `onClose` at once.
   */
  close: () => void;
  /** Body height available before the content scrolls. */
  maxHeight: number;
};

export type SheetProps = {
  /** Body: a node, or a render function given `{ close, maxHeight }`. */
  children: ReactNode | ((state: SheetContentState) => ReactNode);
  /**
   * Native: the header dismiss control's text, default `"Cancel"`. Web: when
   * set, the close button shows this text, which also names it. Without it,
   * the web close button is an ✕ icon named `"Close {title ?? label}"`.
   */
  dismissLabel?: string;
  /**
   * Native: hide the header row (the grip handle stays). Web: hide the close
   * button; the title stays. Default `false`.
   */
  hideHeader?: boolean;
  /**
   * Element focused when the sheet opens, instead of the first focusable
   * control in the body. Web only; native has no tab order.
   */
  initialFocusRef?: RefObject<{ focus?: () => void } | null>;
  /**
   * Accessible name for the surface on both platforms (required, WCAG 4.1.2),
   * also when `title` differs. Also the default visible title when `title` is
   * omitted.
   */
  label: string;
  /** Cap on the body height; also clamped to ~70% of the viewport. */
  maxHeight?: number;
  /**
   * Dismiss: a backdrop tap or the dismiss control, on both platforms. Native
   * adds a pan down and the Android back button. Web adds Escape.
   */
  onClose: () => void;
  /** Controlled open state. */
  open: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visible title when it should read differently from `label`. */
  title?: string;
};

/**
 * Props of {@link SheetTextInput}: the platform text input props. Use the
 * input only inside a `Sheet` body.
 */
export type SheetTextInputProps = TextInputProps & {
  /** Test identifier forwarded to the input (`data-testid` on web). */
  testID?: string;
};
