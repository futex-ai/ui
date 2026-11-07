/**
 * The link host, web resolution: a real anchor from the library's DOM backend.
 *
 * The anchor carries its `href` in static and server-rendered HTML, and the
 * browser keeps its link behaviour. Only a plain primary click or Enter runs
 * the app's `onNavigate`, which then replaces the page load. `newTab` sets
 * `target="_blank"` with `rel="noopener noreferrer"`.
 *
 * The export list mirrors `link.tsx`; a unit test diffs the two.
 */
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import { Link as DomLink } from "./dom";
import type { LinkHostProps } from "./linkTypes";
import type {
  FocusEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewInstance,
  ViewStyle,
} from "./types";

export type { LinkInteractionState } from "./linkTypes";

/** The props of a link: its destination, its state, and its look. */
export type LinkProps = LinkHostProps<
  StyleProp<ViewStyle>,
  FocusEvent,
  LayoutChangeEvent
>;

export const Link: ForwardRefExoticComponent<
  LinkProps & RefAttributes<ViewInstance>
> = DomLink;
