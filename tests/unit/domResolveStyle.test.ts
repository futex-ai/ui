import assert from "node:assert/strict";
import test from "node:test";

import {
  collectStyles,
  createDomStyle,
  flattenStyle,
  preprocessStyle,
  resolveLogicalProps,
  resolveStyle,
} from "../../src/primitives/dom/resolveStyle";

/**
 * The style translation is the DOM backend's parity contract: it has to emit
 * the CSS `react-native-web` 0.21.2 emitted, because the recorded screenshot
 * baselines were taken on that output. Each case below names the rule it pins
 * and, where they differ, which of that library's modules owns it.
 */

const SYSTEM_STACK =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

test("flattening drops falsy entries and lets later styles win", () => {
  assert.deepEqual(
    flattenStyle([
      { color: "red", margin: 4 },
      null,
      false,
      undefined,
      [{ color: "blue" }, ["", { padding: 2 }]],
    ]),
    { color: "blue", margin: 4, padding: 2 },
  );
  assert.deepEqual(flattenStyle(undefined), {});
  assert.deepEqual(collectStyles([[{ a: 1 }], { b: 2 }]), [{ a: 1 }, { b: 2 }]);
});

test("undefined keeps the earlier value; only null clears it", () => {
  // `styleq` skips an `undefined` value outright (`if (value !== undefined)`),
  // so a later style leaving a prop undefined must not wipe an earlier one.
  assert.deepEqual(resolveStyle([{ color: "red" }, { color: undefined }]), {
    color: "red",
  });
  assert.deepEqual(
    resolveStyle([{ color: "red" }, { backgroundColor: undefined }]),
    { color: "red" },
  );
  // `null` is written, and dropped downstream, which is how a style clears one.
  assert.deepEqual(resolveStyle([{ color: "red" }, { color: null }]), {});
  // `StyleSheet.flatten` keeps React Native's own semantics and copies both.
  assert.deepEqual(flattenStyle([{ color: "red" }, { color: undefined }]), {
    color: undefined,
  });
});

test("numbers gain px unless the property is unitless", () => {
  assert.deepEqual(resolveStyle({ width: 12, height: 0 }), {
    height: "0px",
    width: "12px",
  });
  assert.deepEqual(resolveStyle({ opacity: 0.5, zIndex: 2, flexGrow: 1 }), {
    flexGrow: 1,
    opacity: 0.5,
    zIndex: 2,
  });
  // `lineHeight` is *not* in the unitless list, unlike React's own.
  assert.deepEqual(resolveStyle({ lineHeight: 20 }), { lineHeight: "20px" });
  assert.deepEqual(resolveStyle({ width: "50%" }), { width: "50%" });
});

test("logical shorthands become their standard CSS spelling", () => {
  assert.deepEqual(resolveStyle({ paddingHorizontal: 8, paddingVertical: 4 }), {
    paddingBottom: "4px",
    paddingLeft: "8px",
    paddingRight: "8px",
    paddingTop: "4px",
  });
  assert.deepEqual(resolveStyle({ marginHorizontal: 2, marginVertical: 1 }), {
    marginBottom: "1px",
    marginLeft: "2px",
    marginRight: "2px",
    marginTop: "1px",
  });
  assert.deepEqual(resolveStyle({ marginStart: 6, paddingEnd: 3 }), {
    marginLeft: "6px",
    paddingRight: "3px",
  });
  assert.deepEqual(resolveStyle({ start: 5, end: 7 }), {
    left: "5px",
    right: "7px",
  });
  assert.deepEqual(resolveStyle({ borderTopStartRadius: 4 }), {
    borderTopLeftRadius: "4px",
  });
});

test("a physical property is never overwritten by its logical alias", () => {
  assert.deepEqual(resolveLogicalProps({ left: 1, insetInlineStart: 2 }), {
    left: 1,
  });
  assert.deepEqual(resolveLogicalProps({ insetInlineStart: 2, left: 1 }), {
    left: 1,
  });
});

test("shorthands expand to longhands, and the longhand always wins", () => {
  assert.deepEqual(resolveStyle({ borderRadius: 4, borderTopLeftRadius: 0 }), {
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "4px",
    borderTopLeftRadius: "0px",
    borderTopRightRadius: "4px",
  });
  assert.deepEqual(
    resolveStyle([{ borderTopLeftRadius: 0 }, { borderRadius: 4 }]),
    {
      borderBottomLeftRadius: "4px",
      borderBottomRightRadius: "4px",
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "4px",
    },
  );
  assert.deepEqual(resolveStyle({ overflow: "hidden" }), {
    overflowX: "hidden",
    overflowY: "hidden",
  });
  assert.deepEqual(resolveStyle({ padding: 4, paddingTop: 8 }), {
    paddingBottom: "4px",
    paddingLeft: "4px",
    paddingRight: "4px",
    paddingTop: "8px",
  });
  assert.deepEqual(resolveStyle({ margin: 2, marginHorizontal: 6 }), {
    marginBottom: "2px",
    marginLeft: "6px",
    marginRight: "6px",
    marginTop: "2px",
  });
});

test("flex keeps React Native's -1 shorthand", () => {
  assert.deepEqual(resolveStyle({ flex: 1 }), { flex: 1 });
  assert.deepEqual(resolveStyle({ flex: -1 }), {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 1,
  });
});

