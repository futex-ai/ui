/**
 * React Native style props to DOM inline styles.
 *
 * A transcription of `react-native-web` 0.21.2's pipeline — `styleq` merge,
 * `preprocess`, `compiler/index.js`'s `inline()` and `createReactDOMStyle` —
 * with the atomic-CSS branch removed, because the DOM backend writes inline
 * styles instead (plan Decision 2). The translation itself is copied rather
 * than designed (Decision 3), which is what makes the recorded screenshot
 * baselines a parity oracle.
 *
 * Everything here is pure; `tests/unit/domResolveStyle.test.ts` pins the table.
 */
import type { CSSProperties } from "react";

import {
  IGNORED_STYLE_PROPS,
  MONOSPACE_FONT_STACK,
  PROPERTIES_I18N,
  PROPERTIES_STANDARD,
  PROPERTIES_VALUE,
  SHADOW_STYLE_PROPS,
  SHORT_FORM_EXPANSIONS,
  SYSTEM_FONT_STACK,
} from "./styleTables";
import {
  createBoxShadowArrayValue,
  createBoxShadowValue,
  createTextShadowValue,
  createTransformValue,
  isStyleObject,
  normalizeValue,
  type StyleObject,
} from "./styleValues";

/** Anything a `style` prop accepts: an object, a nested array, or nothing. */
export type StyleInput = unknown;

/**
 * Collects the style objects a `StyleProp` contains, in application order.
 * Nested arrays are flattened and falsy entries dropped, as `StyleSheet.flatten`
 * and `styleq` both do.
 */
export function collectStyles(style: StyleInput, into: StyleObject[] = []) {
  if (Array.isArray(style)) {
    for (const entry of style) {
      collectStyles(entry, into);
    }
  } else if (isStyleObject(style)) {
    into.push(style);
  }
  return into;
}

/** Deep-flattens a `StyleProp` into one object, later entries winning. */
export function flattenStyle(style: StyleInput): StyleObject {
  return Object.assign({}, ...collectStyles(style)) as StyleObject;
}

/**
 * `react-native-web`'s `preprocess`: folds the shadow props into their CSS
 * equivalents, renames React Native's spellings to the standard logical ones,
 * and stringifies the array-valued props. Applied per style object, before the
 * merge, exactly as `styleq`'s transform does.
 */
export function preprocessStyle(style: StyleObject): StyleObject {
  const next: StyleObject = {};
  if (
    style.shadowColor != null ||
    style.shadowOffset != null ||
    style.shadowOpacity != null ||
    style.shadowRadius != null
  ) {
    next.boxShadow = createBoxShadowValue(style);
  }
  if (
    style.textShadowColor != null ||
    style.textShadowOffset != null ||
    style.textShadowRadius != null
  ) {
    const textShadow = createTextShadowValue(style);
    if (textShadow != null) {
      next.textShadow =
        typeof style.textShadow === "string"
          ? `${style.textShadow}, ${textShadow}`
          : textShadow;
    }
  }

  for (const originalProp of Object.keys(style)) {
    if (
      IGNORED_STYLE_PROPS.has(originalProp) ||
      SHADOW_STYLE_PROPS.has(originalProp)
    ) {
      continue;
    }
    const prop = PROPERTIES_STANDARD[originalProp] ?? originalProp;
    // A style that spells a prop both ways keeps the standard spelling.
    if (prop !== originalProp && style[prop] != null) {
      continue;
    }
    const value = style[originalProp];
    if (prop === "aspectRatio" && typeof value === "number") {
      next[prop] = value.toString();
    } else if (prop === "boxShadow") {
      const list = Array.isArray(value)
        ? createBoxShadowArrayValue(value)
        : value;
      next.boxShadow =
        typeof next.boxShadow === "string"
          ? `${String(list)}, ${next.boxShadow}`
          : list;
    } else if (prop === "fontVariant") {
      next[prop] =
        Array.isArray(value) && value.length > 0 ? value.join(" ") : value;
    } else if (prop === "textAlignVertical") {
      if (style.verticalAlign == null) {
        next.verticalAlign = value === "center" ? "middle" : value;
      }
    } else if (prop === "transform") {
      next.transform = Array.isArray(value)
        ? createTransformValue(value)
        : value;
    } else if (prop === "transformOrigin") {
      next.transformOrigin = Array.isArray(value)
        ? value.map((entry) => normalizeValue(entry)).join(" ")
        : value;
    } else {
      next[prop] = value;
    }
  }
  return next;
}

