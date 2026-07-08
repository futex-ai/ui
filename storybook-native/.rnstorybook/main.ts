import type { StorybookConfig } from "@storybook/react-native";

/**
 * On-device (native) Storybook config. Stories live in the sibling `stories/`
 * folder (the canonical SB-RN layout — referenced with `../`) and import
 * components from the linked `@firna/ui` package, so they exercise the built
 * native (`*.tsx`) variants. They can't load the library's own `src/stories`,
 * which Metro won't resolve across the project-root boundary.
 */
const main: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  deviceAddons: [
    "@storybook/addon-ondevice-actions",
    "@storybook/addon-ondevice-notes",
    "@storybook/addon-ondevice-backgrounds",
  ],
};

export default main;
