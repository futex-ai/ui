/**
 * The composite animations: `timing`, `loop`, `sequence`, `parallel`, `delay`.
 *
 * Transcribed from React Native's `Animated/AnimatedImplementation.js` as
 * `react-native-web` 0.21.2 vendors it, with the native-loop and vector
 * (`ValueXY` / colour) branches removed. Each returns the same three-method
 * object (`start`, `stop`, `reset`) a caller composes or drives.
 *
 * `loop` defaults to `iterations: -1` and `resetBeforeIteration: true`, which is
 * what makes the library's six spinner and sweep loops restart from the top
 * rather than continuing from wherever the previous iteration ended.
 */
import type { CompositeAnimation, EndCallback, EndResult } from "../../types";

import { AnimatedValue } from "./AnimatedValue";
import { AnimatedNode } from "./nodes";
import { TimingAnimation, type TimingAnimationConfig } from "./TimingAnimation";

/**
 * Configuration of {@link timing}, as the seam's type spells it.
 *
 * `toValue` may be an animated node, which the seam's `TimingAnimationConfig`
 * allows; see {@link resolveToValue} for how far that goes here.
 */
type PublicTimingConfig = Omit<TimingAnimationConfig, "toValue"> & {
  toValue: number | AnimatedNode;
  useNativeDriver?: boolean;
  onComplete?: EndCallback;
};

/**
 * The number an animation runs towards.
 *
 * React Native routes an animated `toValue` through `AnimatedTracking`, so the
 * target keeps following the node for the whole run. That is **not** ported:
 * the node is read once, when the animation starts, and the run then behaves
 * exactly like a numeric target. No consumer passes a node today; a caller that
 * wants a moving target has to restart the animation itself. See the plan's M3
 * deviations.
 */
function resolveToValue(toValue: number | AnimatedNode): number {
  return toValue instanceof AnimatedNode
    ? Number(toValue.__getValue())
    : toValue;
}

function combineCallbacks(
  callback: EndCallback | null | undefined,
  config: { onComplete?: EndCallback },
): EndCallback | null {
  if (callback && config.onComplete) {
    return (result) => {
      config.onComplete?.(result);
      callback(result);
    };
  }
  return callback ?? config.onComplete ?? null;
}

/** Animates a value along a timing curve. */
export function timing(
  value: AnimatedValue,
  config: PublicTimingConfig,
): CompositeAnimation {
  return {
    reset() {
      value.resetAnimation();
    },
    start(callback?: EndCallback) {
      value.animate(
        new TimingAnimation({
          ...config,
          toValue: resolveToValue(config.toValue),
        }),
        combineCallbacks(callback, config),
      );
    },
    stop() {
      value.stopAnimation();
    },
  };
}

/** Runs animations one after another. */
export function sequence(animations: CompositeAnimation[]): CompositeAnimation {
  let current = 0;
  return {
    reset() {
      animations.forEach((animation, index) => {
        if (index <= current) {
          animation.reset();
        }
      });
      current = 0;
    },
    start(callback?: EndCallback) {
      const onComplete = (result: EndResult) => {
        if (!result.finished) {
          callback?.(result);
          return;
        }
        current++;
        if (current === animations.length) {
          // A restart without a reset still begins at the first animation.
          current = 0;
          callback?.(result);
          return;
        }
        animations[current].start(onComplete);
      };
      if (animations.length === 0) {
        callback?.({ finished: true });
      } else {
        animations[current].start(onComplete);
      }
    },
    stop() {
      if (current < animations.length) {
        animations[current].stop();
      }
    },
  };
}

/** Runs animations at the same time. */
export function parallel(
  animations: CompositeAnimation[],
  config?: { stopTogether?: boolean } | null,
): CompositeAnimation {
  let doneCount = 0;
  const hasEnded: Record<number, boolean> = {};
  const stopTogether = config?.stopTogether !== false;

  const result: CompositeAnimation = {
    reset() {
      animations.forEach((animation, index) => {
        animation.reset();
        hasEnded[index] = false;
        doneCount = 0;
      });
    },
    start(callback?: EndCallback) {
      if (doneCount === animations.length) {
        callback?.({ finished: true });
        return;
      }
      animations.forEach((animation, index) => {
        const onEnd = (endResult: EndResult) => {
          hasEnded[index] = true;
          doneCount++;
          if (doneCount === animations.length) {
            doneCount = 0;
            callback?.(endResult);
            return;
          }
          if (!endResult.finished && stopTogether) {
            result.stop();
          }
        };
        if (!animation) {
          onEnd({ finished: true });
        } else {
          animation.start(onEnd);
        }
      });
    },
    stop() {
      animations.forEach((animation, index) => {
        if (!hasEnded[index]) {
          animation.stop();
        }
        hasEnded[index] = true;
      });
    },
  };
  return result;
}

/** An animation that does nothing for `time` milliseconds. */
export function delay(time: number): CompositeAnimation {
  return timing(new AnimatedValue(0), {
    delay: time,
    duration: 0,
    toValue: 0,
    useNativeDriver: false,
  });
}

/** Configuration of {@link loop}. */
type LoopConfig = { iterations?: number; resetBeforeIteration?: boolean };

/** Repeats an animation. */
export function loop(
  animation: CompositeAnimation,
  { iterations = -1, resetBeforeIteration = true }: LoopConfig = {},
): CompositeAnimation {
  let isFinished = false;
  let iterationsSoFar = 0;
  return {
    reset() {
      iterationsSoFar = 0;
      isFinished = false;
      animation.reset();
    },
    start(callback?: EndCallback) {
      const restart = (result: EndResult = { finished: true }): void => {
        if (
          isFinished ||
          iterationsSoFar === iterations ||
          result.finished === false
        ) {
          callback?.(result);
          return;
        }
        iterationsSoFar++;
        if (resetBeforeIteration) {
          animation.reset();
        }
        animation.start(restart);
      };
      if (!animation || iterations === 0) {
        callback?.({ finished: true });
      } else {
        restart();
      }
    },
    stop() {
      isFinished = true;
      animation.stop();
    },
  };
}
