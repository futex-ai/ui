import type { Preview } from "@storybook/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SharedUiThemeProvider, defaultSharedUiTheme } from "@firna/ui/theme";

/**
 * The theme every story on the device renders under. Flip to
 * `darkSharedUiTheme` (or `junoDarkSharedUiTheme`) to smoke the native host in
 * dark mode — the on-device backgrounds addon only repaints the canvas, it does
 * not drive the provider, so this constant is the switch.
 */
const HOST_THEME = defaultSharedUiTheme;

/**
 * Wrap every story in the shared theme (so components read the same tokens as in
 * production) and a SafeAreaProvider (so the native sheet's safe-area handling
 * has insets to read once Phase 2 wires it up).
 */
const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider>
        <SharedUiThemeProvider theme={HOST_THEME}>
          <Story />
        </SharedUiThemeProvider>
      </SafeAreaProvider>
    ),
  ],
};

export default preview;
