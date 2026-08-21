/** Styles for the {@link ExportDialog}'s body, progress, and status lines. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createExportStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;

  return StyleSheet.create({
    body: { gap: 12, minWidth: 320 },
    // The settings panel drops its own frame: it is already inside the modal's
    // surface, and a panel inside a panel reads as a mistake.
    settings: {
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
    },
    progress: { gap: 6 },
    progressText: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
    },
    doneText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: 12,
      fontWeight: "700",
    },
    errorText: {
      ...baseText,
      color: theme.colors.roseDeep,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}

export type ExportStyles = ReturnType<typeof createExportStyles>;
