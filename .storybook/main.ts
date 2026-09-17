import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // Prop docgen is off. Its importer resolves specifiers with react-docgen's own
  // extension list, which has no `.web` preference, so every story's
  // `src/primitives` import is followed to the *native* file and on into
  // `react-native`'s Flow source, which react-docgen cannot parse; it only
  // survives by rewriting that path to `react-native-web/dist/index.js` when the
  // package happens to be on disk. Nothing here reads docgen output — no
  // `argTypes`, no autodocs, no `.mdx`, and the suites render `iframe.html` — so
  // the option is off and the package is not installed.
  typescript: { reactDocgen: false },
  // No `react-native` alias: every component reaches React Native through
  // `src/primitives`, whose `.web` files render through the library's own DOM
  // backend (`src/primitives/dom`), `lucide-react`, and DOM SVG. Storybook only
  // has to prefer those files.
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      resolve: {
        extensions: [
          ".web.tsx",
          ".web.ts",
          ".web.jsx",
          ".web.js",
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          ".json",
        ],
      },
    }),
};

export default config;
