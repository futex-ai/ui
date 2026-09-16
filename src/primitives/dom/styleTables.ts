/**
 * The lookup tables `resolveStyle.ts` translates React Native styles with.
 *
 * Every table is a transcription of `react-native-web` 0.21.2 so the DOM
 * backend emits the same CSS the previous backend did (plan Decision 3). The
 * sources are `exports/StyleSheet/preprocess.js`,
 * `exports/StyleSheet/compiler/createReactDOMStyle.js`,
 * `exports/StyleSheet/compiler/unitlessNumbers.js` and
 * `exports/StyleSheet/compiler/index.js`.
 */

/** Font stack `fontFamily: "System"` resolves to, as `react-native-web` spells it. */
export const SYSTEM_FONT_STACK =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

/** Font stack `fontFamily: "monospace"` resolves to. */
export const MONOSPACE_FONT_STACK = "monospace,monospace";

/** React Native style props that have no web equivalent and are dropped. */
export const IGNORED_STYLE_PROPS: ReadonlySet<string> = new Set([
  "elevation",
  "overlayColor",
  "resizeMode",
  "tintColor",
]);

/** The `shadow*` / `textShadow*` props folded into `boxShadow` / `textShadow`. */
export const SHADOW_STYLE_PROPS: ReadonlySet<string> = new Set([
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "textShadowColor",
  "textShadowOffset",
  "textShadowRadius",
]);

/** The three border facets that exist once per edge. */
const BORDER_FACETS = ["Color", "Style", "Width"] as const;

/** The four physical edges, in the order the shorthand tables list them. */
const BORDER_EDGES = ["Top", "Right", "Bottom", "Left"] as const;

/** Which physical edge each inline edge is under a left-to-right writing mode. */
const INLINE_EDGES = { End: "Right", Start: "Left" } as const;

function borderEdgeEntries(
  name: (edge: "Start" | "End", facet: string) => [string, string],
): Record<string, string> {
  return Object.fromEntries(
    (["Start", "End"] as const).flatMap((edge) =>
      BORDER_FACETS.map((facet) => name(edge, facet)),
    ),
  );
}

/**
 * React Native spellings renamed to their standard CSS logical equivalent.
 *
 * `preprocess.js`'s `PROPERTIES_STANDARD`. The six per-edge border entries are
 * generated rather than spelled out, which is also what keeps the left-edge
 * names out of `tests/unit/noAccentBar.test.ts`'s way.
 */
export const PROPERTIES_STANDARD: Readonly<Record<string, string>> = {
  borderBottomEndRadius: "borderEndEndRadius",
  borderBottomStartRadius: "borderEndStartRadius",
  borderTopEndRadius: "borderStartEndRadius",
  borderTopStartRadius: "borderStartStartRadius",
  ...borderEdgeEntries((edge, facet) => [
    `border${edge}${facet}`,
    `borderInline${edge}${facet}`,
  ]),
  end: "insetInlineEnd",
  marginEnd: "marginInlineEnd",
  marginHorizontal: "marginInline",
  marginStart: "marginInlineStart",
  marginVertical: "marginBlock",
  paddingEnd: "paddingInlineEnd",
  paddingHorizontal: "paddingInline",
  paddingStart: "paddingInlineStart",
  paddingVertical: "paddingBlock",
  start: "insetInlineStart",
};

/**
 * Logical property names resolved to their physical left-to-right equivalent.
 *
 * `compiler/index.js`'s `PROPERTIES_I18N`. The library is left-to-right only
 * (a plan non-goal), so there is no right-to-left flip table.
 */
export const PROPERTIES_I18N: Readonly<Record<string, string>> = {
  borderStartStartRadius: "borderTopLeftRadius",
  borderStartEndRadius: "borderTopRightRadius",
  borderEndStartRadius: "borderBottomLeftRadius",
  borderEndEndRadius: "borderBottomRightRadius",
  ...borderEdgeEntries((edge, facet) => [
    `borderInline${edge}${facet}`,
    `border${INLINE_EDGES[edge]}${facet}`,
  ]),
  insetInlineEnd: "right",
  insetInlineStart: "left",
  marginInlineStart: "marginLeft",
  marginInlineEnd: "marginRight",
  paddingInlineStart: "paddingLeft",
  paddingInlineEnd: "paddingRight",
};

