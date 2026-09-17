/**
 * A component's whole prop bag, with the animated entries resolved.
 *
 * Transcribed from React Native's `Animated/nodes/AnimatedProps.js` as
 * `react-native-web` 0.21.2 vendors it, minus the native driver and the
 * `AnimatedEvent` branch (the seam exposes no `Animated.event`). `update()` is
 * what a value calls after it changes, and it re-renders the component rather
 * than writing to the host node — that is the model the thirteen consumers were
 * written against, and it is what keeps a `strokeDashoffset` on an SVG `Rect`
 * animating without the backend knowing anything about SVG.
 */
import { AnimatedStyle } from "./AnimatedStyle";
import { AnimatedNode } from "./nodes";

type PropBag = Record<string, unknown>;

/** The animated props of one component instance. */
export class AnimatedProps extends AnimatedNode {
  private readonly _props: PropBag;
  private readonly _callback: () => void;

  constructor(props: PropBag, callback: () => void) {
    super();
    this._props =
      props.style != null
        ? { ...props, style: new AnimatedStyle(props.style) }
        : props;
    this._callback = callback;
  }

  __getValue(): PropBag {
    const props: PropBag = {};
    for (const key of Object.keys(this._props)) {
      const value = this._props[key];
      props[key] = value instanceof AnimatedNode ? value.__getValue() : value;
    }
    return props;
  }

  __attach(): void {
    for (const key of Object.keys(this._props)) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (const key of Object.keys(this._props)) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        value.__removeChild(this);
      }
    }
    super.__detach();
  }

  /** Asks the component to render the current values. */
  update(): void {
    this._callback();
  }
}
