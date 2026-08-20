/**
 * Re-runs the data-visualization palette checks against this library's real
 * chart surfaces, and reproduces the slot-order derivation on demand.
 *
 * The palette in `src/chartScales.ts` was not chosen by eye: the slot order is
 * the colourblind-safety mechanism, and it was picked by enumerating every
 * ordering of the eight hues and keeping only those that clear the gates in
 * light mode and on both dark surfaces. This script is how that claim stays
 * checkable — `tests/unit/chartPalette.test.ts` pins the resulting numbers, and
 * this prints the full report a human needs when changing them.
 *
 *   node scripts/validate-chart-palette.mjs            # report the shipped palette
 *   node scripts/validate-chart-palette.mjs --derive   # re-run the enumeration
 *
 * The checks themselves (OKLab ΔE under simulated protanopia/deuteranopia,
 * lightness band, chroma floor, contrast) are implemented here rather than
 * imported so the repo has no dependency on the authoring environment.
 */

const LIGHT_SERIES = [
  "#2a78d6",
  "#008300",
  "#e87ba4",
  "#eda100",
  "#1baf7a",
  "#eb6834",
  "#4a3aa7",
  "#e34948",
];
const DARK_SERIES = [
  "#3987e5",
  "#008300",
  "#d55181",
  "#c98500",
  "#199e70",
  "#d95926",
  "#9085e9",
  "#e66767",
];
const LIGHT_ORDINAL = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];
const DARK_ORDINAL = ["#1c5cab", "#2a78d6", "#5598e7", "#86b6ef", "#b7d3f6"];
const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

/** The surfaces the four shipped themes actually paint marks on. */
const SURFACES = [
  { name: "default light", mode: "light", surface: "#ffffff" },
  { name: "juno light", mode: "light", surface: "#FFFFFF" },
  { name: "default dark", mode: "dark", surface: "#212522" },
  { name: "juno dark", mode: "dark", surface: "#1e1c25" },
];

const CVD_TARGET = 8;
const CVD_FLOOR = 6;
const NORMAL_FLOOR = 15;
const CHROMA_FLOOR = 0.1;
const CONTRAST_MIN = 3;
const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };

// ---------------------------------------------------------------- colour math

const srgbToLinear = (v) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

function channels(hex) {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

const linearOf = (hex) => channels(hex).map(srgbToLinear);

function relativeLuminance(hex) {
  const [r, g, b] = linearOf(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/** OKLab, from linear sRGB (Björn Ottosson's matrices). */
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklch(hex) {
  const [L, a, b] = oklab(linearOf(hex));
  return [L, Math.hypot(a, b)];
}

/**
 * Machado, Oliveira & Fernandes (2009) colour-vision-deficiency simulation at
 * severity 1.0. The thresholds this script enforces are calibrated to this
 * model, so the model is part of the standard rather than an implementation
 * detail — swapping it invalidates the numbers.
 */
const CVD_MATRIX = {
  protan: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
    -0.048116, 1.051998,
  ],
  deutan: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
    0.04294, 0.968881,
  ],
  tritan: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
    0.691367, 0.3039,
  ],
};

function simulate(hex, kind) {
  if (!kind) {
    return linearOf(hex);
  }
  // The matrix is applied in **linear** light, not gamma-encoded sRGB, and the
  // result stays linear for the OKLab conversion. Simulating in sRGB space
  // instead shifts every ΔE (it reads ~1.5 higher on this palette), so the
  // colour space is part of the standard, not an implementation detail.
  const [r, g, b] = linearOf(hex);
  const m = CVD_MATRIX[kind];
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return [
    clamp(m[0] * r + m[1] * g + m[2] * b),
    clamp(m[3] * r + m[4] * g + m[5] * b),
    clamp(m[6] * r + m[7] * g + m[8] * b),
  ];
}

