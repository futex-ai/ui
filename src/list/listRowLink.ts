/**
 * The state of the navigation row around the content of a {@link List} row,
 * so that a `ListItem` inside it can take the current-page title and leave out
 * the button it would nest inside the link.
 */
import { createContext, useContext } from "react";

/** The link destination of a list row. */
export type ListItemLink = {
  /**
   * The row of the page that shows now: `aria-current="page"` on web and the
   * selected state on native, with a tinted fill and a deep accent title. The
   * caller decides it, because routing belongs to the app.
   */
  current?: boolean;
  /** The destination: a path of the app or an outside address. */
  href: string;
  /**
   * Open the destination in a new tab on web. The row then shows an arrow
   * after its content, and its name ends with the new-tab note.
   */
  newTab?: boolean;
};

/** What a navigation row tells the content inside it. */
export type ListRowLinkState = { current: boolean };

export const ListRowLinkContext = createContext<ListRowLinkState | null>(null);

/** The navigation row around this content, or `null` outside one. */
export function useListRowLink(): ListRowLinkState | null {
  return useContext(ListRowLinkContext);
}
