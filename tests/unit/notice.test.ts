import assert from "node:assert/strict";
import test from "node:test";

import { noticeColors, type NoticeTone } from "../../src/notice/noticeColors";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

const presets = {
  dark: darkSharedUiTheme,
  default: defaultSharedUiTheme,
  juno: junoSharedUiTheme,
  junoDark: junoDarkSharedUiTheme,
};

test("notice text meets 4.5:1 on the fill of each tone in every preset", () => {
  for (const [preset, theme] of Object.entries(presets)) {
    for (const tone of ["neutral", "urgent"] as NoticeTone[]) {
      const colors = noticeColors(theme.colors, tone);
      for (const role of ["title", "body"] as const) {
        const ratio = contrastRatio(colors[role], colors.fill);
        assert.ok(
          ratio >= 4.5,
          `${preset} ${tone} ${role}: ${ratio.toFixed(2)}:1 is below 4.5:1`,
        );
      }
    }
  }
});

function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const channels = [0, 2, 4].map(
    (i) => parseInt(full.slice(i, i + 2), 16) / 255,
  );
  const [r, g, b] = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}
