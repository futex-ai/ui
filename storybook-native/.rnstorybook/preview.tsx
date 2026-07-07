import type { Preview } from "@storybook/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SharedUiThemeProvider } from "@firna/ui/theme";

/**
 * Wrap every story in the shared theme (so components read the same tokens as in
 * production) and a SafeAreaProvider (so the native sheet's safe-area handling
 * has insets to read once Phase 2 wires it up).
 */
const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider>
        <SharedUiThemeProvider>
          <Story />
        </SharedUiThemeProvider>
      </SafeAreaProvider>
    ),
  ],
};

export default preview;
