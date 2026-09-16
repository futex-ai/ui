/**
 * The role, accessibility and forwarded-prop tables `domProps.ts` maps with.
 *
 * Transcribed from `react-native-web` 0.21.2
 * (`modules/AccessibilityUtil/*`, `modules/createDOMProps/index.js` and
 * `modules/forwardedProps/index.js`) so the DOM backend puts the same element,
 * the same `role`, and the same attributes on screen (plan Decision 4).
 */

/** React Native accessibility roles that resolve to a different ARIA role. */
export const ACCESSIBILITY_ROLE_TO_WEB_ROLE: Readonly<
  Record<string, string | null>
> = {
  adjustable: "slider",
  button: "button",
  header: "heading",
  image: "img",
  imagebutton: null,
  keyboardkey: null,
  label: null,
  link: "link",
  none: "presentation",
  search: "search",
  summary: "region",
  text: null,
};

/** ARIA roles that have a native element, which is rendered instead of a div. */
export const ROLE_COMPONENTS: Readonly<Record<string, string>> = {
  article: "article",
  banner: "header",
  blockquote: "blockquote",
  button: "button",
  code: "code",
  complementary: "aside",
  contentinfo: "footer",
  deletion: "del",
  emphasis: "em",
  figure: "figure",
  insertion: "ins",
  form: "form",
  list: "ul",
  listitem: "li",
  main: "main",
  navigation: "nav",
  paragraph: "p",
  region: "section",
  strong: "strong",
};

/** Elements the browser already makes a keyboard tab stop. */
export const NATIVE_FOCUSABLE_ELEMENTS: ReadonlySet<string> = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
]);

/** Roles `react-native-web` makes a keyboard tab stop by default. */
export const FOCUSABLE_ROLES: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "link",
  "radio",
  "textbox",
  "switch",
]);

/** Elements that take the `disabled` attribute as well as `aria-disabled`. */
export const DISABLEABLE_ELEMENTS: ReadonlySet<string> = new Set([
  "button",
  "form",
  "input",
  "select",
  "textarea",
]);

/**
 * `accessibility*` props and the `aria-*` attribute each becomes. The four
 * with extra behaviour (`Disabled`, `Hidden`, `LiveRegion`, `ReadOnly`,
 * `Required`) are handled in `domProps.ts` rather than here.
 */
export const ARIA_PROPS: Readonly<Record<string, string>> = {
  accessibilityActiveDescendant: "aria-activedescendant",
  accessibilityAtomic: "aria-atomic",
  accessibilityAutoComplete: "aria-autocomplete",
  accessibilityBusy: "aria-busy",
  accessibilityChecked: "aria-checked",
  accessibilityColumnCount: "aria-colcount",
  accessibilityColumnIndex: "aria-colindex",
  accessibilityColumnSpan: "aria-colspan",
  accessibilityControls: "aria-controls",
  accessibilityCurrent: "aria-current",
  accessibilityDescribedBy: "aria-describedby",
  accessibilityDetails: "aria-details",
  accessibilityErrorMessage: "aria-errormessage",
  accessibilityExpanded: "aria-expanded",
  accessibilityFlowTo: "aria-flowto",
  accessibilityHasPopup: "aria-haspopup",
  accessibilityInvalid: "aria-invalid",
  accessibilityKeyShortcuts: "aria-keyshortcuts",
  accessibilityLabel: "aria-label",
  accessibilityLabelledBy: "aria-labelledby",
  accessibilityLevel: "aria-level",
  accessibilityModal: "aria-modal",
  accessibilityMultiline: "aria-multiline",
  accessibilityMultiSelectable: "aria-multiselectable",
  accessibilityOrientation: "aria-orientation",
  accessibilityOwns: "aria-owns",
  accessibilityPlaceholder: "aria-placeholder",
  accessibilityPosInSet: "aria-posinset",
  accessibilityPressed: "aria-pressed",
  accessibilityRoleDescription: "aria-roledescription",
  accessibilityRowCount: "aria-rowcount",
  accessibilityRowIndex: "aria-rowindex",
  accessibilityRowSpan: "aria-rowspan",
  accessibilitySelected: "aria-selected",
  accessibilitySetSize: "aria-setsize",
  accessibilitySort: "aria-sort",
  accessibilityValueMax: "aria-valuemax",
  accessibilityValueMin: "aria-valuemin",
  accessibilityValueNow: "aria-valuenow",
  accessibilityValueText: "aria-valuetext",
};

/** `aria-*` attributes whose value is a space-separated list of element ids. */
export const ID_REF_LIST_ATTRIBUTES: ReadonlySet<string> = new Set([
  "aria-controls",
  "aria-describedby",
  "aria-flowto",
  "aria-keyshortcuts",
  "aria-labelledby",
  "aria-owns",
]);

/**
 * Every event handler that reaches the DOM element.
 *
 * `react-native-web`'s `forwardedProps` allowlist, which is how it keeps React
 * from warning about unknown attributes and how React Native-only props
 * (`accessibilityState`, `hitSlop`, `collapsable`, …) get dropped on web
 * (plan Decisions 5 and 6). A handler absent here is not forwarded — including
 * the capture-phase pointer handlers, which that backend never forwarded
 * either.
 */
export const FORWARDED_HANDLERS: ReadonlySet<string> = new Set([
  // clickProps
  "onClick",
  "onAuxClick",
  "onContextMenu",
  "onGotPointerCapture",
  "onLostPointerCapture",
  "onPointerCancel",
  "onPointerDown",
  "onPointerEnter",
  "onPointerMove",
  "onPointerLeave",
  "onPointerOut",
  "onPointerOver",
  "onPointerUp",
  // focusProps
  "onBlur",
  "onFocus",
  // keyboardProps
  "onKeyDown",
  "onKeyDownCapture",
  "onKeyUp",
  "onKeyUpCapture",
  // mouseProps
  "onMouseDown",
  "onMouseEnter",
  "onMouseLeave",
  "onMouseMove",
  "onMouseOver",
  "onMouseOut",
  "onMouseUp",
  // touchProps
  "onTouchCancel",
  "onTouchCancelCapture",
  "onTouchEnd",
  "onTouchEndCapture",
  "onTouchMove",
  "onTouchMoveCapture",
  "onTouchStart",
  "onTouchStartCapture",
]);

/** `onScroll` and `onWheel`, which `View` forwards and `Text` does not. */
export const SCROLL_HANDLERS: ReadonlySet<string> = new Set([
  "onScroll",
  "onWheel",
]);