/**
 * `compiler/index.js`'s `inline()` with `writingDirection: "ltr"`: resolves the
 * logical property names and the `start` / `end` values to their physical
 * left-to-right equivalents. A prop written physically is frozen, so a logical
 * alias can never overwrite it.
 */
export function resolveLogicalProps(style: StyleObject): StyleObject {
  const frozen = new Set<string>();
  const next: StyleObject = {};
  for (const originalProp of Object.keys(style)) {
    const originalValue = style[originalProp];
    if (originalValue == null) {
      continue;
    }
    let value = originalValue;
    if (PROPERTIES_VALUE.includes(originalProp)) {
      if (originalValue === "start") {
        value = "left";
      } else if (originalValue === "end") {
        value = "right";
      }
    }
    const prop = PROPERTIES_I18N[originalProp] ?? originalProp;
    if (!frozen.has(prop)) {
      next[prop] = value;
    }
    if (prop === originalProp) {
      frozen.add(prop);
    }
  }
  return next;
}

/**
 * `createReactDOMStyle(style, true)`: expands every shorthand to the longhands
 * React Native's precedence implies, and adds units.
 */
export function createDomStyle(style: StyleObject): StyleObject {
  const resolved: StyleObject = {};
  for (const prop of Object.keys(style)) {
    const value = style[prop];
    if (value == null) {
      continue;
    }
    if (prop === "backgroundClip") {
      if (value === "text") {
        resolved.backgroundClip = value;
        resolved.WebkitBackgroundClip = value;
      }
    } else if (prop === "flex") {
      if (value === -1) {
        resolved.flexGrow = 0;
        resolved.flexShrink = 1;
        resolved.flexBasis = "auto";
      } else {
        resolved.flex = value;
      }
    } else if (prop === "font") {
      resolved.font = String(value).replace("System", SYSTEM_FONT_STACK);
    } else if (prop === "fontFamily") {
      resolved.fontFamily = resolveFontFamily(String(value));
    } else if (prop === "writingDirection") {
      resolved.direction = value;
    } else {
      const normalized = normalizeValue(value, prop);
      const longForms = SHORT_FORM_EXPANSIONS[prop];
      if (prop === "inset" || prop === "margin" || prop === "padding") {
        expandBox(style, resolved, prop, normalized);
      } else if (longForms) {
        for (const longForm of longForms) {
          // The longhand in the original style always wins.
          if (style[longForm] == null) {
            resolved[longForm] = normalized;
          }
        }
      } else {
        resolved[prop] = normalized;
      }
    }
  }
  return resolved;
}

const BOX_EXPANSIONS = {
  inset: ["insetInline", "left", "right", "insetBlock", "top", "bottom"],
  margin: [
    "marginInline",
    "marginLeft",
    "marginRight",
    "marginBlock",
    "marginTop",
    "marginBottom",
  ],
  padding: [
    "paddingInline",
    "paddingLeft",
    "paddingRight",
    "paddingBlock",
    "paddingTop",
    "paddingBottom",
  ],
} as const;

/** `margin` / `padding` / `inset` to four sides, unless a logical pair covers them. */
function expandBox(
  style: StyleObject,
  resolved: StyleObject,
  prop: "inset" | "margin" | "padding",
  value: unknown,
) {
  const [inline, left, right, block, top, bottom] = BOX_EXPANSIONS[prop];
  if (style[inline] == null) {
    resolved[left] = value;
    resolved[right] = value;
  }
  if (style[block] == null) {
    resolved[top] = value;
    resolved[bottom] = value;
  }
}

function resolveFontFamily(value: string): string {
  if (value.indexOf("System") > -1) {
    const stack = value.split(/,\s*/);
    stack[stack.indexOf("System")] = SYSTEM_FONT_STACK;
    return stack.join(",");
  }
  return value === "monospace" ? MONOSPACE_FONT_STACK : value;
}

/** Translates a `style` prop into the inline styles a DOM element takes. */
export function resolveStyle(style: StyleInput): CSSProperties {
  const merged: StyleObject = {};
  for (const entry of collectStyles(style)) {
    for (const [prop, value] of Object.entries(preprocessStyle(entry))) {
      // `undefined` is skipped rather than written, which is what `styleq` does
      // (`if (value !== undefined)`): a later style that leaves a prop
      // `undefined` keeps whatever an earlier one set. Only `null` clears, and
      // it does so by being written here and dropped further down.
      if (value !== undefined) {
        merged[prop] = value;
      }
    }
  }
  return createDomStyle(resolveLogicalProps(merged)) as CSSProperties;
}
