/**
 * The props of the link host, shared by its native and web resolutions.
 *
 * `link.tsx` and `link.web.tsx` each fill in the style and focus-event types
 * of their own platform world, as the rest of the seam does, so this module
 * imports neither `react-native` nor the DOM backend.
 */
import type { ReactNode } from "react";

/**
 * The interaction state a link hands to a function-valued `style` and
 * `children`. `hovered` is web-only and stays `false` on native.
 */
export type LinkInteractionState = {
  /** The link holds focus. */
  focused: boolean;
  /** The pointer is over the link (web only). */
  hovered: boolean;
  /** The link is being pressed. */
  pressed: boolean;
};

/**
 * The props of a link host, over the style, focus-event, and layout-event
 * types of a platform.
 */
export type LinkHostProps<Style, Focus, Layout> = {
  /** Spoken hint read after the name. Native only. */
  accessibilityHint?: string;
  /** Accessible name. Defaults to the text inside the link. */
  accessibilityLabel?: string;
  children?: ReactNode | ((state: LinkInteractionState) => ReactNode);
  /**
   * Marks the link to the page that shows now: `aria-current="page"` on web
   * and the selected state on native. The caller decides it, because routing
   * belongs to the app.
   */
  current?: boolean;
  /** Web `data-*` attributes, such as the focus-ring markers. Ignored on native. */
  dataSet?: Record<string, string | number | boolean | null | undefined>;
  /** The destination: a path of the app or an outside address. */
  href: string;
  /**
   * Opens the destination in a new tab on web, without access to the page
   * that opened it, and the app's `onNavigate` never runs there. Native has no
   * tabs: an activation runs `onNavigate` as on any link, or the platform's
   * link handling without one.
   */
  newTab?: boolean;
  onBlur?: (event: Focus) => void;
  onFocus?: (event: Focus) => void;
  /** Fired on mount and whenever the box of the link changes. */
  onLayout?: (event: Layout) => void;
  /**
   * The app's own navigation. On web, a primary click or Enter without a
   * modifier on a same-tab link runs it instead of loading `href`; a modified
   * or middle click, and every click of a new-tab link, keep the browser's
   * link behaviour. On native every activation runs it. Without it, the
   * browser or the platform opens `href`.
   */
  onNavigate?: () => void;
  style?: Style | ((state: LinkInteractionState) => Style);
  /** Test identifier forwarded to the link (`data-testid` on web). */
  testID?: string;
};
