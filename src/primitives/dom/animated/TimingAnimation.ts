/**
 * The timing driver: a value eased from A to B over a duration.
 *
 * Transcribed from React Native's `Animated/animations/Animation.js` and
 * `TimingAnimation.js` as `react-native-web` 0.21.2 vendors them, keeping the
 * JS driver only (`useNativeDriver` is accepted and ignored on web). The frame
 * loop is `requestAnimationFrame` reading `Date.now()`, so a tab that was
 * backgrounded resumes at the right point on the curve rather than replaying
 * the frames it missed.
 *
 * `stop()` reports `{ finished: false }`, and `__debouncedOnEnd` is what
 * guarantees the end callback runs exactly once whichever way the animation
 * ends.
 */
import type { EndCallback, EndResult, ValueAnimation } from "./AnimatedValue";
import { Easing } from "./Easing";

/** Configuration of one timing run. */
export type TimingAnimationConfig = {
  toValue: number;
  easing?: ((value: number) => number) | undefined;
  duration?: number | undefined;
  delay?: number | undefined;
  iterations?: number | undefined;
};

const DEFAULT_DURATION_MS = 500;

let easeInOutCurve: ((value: number) => number) | null = null;
function easeInOut(): (value: number) => number {
  easeInOutCurve ??= Easing.inOut(Easing.ease);
  return easeInOutCurve;
}

/** Eases a value towards `toValue` on `requestAnimationFrame`. */
export class TimingAnimation implements ValueAnimation {
  private readonly _toValue: number;
  private readonly _easing: (value: number) => number;
  private readonly _duration: number;
  private readonly _delay: number;
  private _active = false;
  private _startTime = 0;
  private _fromValue = 0;
  private _onUpdate: (value: number) => void = () => {};
  private _onEnd: EndCallback | null = null;
  private _animationFrame: number | null = null;
  private _timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: TimingAnimationConfig) {
    this._toValue = config.toValue;
    this._easing = config.easing ?? easeInOut();
    this._duration = config.duration ?? DEFAULT_DURATION_MS;
    this._delay = config.delay ?? 0;
  }

  /** Runs the end callback at most once, whoever ends the animation. */
  private _debouncedOnEnd(result: EndResult): void {
    const onEnd = this._onEnd;
    this._onEnd = null;
    onEnd?.(result);
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: EndCallback | null,
  ): void {
    this._active = true;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this._onEnd = onEnd;

    const begin = () => {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
        this._debouncedOnEnd({ finished: true });
        return;
      }
      this._startTime = Date.now();
      this._animationFrame = requestAnimationFrame(() => this.onUpdate());
    };

    if (this._delay) {
      this._timeout = setTimeout(begin, this._delay);
    } else {
      begin();
    }
  }

  /** One frame of the curve. */
  onUpdate(): void {
    const now = Date.now();
    if (now >= this._startTime + this._duration) {
      this._onUpdate(
        this._duration === 0
          ? this._toValue
          : this._fromValue +
              this._easing(1) * (this._toValue - this._fromValue),
      );
      this._debouncedOnEnd({ finished: true });
      return;
    }
    this._onUpdate(
      this._fromValue +
        this._easing((now - this._startTime) / this._duration) *
          (this._toValue - this._fromValue),
    );
    if (this._active) {
      this._animationFrame = requestAnimationFrame(() => this.onUpdate());
    }
  }

  stop(): void {
    this._active = false;
    if (this._timeout != null) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if (this._animationFrame != null) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._debouncedOnEnd({ finished: false });
  }
}