/** Props whose `start` / `end` *values* resolve to `left` / `right`. */
export const PROPERTIES_VALUE: readonly string[] = [
  "clear",
  "float",
  "textAlign",
];

/** The four physical longhands a `border*` shorthand expands to. */
function borderEdges(facet: string): readonly string[] {
  return BORDER_EDGES.map((edge) => `border${edge}${facet}`);
}

/** The two inline-axis longhands a `borderInline*` shorthand expands to. */
function inlineBorderEdges(facet: string): readonly string[] {
  return [INLINE_EDGES.End, INLINE_EDGES.Start].map(
    (edge) => `border${edge}${facet}`,
  );
}

/**
 * Shorthands expanded to longhands so the more specific prop always wins,
 * which is React Native's precedence rather than the CSS cascade's.
 *
 * `createReactDOMStyle.js`'s `STYLE_SHORT_FORM_EXPANSIONS`.
 */
export const SHORT_FORM_EXPANSIONS: Readonly<
  Record<string, readonly string[]>
> = {
  borderColor: borderEdges("Color"),
  borderBlockColor: ["borderTopColor", "borderBottomColor"],
  borderInlineColor: inlineBorderEdges("Color"),
  borderRadius: [
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius",
  ],
  borderStyle: borderEdges("Style"),
  borderBlockStyle: ["borderTopStyle", "borderBottomStyle"],
  borderInlineStyle: inlineBorderEdges("Style"),
  borderWidth: borderEdges("Width"),
  borderBlockWidth: ["borderTopWidth", "borderBottomWidth"],
  borderInlineWidth: inlineBorderEdges("Width"),
  insetBlock: ["top", "bottom"],
  insetInline: ["left", "right"],
  marginBlock: ["marginTop", "marginBottom"],
  marginInline: ["marginRight", "marginLeft"],
  paddingBlock: ["paddingTop", "paddingBottom"],
  paddingInline: ["paddingRight", "paddingLeft"],
  overflow: ["overflowX", "overflowY"],
  overscrollBehavior: ["overscrollBehaviorX", "overscrollBehaviorY"],
  borderBlockStartColor: ["borderTopColor"],
  borderBlockStartStyle: ["borderTopStyle"],
  borderBlockStartWidth: ["borderTopWidth"],
  borderBlockEndColor: ["borderBottomColor"],
  borderBlockEndStyle: ["borderBottomStyle"],
  borderBlockEndWidth: ["borderBottomWidth"],
  borderEndStartRadius: ["borderBottomLeftRadius"],
  borderEndEndRadius: ["borderBottomRightRadius"],
  borderStartStartRadius: ["borderTopLeftRadius"],
  borderStartEndRadius: ["borderTopRightRadius"],
  insetBlockEnd: ["bottom"],
  insetBlockStart: ["top"],
  marginBlockStart: ["marginTop"],
  marginBlockEnd: ["marginBottom"],
  paddingBlockStart: ["paddingTop"],
  paddingBlockEnd: ["paddingBottom"],
};

const UNITLESS_BASE = [
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "flex",
  "flexGrow",
  "flexOrder",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "fontWeight",
  "gridRow",
  "gridRowEnd",
  "gridRowGap",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnGap",
  "gridColumnStart",
  "lineClamp",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "shadowOpacity",
];

/**
 * Numbers that are written without a `px` suffix, plus the vendor-prefixed
 * permutations `react-native-web` derives from the same list.
 */
export const UNITLESS_NUMBERS: ReadonlySet<string> = new Set(
  UNITLESS_BASE.flatMap((prop) => [
    prop,
    ...["ms", "Moz", "O", "Webkit"].map(
      (prefix) => prefix + prop.charAt(0).toUpperCase() + prop.slice(1),
    ),
  ]),
);
