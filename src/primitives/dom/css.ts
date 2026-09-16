/**
 * The handful of rules inline styles cannot express.
 *
 * The DOM backend writes inline styles (plan Decision 2), but four things need
 * a real stylesheet: the element resets `View` and `Text` apply (a class keeps
 * them below every inline style, which is the priority `react-native-web`'s
 * classic reset class had), `pointerEvents: "box-none"` / `"box-only"` (child
 * selectors), a `TextInput`'s placeholder colour (`::placeholder`), and hidden
 * scroll indicators (`::-webkit-scrollbar`). The top-level resets are
 * `react-native-web`'s own, copied so the page keeps looking the same once it
 * is gone.
 *
 * `useDomBackendCss` injects the sheet once on the client under a stable id, so
 * a second copy of the library on the page reuses the first one's. SSR
 * consumers can render {@link domBackendCss} themselves to avoid a
 * first-paint gap; the root export publishes it for exactly that.
 */
import { useInsertionEffect } from "react";

import { SYSTEM_FONT_STACK } from "./styleTables";

/** Class carrying `View`'s element reset. */
export const VIEW_CLASS = "firna-view";

/** Class that makes a `View` inside a `Text` flow inline. */
export const VIEW_INLINE_CLASS = "firna-view-inline";

/** Class carrying `Text`'s element reset. */
export const TEXT_CLASS = "firna-text";

/** Class carrying the reset of a `Text` nested inside another `Text`. */
export const TEXT_NESTED_CLASS = "firna-text-nested";

/** Class carrying `TextInput`'s element reset. */
export const TEXT_INPUT_CLASS = "firna-textinput";

/** Attribute `View` marks a non-`auto` `pointerEvents` with. */
export const POINTER_EVENTS_ATTRIBUTE = "data-pointer-events";

/** Attribute a `TextInput` marks a custom placeholder colour with. */
export const PLACEHOLDER_COLOR_ATTRIBUTE = "data-placeholder-color";

/** Custom property the placeholder colour is read from. */
export const PLACEHOLDER_COLOR_VARIABLE = "--placeholderTextColor";

/** Attribute a scroll container hides its scroll indicators with. */
export const HIDE_SCROLLBAR_ATTRIBUTE = "data-hide-scrollbar";

/** Id of the injected `<style>` element. */
export const DOM_BACKEND_STYLE_ID = "firna-ui-dom-backend";

const VIEW_RESET = [
  "align-content:flex-start",
  "align-items:stretch",
  "background-color:transparent",
  "border:0 solid black",
  "box-sizing:border-box",
  "display:flex",
  "flex-basis:auto",
  "flex-direction:column",
  "flex-shrink:0",
  "list-style:none",
  "margin:0",
  "min-height:0",
  "min-width:0",
  "padding:0",
  "position:relative",
  "text-decoration:none",
  "z-index:0",
].join(";");

const TEXT_RESET = [
  "background-color:transparent",
  "border:0 solid black",
  "box-sizing:border-box",
  "color:black",
  "display:inline",
  `font:14px ${SYSTEM_FONT_STACK}`,
  "list-style:none",
  "margin:0",
  "padding:0",
  "position:relative",
  "text-align:start",
  "text-decoration:none",
  "white-space:pre-wrap",
  "word-wrap:break-word",
].join(";");

// A nested text inherits what its ancestor set instead of re-asserting the
// defaults, which is how `<Text>` composition carries colour and font down.
const TEXT_NESTED_RESET = [
  TEXT_RESET,
  "color:inherit",
  "font:inherit",
  "text-align:inherit",
  "white-space:inherit",
].join(";");

// `react-native-web`'s `textinput$raw`, which strips the UA's own field chrome
// so a caller's `style` starts from the same blank box `View` and `Text` do.
const TEXT_INPUT_RESET = [
  "-moz-appearance:textfield",
  "-webkit-appearance:none",
  "background-color:transparent",
  "border:0 solid black",
  "border-radius:0",
  "box-sizing:border-box",
  `font:14px ${SYSTEM_FONT_STACK}`,
  "margin:0",
  "padding:0",
  "resize:none",
].join(";");

function pointerEventsRules(): string {
  const attribute = (value: string) =>
    `[${POINTER_EVENTS_ATTRIBUTE}="${value}"]`;
  return [
    // `!important` is what lets a parent's `box-none` be overridden by a
    // child's own value, exactly as the previous backend's classes did.
    `${attribute("auto")}{pointer-events:auto!important;}`,
    `${attribute("none")}{pointer-events:none!important;}`,
    `${attribute("none")}>*{pointer-events:none;}`,
    `${attribute("box-none")}{pointer-events:none!important;}`,
    `${attribute("box-none")}>*{pointer-events:auto;}`,
    `${attribute("box-only")}{pointer-events:auto!important;}`,
    `${attribute("box-only")}>*{pointer-events:none;}`,
  ].join("");
}

/**
 * The stylesheet the DOM backend needs, as a string.
 *
 * Exported from the package root so a server-rendered consumer can emit it in
 * `<head>` and avoid an unstyled first paint. Emit it **before** your own
 * stylesheets: like `react-native-web`'s sheet it goes first so that a rule of
 * yours at equal specificity — your `body { margin }` against this file's
 * `body{margin:0}` — is the one that wins.
 */
export const domBackendCss: string = [
  // Top-level reset, copied from `react-native-web`'s own initial rules.
  "html{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:rgba(0,0,0,0);}",
  "body{margin:0;}",
  "button::-moz-focus-inner,input::-moz-focus-inner{border:0;padding:0;}",
  "input::-webkit-search-cancel-button,input::-webkit-search-decoration," +
    "input::-webkit-search-results-button,input::-webkit-search-results-decoration{display:none;}",
  // Element resets. A `button`, `label` or `li` host the role table picked gets
  // the same box as the `div` it replaced; nothing else resets those elements.
  `.${VIEW_CLASS}{${VIEW_RESET};}`,
  `.${VIEW_INLINE_CLASS}{display:inline-flex;}`,
  `.${TEXT_CLASS}{${TEXT_RESET};}`,
  `.${TEXT_NESTED_CLASS}{${TEXT_NESTED_RESET};}`,
  `.${TEXT_INPUT_CLASS}{${TEXT_INPUT_RESET};}`,
  pointerEventsRules(),
  // Written on every field, not just the ones naming a colour: that backend
  // applied the rule unconditionally, so a field with no `placeholderTextColor`
  // gets an unresolvable `var()` and its placeholder inherits the input's own
  // colour instead of the UA grey. The recorded baselines pin that.
  `[${PLACEHOLDER_COLOR_ATTRIBUTE}]::placeholder{color:var(${PLACEHOLDER_COLOR_VARIABLE});opacity:1;}`,
  `[${HIDE_SCROLLBAR_ATTRIBUTE}]{scrollbar-width:none;}`,
  `[${HIDE_SCROLLBAR_ATTRIBUTE}]::-webkit-scrollbar{display:none;}`,
].join("\n");

/** Inserts {@link domBackendCss} once per document. */
export function useDomBackendCss(): void {
  useInsertionEffect(() => {
    if (
      typeof document === "undefined" ||
      document.getElementById(DOM_BACKEND_STYLE_ID) != null
    ) {
      return;
    }
    const style = document.createElement("style");
    style.id = DOM_BACKEND_STYLE_ID;
    style.textContent = domBackendCss;
    // First in `<head>`, as that backend's `createCSSStyleSheet` inserted its
    // own, so a consumer's later stylesheet wins a tie rather than losing one.
    document.head.insertBefore(style, document.head.firstChild);
  }, []);
}
