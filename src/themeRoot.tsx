import type { ReactNode } from "react";

/** Native theme boundary; CSS variables only exist in the web sibling. */
export function SharedUiThemeRoot({
  children,
}: {
  children: ReactNode;
  primary: string;
}) {
  return <>{children}</>;
}
