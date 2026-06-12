import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const svgShim = fileURLToPath(
  new URL("./react-native-svg-shim.tsx", import.meta.url),
);

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      resolve: {
        alias: [
          {
            find: /^react-native$/,
            replacement: "react-native-web",
          },
          {
            find: /^react-native-svg$/,
            replacement: svgShim,
          },
        ],
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
