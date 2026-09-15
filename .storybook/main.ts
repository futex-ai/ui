import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // No `react-native` alias: every component reaches React Native through
  // `src/primitives`, whose `.web` files delegate to `react-native-web`,
  // `lucide-react`, and DOM SVG. Storybook only has to prefer those files.
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
