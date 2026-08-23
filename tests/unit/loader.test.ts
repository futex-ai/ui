import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BARS_COUNT,
  BLADES_COUNT,
  barsGeometry,
  bladesGeometry,
  DOTS_COUNT,
  DOT_GRID_TRACKS,
  dotGridGeometry,
  dotsGeometry,
  PULSE_RINGS,
  pulseGeometry,
} from "../../src/loader/loaderGeometry";
import {
  buildDotBounceRange,
  DOT_BOUNCE_START,
  DOT_BOUNCE_WINDOW,
} from "../../src/loader/loaderDotsMath";
import {
  buildSawtoothRange,
  buildWaveRange,
  SAWTOOTH_EPSILON,
  WAVE_SAMPLES,
  waveIntensity,
} from "../../src/loader/loaderWaveMath";
import {
  clampFraction,
  PROGRESS_MAX,
  progressAccessibility,
} from "../../src/loader/progressValue";

const CONTROL_SIZES = [16, 24, 32, 48, 64];

// --- Wave maths -----------------------------------------------------------

test("wave intensity peaks at the phase and bottoms out half a cycle away", () => {
  assert.equal(waveIntensity(0.25, 0.25, 3), 1);
  assert.equal(waveIntensity(0.75, 0.25, 3), 0);
  // Distance is measured the short way round, so a phase near the end of the
  // cycle is still lit by a highlight arriving at the start.
  assert.equal(waveIntensity(0, 0.9, 3), waveIntensity(0.8, 0.9, 3));
});

test("wave intensity sharpness tightens the highlight without moving its peak", () => {
  const quarterOff = 0.5;
  const loose = waveIntensity(quarterOff, 0.25, 1);
  const tight = waveIntensity(quarterOff, 0.25, 4);
  assert.ok(tight < loose, "a higher exponent dims the shoulder of the wave");
  assert.equal(waveIntensity(0.25, 0.25, 1), waveIntensity(0.25, 0.25, 4));
});

test("wave range is sampled across the whole cycle in increasing order", () => {
  const { inputRange, outputRange } = buildWaveRange({
    from: 0.2,
    phase: 0.4,
    to: 1,
  });

  assert.equal(inputRange.length, WAVE_SAMPLES + 1);
  assert.equal(outputRange.length, inputRange.length);
  assert.equal(inputRange[0], 0);
  assert.equal(inputRange[inputRange.length - 1], 1);
  for (let index = 1; index < inputRange.length; index += 1) {
    assert.ok(
      inputRange[index] > inputRange[index - 1],
      "interpolation requires a strictly increasing input range",
    );
  }
});

test("wave range wraps seamlessly across the loop's reset", () => {
  const { outputRange } = buildWaveRange({ from: 0.1, phase: 0.3, to: 1 });

  // The loop restarts from 0 each iteration, so a mismatch between the two ends
  // would show up as a visible jump every cycle.
  assert.equal(outputRange[0], outputRange[outputRange.length - 1]);
});

test("wave range stays within its from/to bounds and reaches both", () => {
  // A phase on a sample boundary is hit exactly, as is its opposite.
  const { outputRange } = buildWaveRange({ from: 0.25, phase: 0.5, to: 1 });

  assert.equal(Math.max(...outputRange), 1);
  assert.equal(Math.min(...outputRange), 0.25);
});

test("wave range accepts phases outside the cycle by folding them in", () => {
  const folded = buildWaveRange({ from: 0, phase: 1.25, to: 1 });
  const direct = buildWaveRange({ from: 0, phase: 0.25, to: 1 });
  assert.deepEqual(folded.outputRange, direct.outputRange);

  const negative = buildWaveRange({ from: 0, phase: -0.25, to: 1 });
  const equivalent = buildWaveRange({ from: 0, phase: 0.75, to: 1 });
  assert.deepEqual(negative.outputRange, equivalent.outputRange);
});

