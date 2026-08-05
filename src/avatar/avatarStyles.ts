import { StyleSheet, TextStyle } from "react-native";

import type { SharedUiTheme } from "../theme";

/** Initials color on a `solid` disc — white on the primary fill. */
const SOLID_TEXT_COLOR = "#fff";

/**
 * The disc foreground: the color the initials are drawn in, and the color the
 * dot-grid loader takes when `loading` replaces them. Resolved as a value
 * rather than only as a style so the text and the dots cannot drift apart, and
 * so a palette disc that overrode `textColor` keeps its contrast contract in
 * both states.
 */
export function avatarForegroundColor(
  theme: SharedUiTheme,
  solid: boolean,
  override?: TextStyle["color"],
): NonNullable<TextStyle["color"]> {
  return override ?? (solid ? SOLID_TEXT_COLOR : theme.colors.primaryDeep);
}

export function createAvatarStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    avatar: { alignItems: "center", justifyContent: "center" },
    avatarSoft: { backgroundColor: theme.colors.soft },
    avatarSolid: { backgroundColor: theme.colors.primary },
    avatarText: {
      ...baseText,
      color: avatarForegroundColor(theme, false),
      fontWeight: "700",
    },
    avatarTextSolid: { color: avatarForegroundColor(theme, true) },
  });
}

export type AvatarStyles = ReturnType<typeof createAvatarStyles>;
