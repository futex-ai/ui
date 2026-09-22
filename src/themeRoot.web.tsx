import type { CSSProperties, ReactNode } from "react";

import { focusRingCssVariablesFor } from "./focusRingCss";

/** Web theme boundary that makes focus variables survive static rendering. */
export function SharedUiThemeRoot({
  children,
  primary,
}: {
  children: ReactNode;
  primary: string;
}) {
  const style = {
    display: "contents",
    ...focusRingCssVariablesFor(primary),
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}
