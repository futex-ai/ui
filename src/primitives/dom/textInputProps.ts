/**
 * The pure half of `TextInput`: which DOM props a set of React Native props
 * becomes.
 *
 * Transcribed from `react-native-web` 0.21.2's `exports/TextInput/index.js` —
 * the `type` / `inputMode` table, the forwarded-prop allowlist, and the handful
 * of defaults it applies (`autoCapitalize: "sentences"`, `autoComplete: "on"`,
 * `autoCorrect` as a string, `dir: "auto"`, `rows` from `numberOfLines`,
 * `spellCheck` falling back to `autoCorrect`).
 *
 * Pure; `tests/unit/domTextInput.test.ts` pins the table.
 */
import { FORWARDED_HANDLERS } from "./domPropTables";
import type { PropBag } from "./domProps";

/** The `type` and `inputMode` attributes a field ends up with. */
export type InputTypeResult = {
  type: string | undefined;
  inputMode: string | undefined;
};

/**
 * `inputMode` wins over `keyboardType`; `secureTextEntry` wins over both.
 *
 * `keyboardType` is React Native's older spelling and that backend still
 * honours it, mapping the numeric pads onto `inputMode` and the rest onto
 * `type`.
 */
export function resolveInputType(props: {
  inputMode?: string;
  keyboardType?: string;
  secureTextEntry?: boolean;
}): InputTypeResult {
  let type: string | undefined;
  let inputMode: string | undefined;

  if (props.inputMode != null) {
    inputMode = props.inputMode;
    if (
      props.inputMode === "email" ||
      props.inputMode === "tel" ||
      props.inputMode === "search" ||
      props.inputMode === "url"
    ) {
      type = props.inputMode;
    } else {
      type = "text";
    }
  } else if (props.keyboardType != null) {
    switch (props.keyboardType) {
      case "email-address":
        type = "email";
        break;
      case "number-pad":
      case "numeric":
        inputMode = "numeric";
        break;
      case "decimal-pad":
        inputMode = "decimal";
        break;
      case "phone-pad":
        type = "tel";
        break;
      case "search":
      case "web-search":
        type = "search";
        break;
      case "url":
        type = "url";
        break;
      default:
        type = "text";
    }
  }

  if (props.secureTextEntry === true) {
    type = "password";
  }
  return { inputMode, type };
}

/**
 * Props forwarded straight to the `input` / `textarea`, beyond the shared
 * handler and accessibility sets `domProps.ts` already covers.
 */
export const TEXT_INPUT_FORWARDED_PROPS: ReadonlySet<string> = new Set([
  "autoCapitalize",
  "autoComplete",
  "autoCorrect",
  "autoFocus",
  "defaultValue",
  "disabled",
  "lang",
  "maxLength",
  "onChange",
  "onScroll",
  "placeholder",
  "pointerEvents",
  "readOnly",
  "rows",
  "spellCheck",
  "type",
  "value",
]);

/** Picks the props a field forwards to its DOM element. */
export function pickTextInputProps(props: PropBag): PropBag {
  const picked: PropBag = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      TEXT_INPUT_FORWARDED_PROPS.has(key) ||
      (typeof value === "function" && FORWARDED_HANDLERS.has(key))
    ) {
      picked[key] = value;
    }
  }
  return picked;
}

/** The defaults that backend applied on top of the picked props. */
export function textInputDefaults(props: {
  autoCapitalize?: string;
  autoComplete?: string;
  autoCompleteType?: string;
  autoCorrect?: boolean;
  dir?: string;
  editable?: boolean;
  enterKeyHint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  readOnly?: boolean;
  returnKeyType?: string;
  rows?: number;
  showSoftInputOnFocus?: boolean;
  spellCheck?: boolean;
}): PropBag {
  const autoCorrect = props.autoCorrect ?? true;
  return {
    autoCapitalize: props.autoCapitalize ?? "sentences",
    autoComplete: props.autoComplete ?? props.autoCompleteType ?? "on",
    autoCorrect: autoCorrect ? "on" : "off",
    // "auto" lets the browser infer the writing direction from the content.
    dir: props.dir ?? "auto",
    enterKeyHint: props.enterKeyHint ?? props.returnKeyType,
    readOnly: props.readOnly === true || props.editable === false,
    rows: props.multiline === true ? (props.rows ?? props.numberOfLines) : 1,
    spellCheck: props.spellCheck ?? autoCorrect,
    virtualkeyboardpolicy:
      props.showSoftInputOnFocus === false ? "manual" : "auto",
  };
}

/** An IME is mid-composition, so Enter is committing a candidate, not text. */
export function isEventComposing(nativeEvent: {
  isComposing?: boolean;
  keyCode?: number;
}): boolean {
  // The spec says a key handled by an IME reports 229.
  return nativeEvent.isComposing === true || nativeEvent.keyCode === 229;
}

/**
 * Whether a controlled `selection` differs from the node's current one.
 *
 * Compared against `end` as written rather than against `end ?? start`, which
 * is what that backend did: a `{ start }` with no `end` therefore always reads
 * as stale and re-applies a collapsed caret, and callers rely on that to put
 * the caret back after a programmatic edit.
 */
export function isSelectionStale(
  node: { selectionStart: number | null; selectionEnd: number | null },
  selection: { start: number; end?: number },
): boolean {
  return (
    selection.start !== node.selectionStart ||
    selection.end !== node.selectionEnd
  );
}
