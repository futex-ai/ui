/**
 * Shared cross-platform prop contract for the {@link Sheet} primitive. Both
 * platform builds (`Sheet.tsx` native, `Sheet.web.tsx` web) implement
 * `SheetProps`, so the caller seam is identical everywhere — mirroring the
 * modal module's `types.ts` convention.
 */
import type { ReactNode } from "react";

/** State handed to a `Sheet` children render function. */
export type SheetContentState = {
  /** Animate the sheet closed (its dismiss then fires `onClose`). */
  close: () => void;
  /** Body height available before the content scrolls. */
  maxHeight: number;
};

export type SheetProps = {
  /** Body: a node, or a render function given `{ close, maxHeight }`. */
  children: ReactNode | ((state: SheetContentState) => ReactNode);
  /** Text for the header dismiss control. Native; default `"Cancel"`. */
  dismissLabel?: string;
  /** Hide the header row (the grip handle stays). Native; default `false`. */
  hideHeader?: boolean;
  /**
   * Accessible name for the surface (required, WCAG 4.1.2). Also the default
   * visible title when `title` is omitted.
   */
  label: string;
  /** Cap on the body height; also clamped to ~70% of the viewport. */
  maxHeight?: number;
  /** Dismiss: backdrop tap, pan-down, Android back, or the header control. */
  onClose: () => void;
  /** Controlled open state. */
  open: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visible title when it should read differently from `label`. */
  title?: string;
};
