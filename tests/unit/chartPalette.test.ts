/**
 * Pins the measured properties of the chart colour system.
 *
 * The palette was derived, not chosen: the slot order is the colourblind-safety
 * mechanism and was picked by enumerating every ordering against this library's
 * real surfaces. These tests exist so that a future token edit cannot silently
 * undo that — every number here is reproducible with
 * `node scripts/validate-chart-palette.mjs`.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  assignSeriesColors,
  divergingColor,
  rampColor,
  ALL_PAIRS_SERIES_CAP,
} from "../../src/chart/chartPalette";
import {
  CHART_SEQUENTIAL,
  CHART_STATUS,
  DARK_CHART_ORDINAL,
  DARK_CHART_SERIES,
  LIGHT_CHART_ORDINAL,
  LIGHT_CHART_SERIES,
} from "../../src/chartScales";
import {
  createSharedUiTheme,
  darkSharedUiTheme,
  defaultSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

// ---------------------------------------------------------------- colour math
// Mirrors scripts/validate-chart-palette.mjs. The CVD matrix is applied in
// linear light (the Machado 2009 model at severity 1.0); simulating in
// gamma-encoded sRGB instead shifts every result, so the space is part of the
// standard rather than an implementation detail.

const s2lin = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function channels(hex: string): number[] {
  const raw = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16) / 255);
}

const linearOf = (hex: string) => channels(hex).map(s2lin);

function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bb] = linearOf(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bb;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function oklab([r, g, b]: number[]): number[] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const MACHADO: Record<string, number[][]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};

function simulate(hex: string, kind?: string): number[] {
  const rgb = linearOf(hex);
  if (!kind) {
    return rgb;
  }
  const m = MACHADO[kind];
  return m.map((row) =>
    Math.min(
      1,
      Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]),
    ),
  );
}

function deltaE(a: string, b: string, kind?: string): number {
  const [l1, a1, b1] = oklab(simulate(a, kind));
  const [l2, a2, b2] = oklab(simulate(b, kind));
  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function worstPair(
  palette: readonly string[],
  pairs: "adjacent" | "all",
  kinds: (string | undefined)[],
): number {
  const list =
    pairs === "all"
      ? palette.flatMap((_, i) =>
          palette.slice(i + 1).map((_, k) => [i, i + 1 + k]),
        )
      : palette.slice(1).map((_, i) => [i, i + 1]);
  return Math.min(
    ...kinds.flatMap((kind) =>
      list.map(([i, j]) => deltaE(palette[i], palette[j], kind)),
    ),
  );
}

const CVD = ["protan", "deutan"];
const round = (n: number) => Math.round(n * 10) / 10;
/** Contrast is pinned at 2dp: several documented ratios sit on a .x5 edge. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** The three distinct surfaces the four shipped themes paint marks on. */
const LIGHT_SURFACE = "#ffffff";
const DARK_SURFACES = { default: "#212522", juno: "#1e1c25" };

// ------------------------------------------------------------------ the gates

test("categorical palette clears the adjacent gates in both modes", () => {
  // Bars, stacks and lines only ever put neighbouring slots side by side.
  assert.equal(round(worstPair(LIGHT_CHART_SERIES, "adjacent", CVD)), 9.1);
  assert.equal(round(worstPair(DARK_CHART_SERIES, "adjacent", CVD)), 8.4);
  // >= 8 is the target; below 6 would be a hard fail.
  assert.ok(worstPair(LIGHT_CHART_SERIES, "adjacent", CVD) >= 8);
  assert.ok(worstPair(DARK_CHART_SERIES, "adjacent", CVD) >= 8);
});

test("categorical palette clears the normal-vision floor", () => {
  // Protects full-colour readers; a hard gate that secondary encoding cannot
  // excuse.
  assert.equal(
    round(worstPair(LIGHT_CHART_SERIES, "adjacent", [undefined])),
    19.6,
  );
  assert.equal(
    round(worstPair(DARK_CHART_SERIES, "adjacent", [undefined])),
    19.3,
  );
  assert.ok(worstPair(LIGHT_CHART_SERIES, "adjacent", [undefined]) >= 15);
  assert.ok(worstPair(DARK_CHART_SERIES, "adjacent", [undefined]) >= 15);
});

