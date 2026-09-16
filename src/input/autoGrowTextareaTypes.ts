/**
 * The shape `useAutoGrowTextarea` exposes, shared by both of its builds.
 *
 * The native hook (`useAutoGrowTextarea.ts`) and the web hook
 * (`useAutoGrowTextarea.web.ts`) measure differently but return the same thing,
 * so the contract lives here rather than in either file: under the web
 * resolution pass (`tsconfig.web.json`, `moduleSuffixes: [".web", ""]`) the web
 * hook importing `./useAutoGrowTextarea` would resolve to itself.
 */
import type { RefObject } from "react";

import type {
  NativeSyntheticEvent,
  TextInput,
  TextInputContentSizeChangeEventData,
  TextStyle,
} from "../primitives/reactNative";

/** Options for `useAutoGrowTextarea`, shared by the web and native builds. */
export type AutoGrowTextareaOptions = {
  /** Whether auto-grow is active (multiline + a `maxLines` cap above the min). */
  enabled: boolean;
  /** Lowest height, in px — the `numberOfLines` (min rows) floor. */
  minHeight: number;
  /** Highest height, in px — the `maxLines` cap, after which the field scrolls. */
  maxHeight: number;
  /** Resolved per-line height, applied so the row math matches what is rendered. */
  lineHeight: number;
  /** The controlled text; on web it re-triggers a measure as the caller types. */
  value?: string;
  /** The underlying `TextInput` node — measured directly on web, unused natively. */
  nodeRef: RefObject<TextInput | null>;
};

/** What `useAutoGrowTextarea` returns: a height style and (native) handler. */
export type AutoGrowTextarea = {
  /** Extra `TextInput` style with the resolved line height + height bounds, or null. */
  style: TextStyle | null;
  /** Native content-size handler; `undefined` on web and when disabled. */
  onContentSizeChange?: (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => void;
};
