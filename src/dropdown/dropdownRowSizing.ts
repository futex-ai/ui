/**
 * Row sizes of the dropdown list. The standard rows keep the styles of
 * `createDropdownListStyles` exactly. The dense `xs` rows and the touch rows
 * override their geometry and type.
 */
import { StyleSheet } from "../primitives/reactNative";
import type { TextStyle } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";

import { createDropdownListStyles } from "./dropdownListStyles";
import type { DropdownListStyles } from "./dropdownListStyles";

/** The three row sizes: standard, dense (`xs`), and touch. */
export type DropdownRowKind = "dense" | "standard" | "touch";

type Weight = "400" | "600" | "700";

type RowMetrics = {
  minHeight: number;
  paddingHorizontal: number;
  paddingVertical: number;
  gap: number;
  label: { fontSize: number; lineHeight: number; fontWeight: Weight };
  secondary: { fontSize: number; lineHeight: number };
  detail: { fontSize: number; lineHeight: number; fontWeight: Weight };
  group: {
    fontSize: number;
    fontWeight: Weight;
    letterSpacing: number;
    lineHeight: number;
    paddingBottom: number;
    paddingTop: number;
  };
};

/** The note text and the glyph sizes of every row size. */
type RowExtras = {
  checkSize: number;
  iconSize: number;
  note: {
    fontSize: number;
    lineHeight: number;
    paddingBottom: number;
    paddingHorizontal: number;
    paddingTop: number;
  };
};

/** Dense `xs` rows: 26px for one line, with a 13px title at weight 400. */
const DENSE_ROW: RowMetrics = {
  minHeight: 26,
  paddingHorizontal: 8,
  paddingVertical: 4,
  gap: 8,
  label: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  secondary: { fontSize: 12, lineHeight: 16 },
  detail: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  group: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 14,
    paddingBottom: 2,
    paddingTop: 8,
  },
};

/**
 * Touch rows, whatever the size: 44px for one line, with a 15px title on a
 * 20px line and 13px details. The title and the detail keep the weight of
 * their size.
 */
function touchRow(size: ControlSize | undefined): RowMetrics {
  const dense = size === "xs";
  return {
    minHeight: touchControlMetrics.rowMinHeight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    label: {
      fontSize: touchControlMetrics.rowTitleFontSize,
      lineHeight: touchControlMetrics.rowTitleLineHeight,
      fontWeight: dense ? "400" : "700",
    },
    secondary: {
      fontSize: touchControlMetrics.rowDetailFontSize,
      lineHeight: touchControlMetrics.rowDetailLineHeight,
    },
    detail: {
      fontSize: touchControlMetrics.rowDetailFontSize,
      lineHeight: touchControlMetrics.rowDetailLineHeight,
      fontWeight: dense ? "400" : "600",
    },
    group: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: 16,
      paddingBottom: 4,
      paddingTop: 12,
    },
  };
}

const ROW_EXTRAS: Record<DropdownRowKind, RowExtras> = {
  dense: {
    checkSize: 14,
    iconSize: 14,
    note: {
      fontSize: 12,
      lineHeight: 16,
      paddingBottom: 6,
      paddingHorizontal: 8,
      paddingTop: 4,
    },
  },
  standard: {
    checkSize: 16,
    iconSize: 16,
    note: {
      fontSize: 12,
      lineHeight: 16,
      paddingBottom: 6,
      paddingHorizontal: 10,
      paddingTop: 4,
    },
  },
  touch: {
    checkSize: touchControlMetrics.iconSize,
    iconSize: touchControlMetrics.iconSize,
    note: {
      fontSize: touchControlMetrics.rowDetailFontSize,
      lineHeight: touchControlMetrics.rowDetailLineHeight,
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
  },
};

/**
 * The row size of a list. A touch surface wins over every size. Only `xs`
 * has a dense design: `sm`, `md`, `lg`, and no size draw the standard rows.
 */
export function dropdownRowKind(
  size: ControlSize | undefined,
  touch: boolean,
): DropdownRowKind {
  if (touch) return "touch";
  return size === "xs" ? "dense" : "standard";
}

/** The list styles of one row size, plus its note style and glyph sizes. */
export type DropdownRowStyles = {
  checkSize: number;
  iconSize: number;
  styles: DropdownListStyles & { note: TextStyle };
};

/**
 * Builds the list styles of a row size. The standard size returns the
 * standard styles unchanged, so the rows of every existing list keep their
 * look.
 */
export function createDropdownRowStyles(
  theme: SharedUiTheme,
  size: ControlSize | undefined,
  touch: boolean,
): DropdownRowStyles {
  const kind = dropdownRowKind(size, touch);
  const base = createDropdownListStyles(theme);
  const extras = ROW_EXTRAS[kind];
  const note: TextStyle = {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sans,
    ...extras.note,
  };
  if (kind === "standard") {
    return { ...extras, styles: { ...base, note } };
  }
  const row = kind === "touch" ? touchRow(size) : DENSE_ROW;
  return {
    ...extras,
    styles: StyleSheet.create({
      ...base,
      item: {
        ...base.item,
        borderRadius: theme.radii.sm,
        gap: row.gap,
        minHeight: row.minHeight,
        paddingHorizontal: row.paddingHorizontal,
        paddingVertical: row.paddingVertical,
      },
      itemLabel: { ...base.itemLabel, ...row.label },
      note,
      rightText: { ...base.rightText, ...row.detail },
      secondary: { ...base.secondary, ...row.secondary },
      section: {
        ...base.section,
        ...row.group,
        paddingHorizontal: row.paddingHorizontal,
      },
    }),
  };
}
