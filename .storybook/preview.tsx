import type { Preview } from "@storybook/react-vite";

import "./storybook.css";

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