test("all-pairs forms cap at four series, three of them cleanly", () => {
  const light3 = worstPair(LIGHT_CHART_SERIES.slice(0, 3), "all", CVD);
  const dark3 = worstPair(DARK_CHART_SERIES.slice(0, 3), "all", CVD);
  // Three slots separate cleanly (>= 8) in both modes.
  assert.equal(round(light3), 13.0);
  assert.equal(round(dark3), 13.0);
  assert.ok(light3 >= 8 && dark3 >= 8);

  const light4 = worstPair(LIGHT_CHART_SERIES.slice(0, 4), "all", CVD);
  const dark4 = worstPair(DARK_CHART_SERIES.slice(0, 4), "all", CVD);
  assert.equal(round(light4), 13.0);
  // The fourth slot lands in the 6-8 floor band in dark, which is why a
  // 4-series scatter must ship secondary encoding.
  assert.equal(round(dark4), 6.9);
  assert.ok(dark4 >= 6 && dark4 < 8);

  // A fifth collapses outright in dark (green vs aqua) — hence the hard cap.
  const dark5 = worstPair(DARK_CHART_SERIES.slice(0, 5), "all", CVD);
  assert.equal(round(dark5), 1.6);
  assert.ok(dark5 < 6);
  assert.equal(ALL_PAIRS_SERIES_CAP, 4);
});

test("documented series contrast ratios hold on every shipped surface", () => {
  const light = LIGHT_CHART_SERIES.map((c) =>
    round2(contrast(c, LIGHT_SURFACE)),
  );
  assert.deepEqual(light, [4.42, 4.95, 2.69, 2.17, 2.82, 3.2, 8.56, 3.95]);
  // Slots 1-2 clear 3:1, so the common one- and two-series chart never needs
  // the relief rule; slots 3-5 are the documented sub-3:1 trio.
  assert.ok(light[0] >= 3 && light[1] >= 3);
  assert.deepEqual(
    LIGHT_CHART_SERIES.filter((c) => contrast(c, LIGHT_SURFACE) < 3),
    ["#e87ba4", "#eda100", "#1baf7a"],
  );
  // In dark mode every slot clears 3:1 on both dark surfaces.
  for (const surface of Object.values(DARK_SURFACES)) {
    for (const color of DARK_CHART_SERIES) {
      assert.ok(
        contrast(color, surface) >= 3,
        `${color} on ${surface} is ${contrast(color, surface).toFixed(2)}:1`,
      );
    }
  }
});

test("ordinal ramps are monotone and stay visible against their surface", () => {
  const check = (ramp: readonly string[], surface: string, nearest: number) => {
    const ls = ramp.map((c) => oklab(linearOf(c))[0]);
    const gaps = ls.slice(1).map((v, i) => Math.abs(v - ls[i]));
    assert.ok(
      ls.every((v, i) => i === 0 || v < ls[i - 1]) ||
        ls.every((v, i) => i === 0 || v > ls[i - 1]),
      "ramp must read light -> dark without reversing",
    );
    assert.ok(
      Math.min(...gaps) >= 0.06,
      "adjacent steps must be distinguishable",
    );
    // The step nearest the surface must still clear 2:1 or it vanishes.
    const ends = [ramp[0], ramp[ramp.length - 1]];
    const near = ends.reduce((a, b) =>
      contrast(a, surface) < contrast(b, surface) ? a : b,
    );
    assert.equal(round(contrast(near, surface)), nearest);
    assert.ok(contrast(near, surface) >= 2);
  };
  check(LIGHT_CHART_ORDINAL, LIGHT_SURFACE, 2.1);
  // The dark ramp stops at step 550 because step 600 measures 1.92:1 here.
  check(DARK_CHART_ORDINAL, DARK_SURFACES.default, 2.3);
  check(DARK_CHART_ORDINAL, DARK_SURFACES.juno, 2.5);
});

test("sequential ramp is a single hue, light to dark", () => {
  const ls = CHART_SEQUENTIAL.map((c) => oklab(linearOf(c))[0]);
  assert.ok(ls.every((v, i) => i === 0 || v < ls[i - 1]));
  assert.equal(CHART_SEQUENTIAL.length, 13);
});

