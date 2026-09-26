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

/** Props to spread on a Firna primitive: the visible box CSS should decorate. */
export type FocusRingHostProps = {
  dataSet?: {
    firnaFocusHost?: FocusRingTarget;
    firnaFocusRing?: FocusRingTarget;
    firnaFocusRingInset?: "true";
    firnaFocusTarget?: "true";
  };
};

/** The same markers as literal `data-*` attributes, for raw DOM elements. */
export type FocusRingDomProps = {
  "data-firna-focus-host"?: FocusRingTarget;
  "data-firna-focus-ring"?: FocusRingTarget;
  "data-firna-focus-ring-inset"?: "true";
  "data-firna-focus-target"?: "true";
};

const EMPTY_DOM_PROPS = Object.freeze({}) as FocusRingDomProps;

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
