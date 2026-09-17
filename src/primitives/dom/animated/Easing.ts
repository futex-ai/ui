/**
 * `Easing`: the timing curves an animation can be driven with.
 *
 * Transcribed from React Native's `Animated/Easing.js` as `react-native-web`
 * 0.21.2 vendors it, including `ease` being a lazily-built
 * `bezier(0.42, 0, 1, 1)`. The library only reaches for `linear`,
 * `out(quad)` and `inOut(ease)`, but the whole table is here because the seam's
 * `EasingStatic` type declares it and a consumer may use any of it.
 *
 * Pure; `tests/unit/domEasing.test.ts` pins it.
 */
import type { EasingFunction, EasingStatic } from "../../types";

import { bezier } from "./bezier";

let easeCurve: EasingFunction | null = null;

/** A back-loaded curve: `bezier(0.42, 0, 1, 1)`. */
function ease(t: number): number {
  easeCurve ??= bezier(0.42, 0, 1, 1);
  return easeCurve(t);
}

export const Easing: EasingStatic = {
  back(s = 1.70158) {
    return (t) => t * t * ((s + 1) * t - s);
  },
  bounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    }
    if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    }
    if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    }
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  },
  bezier(x1, y1, x2, y2) {
    return bezier(x1, y1, x2, y2);
  },
  circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  },
  cubic(t) {
    return t * t * t;
  },
  ease,
  elastic(bounciness = 1) {
    const p = bounciness * Math.PI;
    return (t) =>
      1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  },
  exp(t) {
    return Math.pow(2, 10 * (t - 1));
  },
  // `in` runs the curve as written; the other two mirror it.
  in: (easing) => easing,
  inOut(easing) {
    return (t) => {
      if (t < 0.5) {
        return easing(t * 2) / 2;
      }
      return 1 - easing((1 - t) * 2) / 2;
    };
  },
  linear: (t) => t,
  out(easing) {
    return (t) => 1 - easing(1 - t);
  },
  poly(n) {
    return (t) => Math.pow(t, n);
  },
  quad(t) {
    return t * t;
  },
  sin(t) {
    return 1 - Math.cos((t * Math.PI) / 2);
  },
  step0(n) {
    return n > 0 ? 1 : 0;
  },
  step1(n) {
    return n >= 1 ? 1 : 0;
  },
};
