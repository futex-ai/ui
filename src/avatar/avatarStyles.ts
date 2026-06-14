import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createAvatarStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    avatar: { alignItems: "center", justifyContent: "center" },
    avatarSoft: { backgroundColor: theme.colors.soft },
    avatarSolid: { backgroundColor: theme.colors.primary },
    avatarText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontWeight: "700",
    },
    avatarTextSolid: { color: "#fff" },
  });
}

export type AvatarStyles = ReturnType<typeof createAvatarStyles>;
