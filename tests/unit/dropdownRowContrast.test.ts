import assert from "node:assert/strict";
import test from "node:test";

import { loadBuiltUi, testBuilt } from "./builtUi";

/**
 * Every dropdown row state keeps its label and its `secondary` line (a
 * combobox option's `description`) at WCAG 2.1 — 1.4.3 AA (4.5:1) against the
 * fill the row is painted with, in all four shipped themes. Trailing
 * `rightText` is not covered: it keeps the muted grey on the tinted fills,
 * below AA in the default theme, as futex-ai/ui#176 tracks. The styles module
 * imports the platform seam, so this runs against the built web output under
 * `npm run test:dist`.
 */
const STATES = [
  { active: false, label: "rest", selected: false },
  { active: true, label: "active", selected: false },
  { active: false, label: "selected", selected: true },
  { active: true, label: "active selected", selected: true },
] as const;
const VARIANTS = ["dot", "ring", "ringFill", "solid"] as const;

test(
  "dropdown row text stays AA on every highlight fill in every theme",
  { skip: !testBuilt },
  async () => {
    const ui = await loadBuiltUi();
    const { createDropdownListStyles, dropdownRowHighlight } = await import(
      new URL("../../dist/node/dropdown/dropdownListStyles.js", import.meta.url)
        .href
    );
    const themes = {
      dark: ui.darkSharedUiTheme,
      default: ui.defaultSharedUiTheme,
      juno: ui.junoSharedUiTheme,
      junoDark: ui.junoDarkSharedUiTheme,
    };
    const failures: string[] = [];
    for (const [themeName, theme] of Object.entries(themes)) {
      const styles = createDropdownListStyles(theme);
      for (const variant of VARIANTS) {
        for (const state of STATES) {
          const highlight = dropdownRowHighlight(styles, theme, variant, {
            active: state.active,
            disabled: false,
            selected: state.selected,
          });
          const fill =
            colorOf(highlight.rowStyle, "backgroundColor") ??
            theme.colors.surface;
          const label =
            colorOf(highlight.labelStyle, "color") ?? styles.itemLabel.color;
          const secondary =
            colorOf(highlight.secondaryLineStyle, "color") ??
            colorOf(highlight.secondaryStyle, "color") ??
            styles.secondary.color;
          for (const [part, color] of [
            ["label", label],
            ["secondary", secondary],
          ]) {
            const ratio = contrastRatio(color, fill);
            if (ratio < 4.5) {
              failures.push(
                `${themeName} ${variant} ${state.label} ${part}: ${color} on ` +
                  `${fill} = ${ratio.toFixed(2)}:1`,
              );
            }
          }
        }
      }
    }
    assert.deepEqual(failures, []);
  },
);

function colorOf(style: unknown, key: string): string | undefined {
  const value = (style as Record<string, unknown> | null)?.[key];
  return typeof value === "string" ? value : undefined;
}

// Same formula as tests/unit/darkTheme.test.ts; every asserted token is hex.
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
