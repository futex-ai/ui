import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "./render.css";

import type { ReactNode } from "react";
import type { RenderInput } from "@mokly/mokly";
import { domBackendCss } from "@firna/ui";
import { SharedUiThemeProvider } from "@firna/ui/theme";

import { themeFor, tokensCss } from "./theme";

/**
 * Wraps each screen in the library theme of its colour scheme. A view runs
 * no script, so the DOM backend stylesheet and the token variables are
 * written into the document as style elements.
 *
 * Mokly requires the renderer to be the default export.
 */
export default function render(input: RenderInput): ReactNode {
  const theme = themeFor(input.colorScheme);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: domBackendCss }} />
      <style dangerouslySetInnerHTML={{ __html: tokensCss(theme) }} />
      <SharedUiThemeProvider theme={theme}>{input.node}</SharedUiThemeProvider>
    </>
  );
}
