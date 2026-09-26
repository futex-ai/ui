import type { CSSProperties, ReactNode } from "react";

import { focusRingCssVariablesFor } from "./focusRingCss";
import { useDomBackendCss } from "./primitives/dom/css";

/**
 * Web theme boundary that makes focus variables survive static rendering.
 *
 * It also injects `domBackendCss` on the client, so a page whose only Firna
 * code is this provider plus raw DOM controls marked through `useFocusRing`
 * still paints the glow. The injection runs in an insertion effect, so static
 * and server-rendered markup must still emit `domBackendCss` in `<head>`.
 *
 * The boundary is a real `<div>` (boxless via `display: contents`), so the
 * provider belongs around block content. Directly inside a table row, a list,
 * a paragraph, or SVG a `div` is invalid HTML and server output would fail to
 * hydrate; the README states the constraint.
 */
export function SharedUiThemeRoot({
  children,
  primary,
}: {
  children: ReactNode;
  primary: string;
}) {
  useDomBackendCss();
  const style = {
    display: "contents",
    ...focusRingCssVariablesFor(primary),
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}