/** Euclidean distance in OKLab, ×100 — the ΔE used by every gate here. */
export function deltaE(a, b, kind) {
  const [l1, a1, b1] = oklab(simulate(a, kind));
  const [l2, a2, b2] = oklab(simulate(b, kind));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100;
}

// ------------------------------------------------------------------- checking

function pairsOf(n, mode) {
  if (mode === "all") {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n - i - 1 }, (_, k) => [i, i + 1 + k]),
    ).flat();
  }
  return Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
}

export function validateSeries(palette, { mode, surface, pairs = "adjacent" }) {
  const [lo, hi] = BAND[mode];
  const list = pairsOf(palette.length, pairs);
  const worstCvd = Math.min(
    ...["protan", "deutan"].flatMap((kind) =>
      list.map(([i, j]) => deltaE(palette[i], palette[j], kind)),
    ),
  );
  const worstNormal = Math.min(
    ...list.map(([i, j]) => deltaE(palette[i], palette[j])),
  );
  return {
    offBand: palette.filter((c) => oklch(c)[0] < lo || oklch(c)[0] > hi),
    lowChroma: palette.filter((c) => oklch(c)[1] < CHROMA_FLOOR),
    worstCvd,
    worstNormal,
    cvdState:
      worstCvd >= CVD_TARGET
        ? "pass"
        : worstCvd >= CVD_FLOOR
          ? "floor"
          : "fail",
    normalOk: worstNormal >= NORMAL_FLOOR,
    lowContrast: palette.filter((c) => contrast(c, surface) < CONTRAST_MIN),
  };
}

export function validateOrdinalRamp(ramp, surface) {
  const ls = ramp.map((c) => oklch(c)[0]);
  const ascending = ls.every((v, i) => i === 0 || v < ls[i - 1]);
  const descending = ls.every((v, i) => i === 0 || v > ls[i - 1]);
  const gaps = ls.slice(1).map((v, i) => Math.abs(v - ls[i]));
  // The step nearest the surface must still be visible against it.
  const nearest =
    contrast(ramp[0], surface) < contrast(ramp[ramp.length - 1], surface)
      ? ramp[0]
      : ramp[ramp.length - 1];
  return {
    monotone: ascending || descending,
    minGap: Math.min(...gaps),
    nearestContrast: contrast(nearest, surface),
  };
}

// -------------------------------------------------------------------- reports

const seriesFor = (mode) => (mode === "dark" ? DARK_SERIES : LIGHT_SERIES);
const ordinalFor = (mode) => (mode === "dark" ? DARK_ORDINAL : LIGHT_ORDINAL);
const mark = (ok) => (ok ? "PASS" : "FAIL");

