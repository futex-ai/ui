import { StyleSheet } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";
import {
  createTypographyStyles,
  type TextScale,
} from "../typography/typographyStyles";

/** The diameter of a lucide `icon` glyph in a notice of each text scale. */
export function noticeIconSize(scale: TextScale): number {
  return scale === "compact" ? 16 : 18;
}

/**
 * The layout of a notice. Its text is the body role of the active text scale:
 * the title at weight 600 and the body beside it. The text column has a 240px
 * basis, so the actions follow the text in a wide notice and wrap below it in
 * a narrow one. The tone colours come from `noticeColors`.
 */
export function createNoticeStyles(theme: SharedUiTheme, scale: TextScale) {
  const body = createTypographyStyles(theme, scale).body;
  const text = {
    fontFamily: body.fontFamily,
    fontSize: body.fontSize,
    letterSpacing: body.letterSpacing,
    lineHeight: body.lineHeight,
  };
  return StyleSheet.create({
    actions: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      flexWrap: "wrap",
      gap: 6,
    },
    body: { ...text, fontWeight: "400" },
    content: {
      alignItems: "center",
      columnGap: 12,
      flexBasis: 0,
      flexDirection: "row",
      flexGrow: 1,
      flexShrink: 1,
      flexWrap: "wrap",
      minWidth: 0,
      rowGap: 8,
    },
    // The glyph centres on the first line of the text.
    icon: {
      alignItems: "center",
      flexShrink: 0,
      height: body.lineHeight,
      justifyContent: "center",
    },
    notice: {
      alignItems: "flex-start",
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    text: {
      flexBasis: 240,
      flexGrow: 1,
      flexShrink: 1,
      gap: 2,
      minWidth: 0,
    },
    title: { ...text, fontWeight: "600" },
  });
}
