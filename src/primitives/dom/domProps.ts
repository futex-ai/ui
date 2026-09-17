/**
 * React Native props to DOM props: element, role, `aria-*`, `tabIndex`,
 * `data-testid` and the forwarded-handler allowlist.
 *
 * A transcription of `react-native-web` 0.21.2's `createElement` +
 * `createDOMProps` pair, so `getByRole`, `toBeDisabled`, the axe sweep and the
 * recorded ARIA snapshots see exactly what they saw before (plan Decision 4).
 * The React Native-only accessibility props stay dropped, as that backend
 * dropped them (Decision 5): the library already emits the literal `aria-*`
 * mirror the shared-UI protocol asks for.
 *
 * Pure; `tests/unit/domProps.test.ts` pins the mapping.
 */
import {
  ACCESSIBILITY_ROLE_TO_WEB_ROLE,
  ARIA_PROPS,
  DISABLEABLE_ELEMENTS,
  FOCUSABLE_ROLES,
  FORWARDED_HANDLERS,
  ID_REF_LIST_ATTRIBUTES,
  NATIVE_FOCUSABLE_ELEMENTS,
  ROLE_COMPONENTS,
  SCROLL_HANDLERS,
} from "./domPropTables";

/** A prop bag on the way in, and DOM props on the way out. */
export type PropBag = Record<string, unknown>;

/** What `createDomProps` decided to render. */
export type DomProps = {
  /** The tag name, after the role table has had its say. */
  element: string;
  /** Props to spread onto that element, `style` and `ref` excluded. */
  props: PropBag;
};

/** How `View` and `Text` differ in what they forward. */
export type DomPropsOptions = {
  /** Tag used when no role names a more specific element. */
  defaultElement: string;
  /** Whether `onScroll` / `onWheel` reach the DOM. `View` only. */
  forwardScrollHandlers?: boolean;
};

/** The ARIA role a prop bag asks for, or nothing when the role is web-less. */
export function webRoleFor(props: PropBag): string | undefined {
  const role = (props.role ?? props.accessibilityRole) as string | undefined;
  if (!role) {
    return undefined;
  }
  const inferred = ACCESSIBILITY_ROLE_TO_WEB_ROLE[role];
  // `null` marks a React Native role with no web equivalent; it is ignored.
  return inferred === null ? undefined : (inferred ?? role);
}

/** The element a role asks for, falling back to the component's own. */
export function elementFor(props: PropBag, defaultElement: string): string {
  // "label" is the one role that names an element without naming an ARIA role.
  if ((props.role ?? props.accessibilityRole) === "label") {
    return "label";
  }
  const role = webRoleFor(props);
  if (role === "heading") {
    const level = props.accessibilityLevel ?? props["aria-level"];
    return level == null ? "h1" : `h${String(level)}`;
  }
  return (role != null ? ROLE_COMPONENTS[role] : undefined) ?? defaultElement;
}

