/**
 * The CSS focus-ring markers a web host and its focus target carry.
 *
 * `useFocusRing` hands them out in two spellings. React Native's `dataSet`
 * shape is what the library's own `View`, `Pressable`, and `TextInput`
 * primitives (and `react-native-web`) write out as `data-*` attributes; the
 * literal attribute spelling is what a raw `<button>` or `<div>` needs, since
 * React DOM forwards `data-*` props verbatim and drops `dataSet` with a
 * warning. Both feed the same `domBackendCss` rules.
 *
 * The DOM spelling carries the markers only. `View` additionally moves an
 * inline `boxShadow` into `--firna-focus-ring-base-shadow` so the glow can
 * compose over it; a raw host has to set that variable itself.
 */

/** Relationship from the painted box to the real focus target. */
export type FocusRingTarget = "self" | "descendant" | "parent";

/**
 * How a control shows keyboard focus on web.
 *
 * - `ring` — the shared focus glow, painted by `domBackendCss`.
 * - `outline` — no glow. The browser's default focus outline stays, drawn on
 *   the control's visible box when focus and paint live on different elements.
 * - `none` — no focus styling at all: no glow, no browser outline, and no
 *   focus-only border or highlight. The caller owns the focus indicator and
 *   must show it some other way (WCAG 2.1 — 2.4.7 Focus Visible, AA). Only
 *   forced-colors mode keeps the system outline, since author shadows and
 *   fills are stripped there.
 */
export type FocusIndicator = "ring" | "outline" | "none";

/** Props to spread on a Firna primitive: the visible box CSS should decorate. */
export type FocusRingHostProps = {
  dataSet?: {
    firnaFocusHost?: FocusRingTarget;
    firnaFocusNone?: FocusRingTarget;
    firnaFocusRing?: FocusRingTarget;
    firnaFocusRingInset?: "true";
    firnaFocusTarget?: "true";
  };
};

/** The same markers as literal `data-*` attributes, for raw DOM elements. */
export type FocusRingDomProps = {
  "data-firna-focus-host"?: FocusRingTarget;
  "data-firna-focus-none"?: FocusRingTarget;
  "data-firna-focus-ring"?: FocusRingTarget;
  "data-firna-focus-ring-inset"?: "true";
  "data-firna-focus-target"?: "true";
};

/** The resolved inputs that decide which markers a painted box carries. */
export type FocusRingHostOptions = {
  indicator: FocusIndicator;
  /** Paint the glow inside the box rather than around it. */
  inset: boolean;
  target: FocusRingTarget;
};

const EMPTY_HOST_PROPS = Object.freeze({}) as FocusRingHostProps;

const EMPTY_DOM_PROPS = Object.freeze({}) as FocusRingDomProps;

/**
 * The web markers for a painted box. `ring` marks it for the glow. `outline`
 * marks only a split host, so the browser outline moves off the hidden focus
 * target onto the visible box; a `self` box keeps the browser outline with no
 * marker at all. `none` marks the box so the stylesheet strips the browser
 * outline from the focus target and paints nothing in its place.
 */
export function focusRingHostPropsFor({
  indicator,
  inset,
  target,
}: FocusRingHostOptions): FocusRingHostProps {
  if (indicator === "none") return { dataSet: { firnaFocusNone: target } };
  if (indicator === "outline") {
    return target === "self"
      ? EMPTY_HOST_PROPS
      : { dataSet: { firnaFocusHost: target } };
  }
  return {
    dataSet: {
      ...(target === "self" ? null : { firnaFocusHost: target }),
      firnaFocusRing: target,
      ...(inset ? { firnaFocusRingInset: "true" as const } : null),
    },
  };
}

/** Spells a primitive's `dataSet` markers as the DOM attributes they become. */
export function focusRingDomPropsFor(
  props: FocusRingHostProps,
): FocusRingDomProps {
  const dataSet = props.dataSet;
  if (!dataSet) return EMPTY_DOM_PROPS;
  const domProps: FocusRingDomProps = {};
  if (dataSet.firnaFocusHost != null) {
    domProps["data-firna-focus-host"] = dataSet.firnaFocusHost;
  }
  if (dataSet.firnaFocusNone != null) {
    domProps["data-firna-focus-none"] = dataSet.firnaFocusNone;
  }
  if (dataSet.firnaFocusRing != null) {
    domProps["data-firna-focus-ring"] = dataSet.firnaFocusRing;
  }
  if (dataSet.firnaFocusRingInset != null) {
    domProps["data-firna-focus-ring-inset"] = dataSet.firnaFocusRingInset;
  }
  if (dataSet.firnaFocusTarget != null) {
    domProps["data-firna-focus-target"] = dataSet.firnaFocusTarget;
  }
  return domProps;
}
