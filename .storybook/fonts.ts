/**
 * Pins every font the stories can reach, so a story rasterizes identically on
 * any machine and the screenshot baselines in
 * `tests/browser/snapshots.spec.ts-snapshots` are portable.
 *
 * Three stacks reach the screen and none of them name a file that exists on
 * Linux:
 *
 *   theme.fonts.sans  Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
 *   theme.fonts.mono  Menlo, Consolas, monospace
 *   RNW Text reset    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif
 *
 * `preview.tsx` imports Inter from fontsource, covering the first. The other two
 * are pinned here by registering faces under the family name each stack reaches
 * first — a registered face shadows a same-named system font, and on Linux
 * `-apple-system` and `BlinkMacSystemFont` are unknown families that are
 * skipped, so `Segoe UI` is the first name in the reset stack that can resolve.
 * Text a component leaves unstyled (about a third of the rendered characters)
 * therefore lands on Inter rather than on whatever fontconfig offers.
 *
 * Neither Inter nor JetBrains Mono carries the symbols the stories use (arrows,
 * maths relations, ⌘, ★, ✓, ✕, braille), so two Noto subsets are registered
 * under the same family names as in-family fallbacks. Two rules make that work:
 *
 *  - Every face needs a `unicodeRange`. A face without one claims every
 *    codepoint, wins the in-family match, and the symbol faces are never tried.
 *  - A symbol face must exist at every weight its family has. Chromium narrows a
 *    family to the closest weight first and only then applies `unicodeRange`, so
 *    a lone `100 900` symbol face is invisible to text set at 600. Hence the
 *    table below rather than a handful of CSS rules.
 *
 * Coverage was read from the woff2 cmaps. Nothing bundled here covers U+2728
 * (✨) or U+1F680 (🚀); both were removed from the stories instead, since a
 * colour-emoji font rasterizes differently per platform anyway.
 */
import interLatin400 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import interLatin500 from "@fontsource/inter/files/inter-latin-500-normal.woff2?url";
import interLatin600 from "@fontsource/inter/files/inter-latin-600-normal.woff2?url";
import interLatin700 from "@fontsource/inter/files/inter-latin-700-normal.woff2?url";
import monoLatin400 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url";
import monoLatin500 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url";
import monoLatin600 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2?url";
import monoLatin700 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url";
import notoMath from "@fontsource/noto-sans-math/files/noto-sans-math-latin-400-normal.woff2?url";
import notoSymbols from "@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff2?url";

/** fontsource's own Latin subset range, shared by Inter and JetBrains Mono. */
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304," +
  "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215," +
  "U+FEFF,U+FFFD";

/**
 * Arrows and maths relations, minus U+2191, U+2193, U+2212 and U+2215, which
 * Inter and JetBrains Mono do carry and should keep drawing themselves.
 */
const ARROWS_AND_MATHS =
  "U+2190,U+2192,U+2194-21FF,U+2200-2211,U+2213-2214,U+2216-22FF";

/** Technical, dingbat and braille symbols: ⌘ ⌥ ★ ✓ ✕ ⣿. */
const TECHNICAL_AND_DINGBATS = "U+2300-23FF,U+2500-27BF,U+2800-28FF";

const SANS_WEIGHTS = [400, 500, 600, 700, 800, 900];
const PINNED_WEIGHTS = [400, 500, 600, 700];

const INTER_BY_WEIGHT: Record<number, string> = {
  400: interLatin400,
  500: interLatin500,
  600: interLatin600,
  700: interLatin700,
};

const MONO_BY_WEIGHT: Record<number, string> = {
  400: monoLatin400,
  500: monoLatin500,
  600: monoLatin600,
  700: monoLatin700,
};

type PinnedFace = Readonly<{
  family: string;
  source: string;
  unicodeRange: string;
  weight: number;
}>;

function latinFaces(
  family: string,
  byWeight: Record<number, string>,
): PinnedFace[] {
  return PINNED_WEIGHTS.map((weight) => ({
    family,
    source: byWeight[weight],
    unicodeRange: LATIN,
    weight,
  }));
}

function symbolFaces(family: string, weights: number[]): PinnedFace[] {
  return weights.flatMap((weight) => [
    { family, source: notoMath, unicodeRange: ARROWS_AND_MATHS, weight },
    {
      family,
      source: notoSymbols,
      unicodeRange: TECHNICAL_AND_DINGBATS,
      weight,
    },
  ]);
}

const PINNED_FACES: PinnedFace[] = [
  // The mono stack, and the family react-native-web's unstyled Text reaches.
  ...latinFaces("Menlo", MONO_BY_WEIGHT),
  ...latinFaces("Segoe UI", INTER_BY_WEIGHT),
  // Symbol fallbacks, at every weight each family offers.
  ...symbolFaces("Inter", SANS_WEIGHTS),
  ...symbolFaces("Menlo", PINNED_WEIGHTS),
  ...symbolFaces("Segoe UI", PINNED_WEIGHTS),
];

export function registerStorybookFonts(): void {
  if (typeof document === "undefined" || !document.fonts) {
    return;
  }
  for (const face of PINNED_FACES) {
    document.fonts.add(
      new FontFace(face.family, `url(${face.source}) format("woff2")`, {
        display: "block",
        style: "normal",
        unicodeRange: face.unicodeRange,
        weight: String(face.weight),
      }),
    );
  }
}