function hyphenate(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function idRefList(value: unknown): unknown {
  return Array.isArray(value) ? value.join(" ") : value;
}

/** Takes the `aria-*` spelling when present, else the `accessibility*` one. */
function ariaValue(props: PropBag, attribute: string, prop: string): unknown {
  const explicit = props[attribute];
  return explicit != null ? explicit : props[prop];
}

function applyAriaProps(props: PropBag, domProps: PropBag) {
  for (const [prop, attribute] of Object.entries(ARIA_PROPS)) {
    const value = ariaValue(props, attribute, prop);
    if (value != null) {
      domProps[attribute] = ID_REF_LIST_ATTRIBUTES.has(attribute)
        ? idRefList(value)
        : value;
    }
  }
  // `aria-hidden` is only forwarded when it is on: `aria-hidden="false"` would
  // otherwise make an element explicitly visible to a screen reader.
  if (ariaValue(props, "aria-hidden", "accessibilityHidden") === true) {
    domProps["aria-hidden"] = true;
  }
  const live = ariaValue(props, "aria-live", "accessibilityLiveRegion");
  if (live != null) {
    domProps["aria-live"] = live === "none" ? "off" : live;
  }
}

/** `aria-readonly` / `aria-required` also set the native attribute on inputs. */
function applyFormSemantics(
  props: PropBag,
  domProps: PropBag,
  element: string,
) {
  const formElement =
    element === "input" || element === "select" || element === "textarea";
  const readOnly = ariaValue(props, "aria-readonly", "accessibilityReadOnly");
  if (readOnly != null) {
    domProps["aria-readonly"] = readOnly;
    if (formElement) {
      domProps.readOnly = true;
    }
  }
  const required = ariaValue(props, "aria-required", "accessibilityRequired");
  if (required != null) {
    domProps["aria-required"] = required;
    // The resolved value, not `accessibilityRequired`: that backend read the
    // unresolved prop here, so a field asking with the literal `aria-required`
    // got the ARIA attribute and no native `required` (see the M2 deviations).
    if (formElement && required === true) {
      domProps.required = true;
    }
  }
}

/**
 * `tabIndex`, `focusable` and the roles the previous backend made focusable.
 *
 * An explicit `tabIndex` always wins. Otherwise native tab stops opt out when
 * they are unfocusable or disabled, the interactive roles opt in, and
 * everything else only becomes a tab stop when `focusable` says so.
 */
function applyTabIndex(
  props: PropBag,
  domProps: PropBag,
  element: string,
  role: string | undefined,
) {
  const { focusable, tabIndex } = props;
  if (
    tabIndex === 0 ||
    tabIndex === "0" ||
    tabIndex === -1 ||
    tabIndex === "-1"
  ) {
    domProps.tabIndex = tabIndex;
    return;
  }
  if (focusable === false) {
    domProps.tabIndex = "-1";
  }
  if (NATIVE_FOCUSABLE_ELEMENTS.has(element)) {
    if (focusable === false || props.accessibilityDisabled === true) {
      domProps.tabIndex = "-1";
    }
  } else if (role != null && FOCUSABLE_ROLES.has(role)) {
    if (focusable !== false) {
      domProps.tabIndex = "0";
    }
  } else if (focusable === true) {
    domProps.tabIndex = "0";
  }
}

/**
 * The `pointerEvents` value the CSS rules in `css.ts` have to implement.
 *
 * The prop wins over the style, matching the order the previous backend
 * appended them in. `auto` is included because its rule is `!important`, which
 * is how a child of a `box-none` parent gets its events back.
 */
export function pointerEventsFor(
  props: PropBag,
  stylePointerEvents?: unknown,
): string | undefined {
  const value = props.pointerEvents ?? stylePointerEvents;
  return typeof value === "string" ? value : undefined;
}

/** Translates a primitive's props into the DOM props its element takes. */
export function createDomProps(
  props: PropBag,
  options: DomPropsOptions,
): DomProps {
  const element = elementFor(props, options.defaultElement);
  const role = webRoleFor(props);
  const domProps: PropBag = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== "function") {
      continue;
    }
    if (
      FORWARDED_HANDLERS.has(key) ||
      (options.forwardScrollHandlers === true && SCROLL_HANDLERS.has(key))
    ) {
      domProps[key] = value;
    }
  }

  applyAriaProps(props, domProps);
  applyFormSemantics(props, domProps, element);

  // `aria-disabled={false}` is not an attribute: only a real "disabled" is.
  if ((props["aria-disabled"] || props.accessibilityDisabled) === true) {
    domProps["aria-disabled"] = true;
    if (DISABLEABLE_ELEMENTS.has(element)) {
      domProps.disabled = true;
    }
  }

  if (role != null) {
    // The `presentation` synonym has wider browser support than `none`.
    domProps.role = role === "none" ? "presentation" : role;
  }

  if (props.dataSet != null && typeof props.dataSet === "object") {
    for (const [key, value] of Object.entries(props.dataSet as PropBag)) {
      if (value != null) {
        domProps[`data-${hyphenate(key)}`] = value;
      }
    }
  }

  applyTabIndex(props, domProps, element, role);

  const id = props.id ?? props.nativeID;
  if (id != null) {
    domProps.id = id;
  }
  if (props.testID != null) {
    domProps["data-testid"] = props.testID;
  }
  if (props.dir != null) {
    domProps.dir = props.dir;
  }
  if (props.lang != null) {
    domProps.lang = props.lang;
  }
  if (props.suppressHydrationWarning != null) {
    domProps.suppressHydrationWarning = props.suppressHydrationWarning;
  }
  if (element === "button" && domProps.type == null) {
    domProps.type = "button";
  }

  return { element, props: domProps };
}
