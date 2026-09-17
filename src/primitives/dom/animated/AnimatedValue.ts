/**
 * `Animated.Value`: the scalar every animation drives.
 *
 * Transcribed from React Native's `Animated/nodes/AnimatedValue.js` as
 * `react-native-web` 0.21.2 vendors it, minus the native driver. Two rules are
 * worth naming because components depend on them: `setValue` stops whatever
 * animation is running (so a reduced-motion branch can jump a value mid-loop),
 * and `_updateValue` flushes the `AnimatedProps` nodes below it *before* it
 * calls the listeners, so a listener always observes a value the tree has
 * already rendered.
 */
import type { InterpolationConfigType } from "../../types";

import { AnimatedInterpolation } from "./AnimatedInterpolation";
import { AnimatedNode, AnimatedWithChildren } from "./nodes";

/** How an animation reports its outcome. */
export type EndResult = { finished: boolean };
/** Called when an animation finishes or is stopped. */
export type EndCallback = (result: EndResult) => void;

/** What {@link AnimatedValue.animate} drives. */
export interface ValueAnimation {
  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: EndCallback | null,
    previousAnimation: ValueAnimation | null,
    animatedValue: AnimatedValue,
  ): void;
  stop(): void;
}

/** A node that re-renders a component when its inputs change. */
type UpdatableNode = AnimatedNode & { update?: () => void };

/**
 * Renders every `AnimatedProps` below `rootNode`.
 *
 * Duck-typed on `update` rather than an `instanceof AnimatedProps` check, as
 * that backend does, because the prop node imports the value node and not the
 * other way round.
 */
function flush(rootNode: AnimatedValue): void {
  const animatedStyles = new Set<UpdatableNode>();
  function findAnimatedStyles(node: UpdatableNode) {
    if (typeof node.update === "function") {
      animatedStyles.add(node);
    } else {
      for (const child of node.__getChildren()) {
        findAnimatedStyles(child);
      }
    }
  }
  findAnimatedStyles(rootNode);
  for (const animatedStyle of animatedStyles) {
    animatedStyle.update?.();
  }
}

/** The standard scalar that drives animations. */
export class AnimatedValue extends AnimatedWithChildren {
  private _value: number;
  private readonly _startingValue: number;
  private _offset = 0;
  private _animation: ValueAnimation | null = null;

  constructor(value: number) {
    super();
    if (typeof value !== "number") {
      throw new Error("AnimatedValue: Attempting to set value to undefined");
    }
    this._startingValue = value;
    this._value = value;
  }

  __detach(): void {
    this.stopAnimation();
    super.__detach();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  /** Sets the value directly, stopping any running animation on it. */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(value, true);
  }

  /** Sets an offset applied on top of whatever value is set. */
  setOffset(offset: number): void {
    this._offset = offset;
  }

  /** Merges the offset into the base value and resets the offset to zero. */
  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
  }

  /** Moves the base value into the offset, leaving the output unchanged. */
  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
  }

  /** Stops any running animation, reporting the final value. */
  stopAnimation(callback?: (value: number) => void): void {
    this._animation?.stop();
    this._animation = null;
    callback?.(this.__getValue());
  }

  /** Stops any animation and resets the value to its original. */
  resetAnimation(callback?: (value: number) => void): void {
    this.stopAnimation(callback);
    this._value = this._startingValue;
  }

  /** Maps this value through an input/output range. */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  /** Hands the value over to an animation until it settles or is stopped. */
  animate(animation: ValueAnimation, callback: EndCallback | null): void {
    const previousAnimation = this._animation;
    this._animation?.stop();
    this._animation = animation;
    animation.start(
      this._value,
      (value) => this._updateValue(value, true),
      (result) => {
        this._animation = null;
        callback?.(result);
      },
      previousAnimation,
      this,
    );
  }

  private _updateValue(value: number, shouldFlush: boolean): void {
    if (value === undefined) {
      throw new Error("AnimatedValue: Attempting to set value to undefined");
    }
    this._value = value;
    if (shouldFlush) {
      flush(this);
    }
    super.__callListeners(this.__getValue());
  }
}
