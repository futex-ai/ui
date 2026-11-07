import type { TypographyVariant } from "@firna/ui/typography";

/** The numbers of one text role. Colour and casing stay with the role. */
export type TextMetrics = {
  fontSize: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
  letterSpacing: number;
};

/**
 * The proposed compact type scale for dense desktop surfaces. Its body is
 * 13 px. It keeps the nine roles of the default scale, so a surface changes
 * its scale without changing its markup. The default scale stays in force
 * everywhere else, phones included.
 */
export const compactText: Record<TypographyVariant, TextMetrics> = {
  h1: { fontSize: 20, lineHeight: 26, fontWeight: "700", letterSpacing: -0.2 },
  h2: { fontSize: 16, lineHeight: 22, fontWeight: "600", letterSpacing: -0.1 },
  h3: { fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0 },
  h4: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0 },
  h5: { fontSize: 12, lineHeight: 16, fontWeight: "600", letterSpacing: 0 },
  body: { fontSize: 13, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "500", letterSpacing: 0 },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: 0,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
};
