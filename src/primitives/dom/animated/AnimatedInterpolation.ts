/**
 * A node that maps its parent's value through an input/output range.
 *
 * Transcribed from React Native's `Animated/nodes/AnimatedInterpolation.js` as
 * `react-native-web` 0.21.2 vendors it, with the native-driver half removed.
 * The mapping itself lives in `interpolation.ts` so it can be unit-tested
 * without a graph.
 */
import type { InterpolationConfigType } from "../../types";

import { createInterpolation } from "./interpolation";
import { AnimatedNode, AnimatedWithChildren } from "./nodes";

/** The result of interpolating an animated value. */
export class AnimatedInterpolation extends AnimatedWithChildren {
  private readonly _parent: AnimatedNode;
  private readonly _interpolation: (input: number) => number | string;

  constructor(parent: AnimatedNode, config: InterpolationConfigType) {
    super();
    this._parent = parent;
    this._interpolation = createInterpolation(config);
  }

  __getValue(): number | string {
    const parentValue = this._parent.__getValue();
    if (typeof parentValue !== "number") {
      throw new Error("Cannot interpolate an input which is not a number.");
    }
    return this._interpolation(parentValue);
  }

  /** Chains another interpolation onto this one. */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }
}
