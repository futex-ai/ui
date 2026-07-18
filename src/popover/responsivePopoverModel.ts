/**
 * Shared, platform-agnostic contract for {@link ResponsivePopover}: one
 * controlled, externally-anchored surface that renders as an anchored popover on
 * web and a bottom sheet on native. Both platform builds
 * (`ResponsivePopover.web.tsx`, `ResponsivePopover.tsx`) implement
 * `ResponsivePopoverProps`, so a single body works on both platforms.
 */
import type { ReactNode, RefObject } from "react";
import type { View } from "react-native";

import type { DropdownPlacement } from "../dropdown";

/** Which surface the responsive popover resolved to on this platform. */
export type ResponsivePopoverLayout = "popover" | "sheet";

/** State handed to a `children` render function. */
export type ResponsivePopoverContentState = {
  /** Close from inside the body (e.g. an Apply/Done control). */
  close: () => void;
  /** `"popover"` on web, `"sheet"` on native. */
  layout: ResponsivePopoverLayout;
  /** Body height available before the content scrolls. */
  maxHeight: number;
  /** Resolved anchored placement — web only; omitted for the sheet. */
  placement?: DropdownPlacement;
};

type Focusable = { focus?: () => void };

export type ResponsivePopoverProps = {
  /**
   * Web horizontal alignment to the anchor. Default `"end"`. Note: `"center"`
   * currently falls back to `"start"` — the placement engine aligns to the
   * anchor's start or end edge only (a follow-up if a caller needs centering).
   */
  align?: "center" | "end" | "start";
  /** Web anchor the popover measures against; ignored on native. */
  anchorRef: RefObject<View | null>;
  /** Body: a node, or a render function given the per-platform content state. */
  children: ReactNode | ((state: ResponsivePopoverContentState) => ReactNode);
  /** Native sheet dismiss control label. Default `"Cancel"`. */
  dismissLabel?: string;
  /** Hide the native sheet header row. Default `false`. */
  hideSheetHeader?: boolean;
  /** Web: element focused when the surface opens. */
  initialFocusRef?: RefObject<Focusable | null>;
  /** Accessible name (required); also the native sheet's default title. */
  label: string;
  /** Web: move focus into the surface on open and back on close. Default `true`. */
  manageFocus?: boolean;
  /** Body cap; the native sheet also clamps to ~70% of the viewport. */
  maxHeight: number;
  /** Web minimum surface width. */
  minWidth?: number;
  /** Backdrop / Escape / Android-back / dismiss. */
  onClose: () => void;
  /** Controlled open state. */
  open: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Override the visible native title when it should differ from `label`. */
  title?: string;
  /** Web portal z-index override. */
  zIndex?: number;
};

/** Resolves `children` (node or render function) against the content state. */
export function resolveResponsivePopoverContent(
  children: ResponsivePopoverProps["children"],
  state: ResponsivePopoverContentState,
): ReactNode {
  return typeof children === "function" ? children(state) : children;
}