test("sawtooth range ramps straight through when there is no offset", () => {
  assert.deepEqual(buildSawtoothRange({ from: 0.3, offset: 0, to: 1 }), {
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
});

test("sawtooth range resets mid-cycle for an offset element", () => {
  const offset = 1 / 3;
  const { inputRange, outputRange } = buildSawtoothRange({
    from: 0,
    offset,
    to: 1,
  });

  const wrap = 1 - offset;
  assert.equal(inputRange.length, 4);
  assert.equal(inputRange[0], 0);
  assert.equal(inputRange[1], wrap - SAWTOOTH_EPSILON);
  assert.equal(inputRange[2], wrap);
  assert.equal(inputRange[3], 1);
  for (let index = 1; index < inputRange.length; index += 1) {
    assert.ok(inputRange[index] > inputRange[index - 1]);
  }

  // The element starts a third of the way along its travel, runs out to the far
  // end, snaps back to the start, and returns to where it began.
  assert.ok(Math.abs(outputRange[0] - offset) < 1e-9);
  assert.equal(outputRange[1], 1);
  assert.equal(outputRange[2], 0);
  assert.equal(outputRange[0], outputRange[3]);
});

test("sawtooth range folds an offset of a whole cycle back to no offset", () => {
  assert.deepEqual(
    buildSawtoothRange({ from: 0, offset: 1, to: 1 }),
    buildSawtoothRange({ from: 0, offset: 0, to: 1 }),
  );
});

test("dot bounce ranges give each dot an exclusive turn", () => {
  const ranges = Array.from({ length: DOTS_COUNT }, (_, index) =>
    buildDotBounceRange({ from: 0, index, to: 1 }),
  );

  for (const [index, { inputRange, outputRange }] of ranges.entries()) {
    const start = DOT_BOUNCE_START + index * DOT_BOUNCE_WINDOW;
    assert.deepEqual(inputRange, [
      0,
      start,
      start + DOT_BOUNCE_WINDOW / 2,
      start + DOT_BOUNCE_WINDOW,
      1,
    ]);
    assert.deepEqual(outputRange, [0, 0, 1, 0, 0]);

    if (index > 0) {
      assert.equal(
        inputRange[1],
        ranges[index - 1].inputRange[3],
        "one dot starts only after the previous dot has settled",
      );
    }
  }

  assert.ok(
    ranges[DOTS_COUNT - 1].inputRange[3] < 1,
    "the sequence leaves a resting pause before it repeats",
  );
});

// --- Progress values ------------------------------------------------------

test("progress fractions are clamped, and non-finite values read as empty", () => {
  assert.equal(clampFraction(0.42), 0.42);
  assert.equal(clampFraction(-3), 0);
  assert.equal(clampFraction(7), 1);
  assert.equal(clampFraction(Number.NaN), 0);
  assert.equal(clampFraction(Number.POSITIVE_INFINITY), 0);
});

test("progress is published on ARIA's 0-100 range, not as a 0-1 fraction", () => {
  const { accessibilityValue, percent, webProps } = progressAccessibility(0.42);

  // Announced as "42%", which is what a 0-1 `now` against a 0-1 `max` would
  // leave ambiguous for assistive tech.
  assert.equal(percent, 42);
  assert.deepEqual(accessibilityValue, {
    max: PROGRESS_MAX,
    min: 0,
    now: 42,
    text: "42%",
  });
  assert.deepEqual(webProps, {
    "aria-valuemax": 100,
    "aria-valuemin": 0,
    "aria-valuenow": 42,
    "aria-valuetext": "42%",
  });
});

test("progress accessibility clamps and rounds its own input", () => {
  assert.equal(progressAccessibility(1.4).percent, 100);
  assert.equal(progressAccessibility(-0.2).percent, 0);
  assert.equal(progressAccessibility(0.005).percent, 1);
  assert.equal(progressAccessibility(Number.NaN).percent, 0);
});

// --- Geometry -------------------------------------------------------------

test("the dot grid fits inside its box at every size", () => {
  for (const size of CONTROL_SIZES) {
    const { dot, extent, gap } = dotGridGeometry(size);
    assert.ok(dot >= 2, `dots stay visible at ${size}px`);
    assert.ok(gap >= 1, `dots stay separated at ${size}px`);
    assert.equal(extent, dot * DOT_GRID_TRACKS + gap * (DOT_GRID_TRACKS - 1));
    assert.ok(extent <= size, `the grid never overflows its ${size}px box`);
  }
});

test("a bouncing dot never lifts out of its box", () => {
  for (const size of CONTROL_SIZES) {
    const { dot, gap, lift, width } = dotsGeometry(size);
    // The dot is centred, so its top edge sits at (size - dot) / 2 before the
    // lift is applied.
    assert.ok(
      lift <= (size - dot) / 2,
      `a lifted dot stays inside the ${size}px box`,
    );
    assert.ok(lift >= 1, `the bounce stays visible at ${size}px`);
    assert.ok(width > size, "three dots in a row are wider than they are tall");
    assert.equal(width, dot * DOTS_COUNT + gap * (DOTS_COUNT - 1));
  }
});

test("bars and blades scale with the box", () => {
  for (const size of CONTROL_SIZES) {
    const { bar, gap, width } = barsGeometry(size);
    assert.equal(width, bar * BARS_COUNT + gap * (BARS_COUNT - 1));
    assert.ok(bar >= 2 && gap >= 2, `bars stay legible at ${size}px`);

    const blade = bladesGeometry(size);
    assert.ok(blade.width >= 2 && blade.height >= 4);
    assert.ok(
      blade.height < size,
      "a spoke is shorter than the dial it sits in",
    );
    // Pushing a spoke out by this much lands its outer end on the box edge.
    assert.equal(blade.offset, (size - blade.height) / 2);
  }
});

test("the ripple stroke scales with the box and never disappears", () => {
  for (const size of CONTROL_SIZES) {
    const { thickness } = pulseGeometry(size);
    assert.ok(thickness >= 1, `the ring stays visible at ${size}px`);
    assert.ok(thickness < size / 2, "the ring never fills its own centre");
  }
});

test("shape element counts match the documented variants", () => {
  assert.equal(DOT_GRID_TRACKS, 3);
  assert.equal(DOTS_COUNT, 3);
  assert.equal(BARS_COUNT, 4);
  assert.equal(BLADES_COUNT, 10);
  assert.equal(PULSE_RINGS, 3);
});

// --- Component contracts --------------------------------------------------

test("loader exposes progressbar semantics and a busy state", () => {
  const source = readSource("../../src/loader/Loader.tsx");

  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(source, /aria-busy/);
  assert.match(source, /accessibilityLabel = "Loading"/);
  // The shape itself is decorative; the container carries the semantics.
  assert.match(source, /<View aria-hidden>/);
});

test("loader defaults to the ring and renders the Spinner for it", () => {
  const source = readSource("../../src/loader/Loader.tsx");

  assert.match(source, /variant = "ring"/);
  // One ring implementation in the library: the ring variant delegates rather
  // than reimplementing the arc.
  assert.match(source, /import \{ Spinner \} from "\.\.\/spinner"/);
  assert.match(source, /if \(variant === "ring"\) \{/);
  assert.match(source, /<Spinner/);
});

test("loader covers every variant with a duration and a shape", () => {
  const styles = readSource("../../src/loader/loaderStyles.ts");
  const source = readSource("../../src/loader/Loader.tsx");
  const types = readSource("../../src/loader/types.ts");

  for (const variant of [
    "bars",
    "blades",
    "dot-grid",
    "dots",
    "pulse",
    "ring",
  ]) {
    assert.ok(
      types.includes(`"${variant}"`),
      `${variant} is part of LoaderVariant`,
    );
    assert.ok(
      new RegExp(`(^|\\s)"?${variant}"?:`, "m").test(styles),
      `${variant} has a default duration`,
    );
  }
  // Every non-ring variant has a case in the shape switch.
  for (const variant of ["bars", "blades", "dot-grid", "dots", "pulse"]) {
    assert.ok(
      source.includes(`case "${variant}":`),
      `${variant} has a shape renderer`,
    );
  }
});

test("loader sizes reuse the shared spinner scale", () => {
  const styles = readSource("../../src/loader/loaderStyles.ts");

  // Swapping one variant for another must not move the surrounding layout, so
  // every loader resolves through the same size scale as the spinner.
  assert.match(styles, /resolveSpinnerSize\(size\)\.diameter/);
});

test("every animated shape drops movement under reduced motion", () => {
  for (const shape of [
    "BarsLoader",
    "DotGridLoader",
    "DotsLoader",
    "PulseLoader",
  ]) {
    const source = readSource(`../../src/loader/${shape}.tsx`);
    assert.match(
      source,
      /reducedMotion/,
      `${shape} honours the reduce-motion preference`,
    );
  }
  // Blades never move in the first place — the rotation is pure brightness — so
  // they have no separate reduced-motion path to take.
  const blades = readSource("../../src/loader/BladesLoader.tsx");
  assert.ok(!blades.includes("translateY: -offset, reducedMotion"));
  assert.match(blades, /const \{ progress \} = useLoaderWave\(duration\)/);
});

test("the loader loop slows down rather than stopping under reduced motion", () => {
  const source = readSource("../../src/loader/loaderWave.ts");

  assert.match(source, /const LOADER_REDUCED_MOTION_DURATION = 2400/);
  assert.match(
    source,
    /const cycle = reducedMotion \? LOADER_REDUCED_MOTION_DURATION : duration/,
  );
  assert.match(source, /useNativeDriver: Platform\.OS !== "web"/);
  assert.match(source, /loop\.start\(\)/);
  assert.match(source, /return \(\) => loop\.stop\(\)/);
});

test("progress bar reports a value when determinate and busy when not", () => {
  const source = readSource("../../src/loader/ProgressBar.tsx");

  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /const determinate = value !== undefined/);
  assert.match(source, /accessibilityState=\{\{ busy: !determinate \}\}/);
  assert.match(source, /accessibilityValue=\{progress\?\.accessibilityValue\}/);
  // An indeterminate bar publishes no value at all, per ARIA — `progress` is
  // null in that case, so neither the RN payload nor the ARIA attributes render.
  assert.match(
    source,
    /determinate \? progressAccessibility\(fraction\) : null/,
  );
  assert.match(source, /\{\.\.\.\(progress\?\.webProps \?\? \{\}\)\}/);
});

test("progress meters publish ARIA range attributes explicitly for web", () => {
  const source = readSource("../../src/loader/progressValue.ts");
  const bar = readSource("../../src/loader/ProgressBar.tsx");
  const ring = readSource("../../src/loader/ProgressRing.tsx");

  // react-native-web does NOT translate `accessibilityValue` into the ARIA range
  // attributes, so a web screen reader would reach a progressbar carrying no
  // value unless both are emitted. Regression guard: dropping the web props
  // silently removes the percentage on the platform most consumers ship first.
  assert.match(source, /"aria-valuenow": percent/);
  assert.match(source, /"aria-valuemin": 0/);
  assert.match(source, /"aria-valuemax": PROGRESS_MAX/);
  assert.match(source, /"aria-valuetext": text/);
  // ARIA's default range, so assistive tech announces "42%" not "0.42".
  assert.match(source, /const PROGRESS_MAX = 100/);
  assert.match(
    source,
    /Math\.round\(clampFraction\(fraction\) \* PROGRESS_MAX\)/,
  );

  // Both meters go through the one helper rather than hand-rolling the payload.
  for (const [name, componentSource] of [
    ["ProgressBar", bar],
    ["ProgressRing", ring],
  ] as const) {
    assert.match(
      componentSource,
      /from "\.\/progressValue"/,
      `${name} shares the progress value contract`,
    );
    assert.match(
      componentSource,
      /webProps/,
      `${name} emits the ARIA range attributes`,
    );
  }
});

test("progress bar sweeps a measured segment and pulses under reduced motion", () => {
  const source = readSource("../../src/loader/ProgressBar.tsx");

  // The travel is in pixels off the laid-out track, so nothing renders before
  // the first layout pass.
  assert.match(source, /onLayout/);
  assert.match(source, /if \(trackWidth === 0\) \{\s*return null;/);
  assert.match(source, /outputRange: \[-segment, trackWidth\]/);
  assert.match(source, /if \(reducedMotion\) \{/);
  // `width` is a layout property and cannot run on the native driver.
  assert.match(source, /useNativeDriver: false/);
});

test("progress ring draws a clamped arc from twelve o'clock", () => {
  const source = readSource("../../src/loader/ProgressRing.tsx");

  assert.match(source, /import Svg, \{ Circle \} from "react-native-svg"/);
  assert.match(source, /rotation=\{-90\}/);
  assert.match(source, /originX=\{center\}/);
  assert.match(
    source,
    /strokeDasharray=\{`\$\{arc\} \$\{circumference - arc\}`\}/,
  );
  // A zero-length arc with a round cap would still paint a dot.
  assert.match(source, /\{arc > 0 \?/);
  assert.match(source, /clampFraction\(value\)/);
  assert.match(source, /accessibilityValue=\{progress\.accessibilityValue\}/);
});

test("loader colors fall back to shared theme tokens", () => {
  const loader = readSource("../../src/loader/Loader.tsx");
  const bar = readSource("../../src/loader/ProgressBar.tsx");
  const ring = readSource("../../src/loader/ProgressRing.tsx");

  assert.match(loader, /color \?\? theme\.colors\.primary/);
  assert.match(bar, /color \?\? theme\.colors\.primary/);
  assert.match(bar, /trackColor \?\? theme\.colors\.border2/);
  assert.match(ring, /color \?\? theme\.colors\.primary/);
  assert.match(ring, /trackColor \?\? theme\.colors\.border2/);
});

test("loader has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const loaderSource = readSource("../../src/loader/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/loader"/);
  assert.match(loaderSource, /Loader/);
  assert.match(loaderSource, /ProgressBar/);
  assert.match(loaderSource, /ProgressRing/);
  assert.match(loaderSource, /LoaderVariant/);
  assert.match(packageJson, /"\.\/loader"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