function report() {
  let failed = false;
  for (const { name, mode, surface } of SURFACES) {
    const palette = seriesFor(mode);
    console.log(`\n=== ${name} (${mode}, surface ${surface}) ===`);

    const adjacent = validateSeries(palette, { mode, surface });
    const bandOk = adjacent.offBand.length === 0;
    const chromaOk = adjacent.lowChroma.length === 0;
    console.log(`  ${mark(bandOk)}  lightness band`);
    console.log(`  ${mark(chromaOk)}  chroma floor`);
    console.log(
      `  ${mark(adjacent.cvdState !== "fail")}  adjacent CVD ΔE ` +
        `${adjacent.worstCvd.toFixed(1)} (target ${CVD_TARGET})`,
    );
    console.log(
      `  ${mark(adjacent.normalOk)}  adjacent normal-vision ΔE ` +
        `${adjacent.worstNormal.toFixed(1)} (floor ${NORMAL_FLOOR})`,
    );
    console.log(
      `  relief   ${adjacent.lowContrast.length} slot(s) below ${CONTRAST_MIN}:1 ` +
        `— ${adjacent.lowContrast.join(", ") || "none"}`,
    );
    failed ||=
      !bandOk ||
      !chromaOk ||
      adjacent.cvdState === "fail" ||
      !adjacent.normalOk;

    // The all-pairs sweep discovers the series cap for scatter/bubble/small
    // multiples rather than gating: the palette is *expected* to run out, and
    // where it runs out is the number the charts enforce. Only the adjacent
    // gates and the ordinal ramp can fail this script.
    for (const n of [3, 4, 5]) {
      const all = validateSeries(palette.slice(0, n), {
        mode,
        surface,
        pairs: "all",
      });
      const verdict =
        all.cvdState === "fail" || !all.normalOk
          ? "over cap"
          : all.cvdState === "floor"
            ? "needs 2nd encoding"
            : "clean";
      console.log(
        `  all-pairs first ${n}: ${verdict.padEnd(18)} CVD ΔE ` +
          `${all.worstCvd.toFixed(1)}, normal ${all.worstNormal.toFixed(1)}`,
      );
    }

    const ordinal = validateOrdinalRamp(ordinalFor(mode), surface);
    const ordinalOk =
      ordinal.monotone &&
      ordinal.minGap >= 0.06 &&
      ordinal.nearestContrast >= 2;
    console.log(
      `  ${mark(ordinalOk)}  ordinal ramp: monotone=${ordinal.monotone}, ` +
        `min ΔL ${ordinal.minGap.toFixed(3)}, near-surface ` +
        `${ordinal.nearestContrast.toFixed(2)}:1`,
    );
    failed ||= !ordinalOk;

    const statusLine = Object.entries(STATUS)
      .map(([k, v]) => `${k} ${contrast(v, surface).toFixed(2)}:1`)
      .join("  ");
    console.log(`  status contrast: ${statusLine}`);
  }
  return failed;
}

/**
 * Re-run the derivation: enumerate every ordering of the eight hues, keep the
 * ones clearing the adjacent gates on all surfaces, and rank by how deep the
 * leading slots survive the harder all-pairs test.
 */
function derive() {
  const HUES = [
    "blue",
    "green",
    "magenta",
    "yellow",
    "aqua",
    "orange",
    "violet",
    "red",
  ];
  const byMode = {
    light: Object.fromEntries(HUES.map((h, i) => [h, LIGHT_SERIES[i]])),
    dark: Object.fromEntries(HUES.map((h, i) => [h, DARK_SERIES[i]])),
  };
  const ok = (order, mode, surface, pairs) => {
    const p = order.map((h) => byMode[mode][h]);
    const r = validateSeries(p, { mode, surface, pairs });
    return (
      r.offBand.length === 0 &&
      r.lowChroma.length === 0 &&
      r.cvdState !== "fail" &&
      r.normalOk
    );
  };
  function* perms(arr, pre = []) {
    if (!arr.length) {
      yield pre;
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      yield* perms([...arr.slice(0, i), ...arr.slice(i + 1)], [...pre, arr[i]]);
    }
  }
  let adjacentPassing = 0;
  const depth4 = [];
  for (const order of perms(HUES)) {
    if (
      !SURFACES.every(({ mode, surface }) =>
        ok(order, mode, surface, "adjacent"),
      )
    ) {
      continue;
    }
    adjacentPassing += 1;
    if (
      SURFACES.every(({ mode, surface }) =>
        ok(order.slice(0, 4), mode, surface, "all"),
      )
    ) {
      depth4.push(order.join(","));
    }
  }
  console.log(
    `\norderings clearing the adjacent gates on all surfaces: ${adjacentPassing} / 40320`,
  );
  console.log(
    `...of those, validating four leading slots all-pairs: ${depth4.length}`,
  );
  const shipped = HUES.join(",");
  console.log(
    `shipped order "${shipped}" is depth-4: ${depth4.includes(shipped)}`,
  );
}

const args = process.argv.slice(2);
if (args.includes("--derive")) {
  derive();
}
const anyFailed = report();
console.log(anyFailed ? "\nFAILED" : "\nAll checks passed.");
process.exit(anyFailed ? 1 : 0);
