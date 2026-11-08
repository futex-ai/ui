import { StyleSheet } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";
import {
  createTypographyStyles,
  type TextScale,
} from "../typography/typographyStyles";

/**
 * Where an empty state sits: `page` centres in the area of a view, and
 * `panel` is smaller and sits at the top of a side panel.
 */
export type EmptyStateSize = "page" | "panel";

/** The mark circle and its glyph, per size. */
const MARK = {
  page: { diameter: 44, glyph: 22 },
  panel: { diameter: 36, glyph: 18 },
} as const;

/** The diameter of the glyph in the mark of a size. */
export function emptyStateGlyphSize(size: EmptyStateSize): number {
  return MARK[size].glyph;
}

/**
 * The layout of an empty state. The title has the `h4` metrics of the active
 * text scale at every heading level, and the body is the muted body text.
 */
export function createEmptyStateStyles(
  theme: SharedUiTheme,
  scale: TextScale,
  size: EmptyStateSize,
) {
  const type = createTypographyStyles(theme, scale);
  const panel = size === "panel";
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 10,
    },
    body: {
      ...type.body,
      color: theme.colors.muted,
      maxWidth: 320,
      textAlign: "center",
    },
    empty: {
      alignItems: "center",
      gap: 6,
      ...(panel
        ? { justifyContent: "flex-start", paddingHorizontal: 16 }
        : { flex: 1, justifyContent: "center", paddingHorizontal: 24 }),
      paddingVertical: panel ? 28 : 40,
    },
    mark: {
      alignItems: "center",
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.pill,
      height: MARK[size].diameter,
      justifyContent: "center",
      marginBottom: 6,
      width: MARK[size].diameter,
    },
    title: { ...type.h4, textAlign: "center" },
  });
}