test("status colours stay distinct from the surface or ship icon+label", () => {
  // good and critical clear 3:1 on light; warning and serious are sub-3:1 by
  // design and rely on the mandatory icon + label pairing.
  assert.ok(contrast(CHART_STATUS.good, LIGHT_SURFACE) >= 3);
  assert.ok(contrast(CHART_STATUS.critical, LIGHT_SURFACE) >= 3);
  assert.ok(contrast(CHART_STATUS.warning, LIGHT_SURFACE) < 3);
  assert.ok(contrast(CHART_STATUS.serious, LIGHT_SURFACE) < 3);
  for (const surface of Object.values(DARK_SURFACES)) {
    for (const color of Object.values(CHART_STATUS)) {
      assert.ok(contrast(color, surface) >= 3);
    }
  }
  // No status colour may be a series colour: that is what "reserved" means.
  for (const status of Object.values(CHART_STATUS)) {
    assert.ok(!LIGHT_CHART_SERIES.includes(status as never));
    assert.ok(!DARK_CHART_SERIES.includes(status as never));
  }
});

// ------------------------------------------------------------ theme wiring

test("every shipped theme resolves chart scales matching its scheme", () => {
  const cases = [
    [defaultSharedUiTheme, LIGHT_CHART_SERIES, LIGHT_CHART_ORDINAL],
    [junoSharedUiTheme, LIGHT_CHART_SERIES, LIGHT_CHART_ORDINAL],
    [darkSharedUiTheme, DARK_CHART_SERIES, DARK_CHART_ORDINAL],
    [junoDarkSharedUiTheme, DARK_CHART_SERIES, DARK_CHART_ORDINAL],
  ] as const;
  for (const [theme, series, ordinal] of cases) {
    assert.deepEqual([...theme.charts.series], [...series]);
    assert.deepEqual([...theme.charts.ordinal], [...ordinal]);
    // Furniture tracks the theme's own neutrals, so nothing is kept in sync by
    // hand across the four presets.
    assert.equal(theme.charts.grid, theme.colors.border);
    assert.equal(theme.charts.axis, theme.colors.border2);
    assert.equal(theme.charts.label, theme.colors.muted);
    assert.equal(theme.charts.surface, theme.colors.surface);
    assert.equal(theme.charts.deemphasis, theme.colors.muted);
    // Diverging is warm/cool with a neutral grey midpoint - never a hue.
    assert.equal(theme.charts.diverging.positive, series[0]);
    assert.equal(theme.charts.diverging.negative, series[series.length - 1]);
    assert.equal(theme.charts.diverging.neutral, theme.colors.soft);
  }
});

test("de-emphasis grey clears 3:1 on every shipped surface", () => {
  for (const theme of [
    defaultSharedUiTheme,
    junoSharedUiTheme,
    darkSharedUiTheme,
    junoDarkSharedUiTheme,
  ]) {
    assert.ok(
      contrast(theme.charts.deemphasis, theme.charts.surface) >= 3,
      `${theme.charts.deemphasis} on ${theme.charts.surface}`,
    );
  }
});

test("flipping scheme re-derives chart scales rather than inheriting them", () => {
  const flipped = createSharedUiTheme({ scheme: "dark" }, defaultSharedUiTheme);
  assert.deepEqual([...flipped.charts.series], [...DARK_CHART_SERIES]);
});

test("an explicit chart override survives being extended", () => {
  const branded = createSharedUiTheme({ charts: { series: ["#111111"] } });
  assert.deepEqual([...branded.charts.series], ["#111111"]);
  const extended = createSharedUiTheme({ scheme: "dark" }, branded);
  assert.deepEqual([...extended.charts.series], ["#111111"]);
  // ...but derived furniture still follows the new palette.
  assert.equal(extended.charts.grid, extended.colors.border);
});

// -------------------------------------------------------------- assignment

const CHARTS = defaultSharedUiTheme.charts;

test("series take slots in order and hiding one never repaints the rest", () => {
  const series = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const all = assignSeriesColors(series, CHARTS);
  assert.equal(all.colorById.get("a"), CHARTS.series[0]);
  assert.equal(all.colorById.get("b"), CHARTS.series[1]);
  assert.equal(all.colorById.get("c"), CHARTS.series[2]);
  // Legend isolate hides "b" but keeps passing the full list, so "c" keeps its
  // hue - a reader who learned "c is magenta" stays right.
  const stillAll = assignSeriesColors(series, CHARTS);
  assert.equal(stillAll.colorById.get("c"), all.colorById.get("c"));
});