test("transforms, transform origins and font variants stringify", () => {
  assert.deepEqual(
    resolveStyle({
      transform: [{ rotate: "45deg" }, { translateX: 10 }, { scale: 2 }],
    }),
    { transform: "rotate(45deg) translateX(10px) scale(2)" },
  );
  assert.deepEqual(
    resolveStyle({ transform: [{ matrix: [1, 2, 3, 4, 5, 6] }] }),
    { transform: "matrix(1,2,3,4,5,6)" },
  );
  assert.deepEqual(resolveStyle({ transform: "none" }), { transform: "none" });
  assert.deepEqual(resolveStyle({ transformOrigin: [2, "30%", 10] }), {
    transformOrigin: "2px 30% 10px",
  });
  assert.deepEqual(
    resolveStyle({ fontVariant: ["tabular-nums", "lining-nums"] }),
    { fontVariant: "tabular-nums lining-nums" },
  );
});

test("fonts resolve the System and monospace stacks", () => {
  assert.deepEqual(resolveStyle({ fontFamily: "System" }), {
    fontFamily: SYSTEM_STACK,
  });
  assert.deepEqual(resolveStyle({ fontFamily: "Inter, System" }), {
    fontFamily: `Inter,${SYSTEM_STACK}`,
  });
  assert.deepEqual(resolveStyle({ fontFamily: "monospace" }), {
    fontFamily: "monospace,monospace",
  });
  assert.deepEqual(resolveStyle({ fontFamily: "Inter, sans-serif" }), {
    fontFamily: "Inter, sans-serif",
  });
});

test("shadows fold into box-shadow and the ignored props are dropped", () => {
  assert.deepEqual(
    resolveStyle({
      shadowColor: "#000000",
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    }),
    { boxShadow: "0px 2px 4px rgba(0,0,0,0.20)" },
  );
  // No colour at all: the `black` default still takes the opacity.
  assert.deepEqual(resolveStyle({ shadowOpacity: 0.2, shadowRadius: 4 }), {
    boxShadow: "0px 0px 4px rgba(0,0,0,0.20)",
  });
  // An existing alpha is multiplied by the opacity rather than replaced.
  assert.deepEqual(
    resolveStyle({ shadowColor: "rgba(10, 20, 30, 0.5)", shadowOpacity: 0.5 }),
    { boxShadow: "0px 0px 0px rgba(10,20,30,0.25)" },
  );
  assert.deepEqual(resolveStyle({ shadowColor: "#0f08", shadowOpacity: 1 }), {
    boxShadow: "0px 0px 0px rgba(0,255,0,0.53)",
  });
  assert.deepEqual(
    resolveStyle({ shadowColor: "hsl(120, 50%, 40%)", shadowOpacity: 0.4 }),
    { boxShadow: "0px 0px 0px hsla(120,50%,40%,0.40)" },
  );
  // A named colour other than black or white is passed through as written.
  assert.deepEqual(
    resolveStyle({ shadowColor: "rebeccapurple", shadowOpacity: 0.5 }),
    { boxShadow: "0px 0px 0px rebeccapurple" },
  );
  assert.deepEqual(
    resolveStyle({ elevation: 4, overlayColor: "red", tintColor: "blue" }),
    {},
  );
  assert.deepEqual(resolveStyle({ boxShadow: "0 1px 2px red" }), {
    boxShadow: "0 1px 2px red",
  });
  assert.deepEqual(
    resolveStyle({
      boxShadow: [
        { blurRadius: 3, color: "red", inset: true, offsetX: 1, offsetY: 2 },
      ],
    }),
    // A missing spread stays the bare `0` react-native-web writes for it.
    { boxShadow: "inset 1px 2px 3px 0 red" },
  );
});

test("the odds and ends react-native-web special-cases", () => {
  assert.deepEqual(resolveStyle({ aspectRatio: 1.5 }), { aspectRatio: "1.5" });
  assert.deepEqual(resolveStyle({ textAlignVertical: "center" }), {
    verticalAlign: "middle",
  });
  assert.deepEqual(resolveStyle({ textAlign: "start" }), { textAlign: "left" });
  assert.deepEqual(resolveStyle({ textAlign: "end" }), { textAlign: "right" });
  assert.deepEqual(resolveStyle({ writingDirection: "rtl" }), {
    direction: "rtl",
  });
  assert.deepEqual(resolveStyle({ textDecorationLine: "underline" }), {
    textDecorationLine: "underline",
  });
  // A null value clears whatever an earlier style in the array set.
  assert.deepEqual(resolveStyle([{ color: "red" }, { color: null }]), {});
});

test("web-only keys the library relies on pass straight through", () => {
  assert.deepEqual(
    resolveStyle({
      backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
      backgroundSize: "16px 16px",
      boxShadow: "0 0 0 2px #fff",
      cursor: "col-resize",
      outlineStyle: "none",
      position: "sticky",
      transition: "left 0.15s ease",
      transitionDuration: "200ms",
      userSelect: "none",
    }),
    {
      backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
      backgroundSize: "16px 16px",
      boxShadow: "0 0 0 2px #fff",
      cursor: "col-resize",
      outlineStyle: "none",
      position: "sticky",
      transition: "left 0.15s ease",
      transitionDuration: "200ms",
      userSelect: "none",
    },
  );
  // `pointerEvents` survives translation; `View` is what moves it to the
  // attribute the CSS rules in `dom/css.ts` key off.
  assert.deepEqual(resolveStyle({ pointerEvents: "box-none" }), {
    pointerEvents: "box-none",
  });
});

test("preprocessing keeps the standard spelling when a style has both", () => {
  assert.deepEqual(
    preprocessStyle({ paddingHorizontal: 4, paddingInline: 8 }),
    {
      paddingInline: 8,
    },
  );
  assert.deepEqual(createDomStyle({ backgroundClip: "text" }), {
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  });
});
