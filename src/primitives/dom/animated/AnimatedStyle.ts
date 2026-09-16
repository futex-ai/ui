/**
 * The animated half of a `style` prop, and of a `transform` array.
 *
 * Transcribed from React Native's `Animated/nodes/AnimatedStyle.js` and
 * `AnimatedTransform.js` as `react-native-web` 0.21.2 vendors them, minus the
 * native driver. `AnimatedStyle.__getValue` returns `[inputStyle, resolved]`
 * rather than one merged object, which is how a static entry written beside an
 * animated one survives: `resolveStyle` flattens the pair in order.
 */
import { flattenStyle } from "../resolveStyle";

import { AnimatedNode, AnimatedWithChildren } from "./nodes";

type StyleBag = Record<string, unknown>;

/** One entry of a `transform` array, e.g. `{ rotate: value }`. */
type TransformEntry = Record<string, unknown>;

/** A `transform` array with animated entries in it. */
export class AnimatedTransform extends AnimatedWithChildren {
  private readonly _transforms: readonly TransformEntry[];

  constructor(transforms: readonly TransformEntry[]) {
    super();
    this._transforms = transforms;
  }

  __getValue(): TransformEntry[] {
    return this._transforms.map((transform) => {
      const result: TransformEntry = {};
      for (const key of Object.keys(transform)) {
        const value = transform[key];
        result[key] =
          value instanceof AnimatedNode ? value.__getValue() : value;
      }
      return result;
    });
  }

  __attach(): void {
    for (const transform of this._transforms) {
      for (const key of Object.keys(transform)) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__addChild(this);
        }
      }
    }
  }

  __detach(): void {
    for (const transform of this._transforms) {
      for (const key of Object.keys(transform)) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__removeChild(this);
        }
      }
    }
    super.__detach();
  }
}

/** Collects the animated entries of a style object, recursing into nested ones. */
function createAnimatedStyle(inputStyle: unknown): StyleBag {
  const style = flattenStyle(inputStyle) as StyleBag;
  const animatedStyles: StyleBag = {};
  for (const key of Object.keys(style)) {
    const value = style[key];
    if (key === "transform" && Array.isArray(value)) {
      animatedStyles[key] = new AnimatedTransform(value as TransformEntry[]);
    } else if (value instanceof AnimatedNode) {
      animatedStyles[key] = value;
    } else if (
      value != null &&
      !Array.isArray(value) &&
      typeof value === "object"
    ) {
      // A nested object (iOS's `shadowOffset`, say) can hold animated values too.
      animatedStyles[key] = createAnimatedStyle(value);
    }
  }
  return animatedStyles;
}

/** The `style` prop of an animated component. */
export class AnimatedStyle extends AnimatedWithChildren {
  private readonly _inputStyle: unknown;
  private readonly _style: StyleBag;

  constructor(style: unknown) {
    super();
    this._inputStyle = style;
    this._style = createAnimatedStyle(style);
  }

  private _walkStyleAndGetValues(style: StyleBag): StyleBag {
    const updatedStyle: StyleBag = {};
    for (const key of Object.keys(style)) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        updatedStyle[key] = value.__getValue();
      } else if (
        value != null &&
        !Array.isArray(value) &&
        typeof value === "object"
      ) {
        updatedStyle[key] = this._walkStyleAndGetValues(value as StyleBag);
      } else {
        updatedStyle[key] = value;
      }
    }
    return updatedStyle;
  }

  __getValue(): unknown[] {
    // The caller's style first, then the resolved animated entries on top.
    return [this._inputStyle, this._walkStyleAndGetValues(this._style)];
  }

  __attach(): void {
    for (const key of Object.keys(this._style)) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (const key of Object.keys(this._style)) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__removeChild(this);
      }
    }
    super.__detach();
  }
}