test("an explicit series colour wins over the slot", () => {
  const out = assignSeriesColors([{ id: "a", color: "#123456" }], CHARTS);
  assert.equal(out.colorById.get("a"), "#123456");
});

test("emphasis keeps one hue and greys the rest", () => {
  const out = assignSeriesColors(
    [{ id: "a" }, { id: "b" }, { id: "c" }],
    CHARTS,
    { emphasisId: "b" },
  );
  assert.equal(out.colorById.get("b"), CHARTS.series[0]);
  assert.equal(out.colorById.get("a"), CHARTS.deemphasis);
  assert.equal(out.colorById.get("c"), CHARTS.deemphasis);
});

test("status series wear reserved colours, not identity slots", () => {
  const out = assignSeriesColors([{ id: "errors" }, { id: "ok" }], CHARTS, {
    statusOf: (id) => (id === "errors" ? "critical" : undefined),
  });
  assert.equal(out.colorById.get("errors"), CHARTS.status.critical);
  assert.equal(out.colorById.get("ok"), CHARTS.series[1]);
});

test("a ninth series recedes instead of cycling back to slot 1", () => {
  const series = Array.from({ length: 10 }, (_, i) => ({ id: `s${i}` }));
  const out = assignSeriesColors(series, CHARTS);
  assert.equal(out.colorById.get("s8"), CHARTS.deemphasis);
  assert.equal(out.colorById.get("s9"), CHARTS.deemphasis);
  assert.notEqual(out.colorById.get("s8"), CHARTS.series[0]);
  assert.deepEqual([...out.overflowIds], ["s8", "s9"]);
  assert.equal(out.fold, false);
});

test("the fold policy reports the tail for summing", () => {
  const series = Array.from({ length: 9 }, (_, i) => ({ id: `s${i}` }));
  const out = assignSeriesColors(series, CHARTS, { overflow: "fold" });
  assert.equal(out.fold, true);
  assert.deepEqual([...out.overflowIds], ["s8"]);
});

test("all-pairs forms cap slots at four", () => {
  const series = Array.from({ length: 6 }, (_, i) => ({ id: `s${i}` }));
  const out = assignSeriesColors(series, CHARTS, { allPairs: true });
  assert.equal(out.colorById.get("s3"), CHARTS.series[3]);
  assert.equal(out.colorById.get("s4"), CHARTS.deemphasis);
  assert.deepEqual([...out.overflowIds], ["s4", "s5"]);
});

// ------------------------------------------------------------------- ramps

test("rampColor maps a fraction onto ramp steps and clamps", () => {
  const ramp = ["#000000", "#444444", "#888888", "#cccccc", "#ffffff"];
  assert.equal(rampColor(0, ramp), "#000000");
  assert.equal(rampColor(1, ramp), "#ffffff");
  assert.equal(rampColor(0.5, ramp), "#888888");
  assert.equal(rampColor(-3, ramp), "#000000");
  assert.equal(rampColor(9, ramp), "#ffffff");
  assert.equal(rampColor(Number.NaN, ramp), "#000000");
});

test("divergingColor reads zero as the neutral midpoint", () => {
  const d = CHARTS.diverging;
  assert.equal(divergingColor(0, d), d.neutral);
  assert.equal(divergingColor(4, d), d.positive);
  assert.equal(divergingColor(-4, d), d.negative);
  assert.equal(divergingColor(Number.NaN, d), d.neutral);
});

test("delta text colours clear the 4.5:1 text floor, unlike the status marks", () => {
  // The trap this guards: `status.good` is validated at the 3:1 *mark* floor
  // and measures 3.35:1 on white, so using it as delta text fails WCAG 1.4.3.
  assert.ok(contrast(CHART_STATUS.good, LIGHT_SURFACE) < 4.5);
  for (const theme of [
    defaultSharedUiTheme,
    junoSharedUiTheme,
    darkSharedUiTheme,
    junoDarkSharedUiTheme,
  ]) {
    for (const token of [
      theme.charts.deltaPositive,
      theme.charts.deltaNegative,
    ]) {
      assert.ok(
        contrast(token, theme.charts.surface) >= 4.5,
        `${token} on ${theme.charts.surface} is ${contrast(token, theme.charts.surface).toFixed(2)}:1`,
      );
    }
  }
});
