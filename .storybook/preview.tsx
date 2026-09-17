import type { Preview } from "@storybook/react-vite";

// Bundle the glyphs the theme asks for instead of borrowing the machine's:
// nothing in `theme.fonts.sans` ("Inter, -apple-system, BlinkMacSystemFont,
// Segoe UI, sans-serif") exists on Linux, so without this every text run is
// rasterized by whatever fontconfig happens to pick and the screenshot
// baselines in tests/browser/snapshots.spec.ts-snapshots would only ever match
// the machine that recorded them.
//
// These are the weights the library uses (`grep -rhoE 'fontWeight: "[0-9]+"'
// src`), in fontsource's combined per-weight builds, which declare a
// `unicode-range` per subset. The `latin-*.css` variants declare none, which
// would let them claim every codepoint and hide the symbol fallbacks registered
// under the same family. Only subsets a story uses are fetched. `./fonts` pins
// the mono stack, the web backend's unstyled-Text stack, and the symbols none
// of these files carry.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";

import { registerStorybookFonts } from "./fonts";
import "./storybook.css";

registerStorybookFonts();

const preview: Preview = {
  // Run @storybook/addon-a11y's axe check on demand (manual "Run" in the panel)
  // rather than automatically on every render. The automated WCAG gate is the
  // Playwright sweep in tests/browser/a11y.spec.ts, which injects its own axe;
  // letting the addon also auto-run axe in the preview iframe collides with it
  // ("Axe is already running"). Manual mode keeps the dev panel useful without
  // the double run.
  initialGlobals: {
    a11y: { manual: true },
  },
  parameters: {
    // Don't let the addon run axe automatically in the preview iframe — the
    // Playwright sweep (tests/browser/a11y.spec.ts) injects its own axe and the
    // two collide. `test: "off"` deterministically disables the addon's auto-run
    // (the panel can still be run on demand in dev).
    a11y: { test: "off" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
