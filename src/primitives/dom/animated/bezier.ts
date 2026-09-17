/**
 * A cubic bézier timing curve, as `Easing.bezier` builds one.
 *
 * Transcribed from React Native's `Animated/bezier.js` as `react-native-web`
 * 0.21.2 vendors it (itself from Gaëtan Renaudeau's `bezier-easing`, MIT). The
 * curve is sampled into a small table once, then a Newton-Raphson pass — or a
 * binary subdivision where the slope is too flat for it — inverts x to t.
 *
 * Pure; `tests/unit/domEasing.test.ts` pins it.
 */

// Empirical: the point where more precision stops being worth the work.
const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

function A(aA1: number, aA2: number): number {
  return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}

function B(aA1: number, aA2: number): number {
  return 3.0 * aA2 - 6.0 * aA1;
}

function C(aA1: number): number {
  return 3.0 * aA1;
}

/** `x(t)` given `t, x1, x2`, or `y(t)` given `t, y1, y2`. */
function calcBezier(aT: number, aA1: number, aA2: number): number {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}

/** `dx/dt` given `t, x1, x2`. */
function getSlope(aT: number, aA1: number, aA2: number): number {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
}

function binarySubdivide(
  aX: number,
  initialA: number,
  initialB: number,
  mX1: number,
  mX2: number,
): number {
  let currentX;
  let currentT;
  let iterations = 0;
  let aA = initialA;
  let aB = initialB;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (
    Math.abs(currentX) > SUBDIVISION_PRECISION &&
    ++iterations < SUBDIVISION_MAX_ITERATIONS
  );
  return currentT;
}

function newtonRaphsonIterate(
  aX: number,
  initialGuessT: number,
  mX1: number,
  mX2: number,
): number {
  let aGuessT = initialGuessT;
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}

/** Builds the easing function for the control points `(x1, y1)`, `(x2, y2)`. */
export function bezier(
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): (x: number) => number {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }

  const sampleValues =
    typeof Float32Array === "function"
      ? new Float32Array(kSplineTableSize)
      : new Array<number>(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX(aX: number): number {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;
    for (
      ;
      currentSample !== lastSample && sampleValues[currentSample] <= aX;
      ++currentSample
    ) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist =
      (aX - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    }
    if (initialSlope === 0.0) {
      return guessForT;
    }
    return binarySubdivide(
      aX,
      intervalStart,
      intervalStart + kSampleStepSize,
      mX1,
      mX2,
    );
  }

  return function BezierEasing(x: number): number {
    if (mX1 === mY1 && mX2 === mY2) {
      return x;
    }
    // Floating point makes the endpoints worth pinning by hand.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
}
