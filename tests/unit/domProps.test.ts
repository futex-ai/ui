import assert from "node:assert/strict";
import test from "node:test";

import {
  createDomProps,
  elementFor,
  pointerEventsFor,
  webRoleFor,
} from "../../src/primitives/dom/domProps";
import { objectFitFor } from "../../src/primitives/dom/imageFit";

/**
 * The prop mapping decides which element renders, which `role` and `aria-*`
 * attributes it carries, and whether it is a tab stop — which is what
 * `getByRole`, `toBeDisabled`, the axe sweep and the recorded ARIA snapshots
 * all read. It is a transcription of `react-native-web` 0.21.2's
 * `createDOMProps`, so each case names the rule it pins.
 */

const view = { defaultElement: "div", forwardScrollHandlers: true };

test("a role names both the ARIA role and the element", () => {
  assert.equal(webRoleFor({ accessibilityRole: "header" }), "heading");
  assert.equal(webRoleFor({ accessibilityRole: "adjustable" }), "slider");
  assert.equal(webRoleFor({ accessibilityRole: "image" }), "img");
  assert.equal(webRoleFor({ accessibilityRole: "switch" }), "switch");
  // Roles with no web equivalent are ignored rather than forwarded.
  assert.equal(webRoleFor({ accessibilityRole: "text" }), undefined);
  assert.equal(webRoleFor({ accessibilityRole: "imagebutton" }), undefined);
  assert.equal(webRoleFor({ accessibilityRole: "keyboardkey" }), undefined);
  // `role` wins over `accessibilityRole`.
  assert.equal(
    webRoleFor({ accessibilityRole: "button", role: "checkbox" }),
    "checkbox",
  );

  assert.equal(elementFor({ accessibilityRole: "button" }, "div"), "button");
  assert.equal(elementFor({ accessibilityRole: "header" }, "div"), "h1");
  assert.equal(
    elementFor({ accessibilityLevel: 3, accessibilityRole: "header" }, "div"),
    "h3",
  );
  assert.equal(elementFor({ "aria-level": 2, role: "heading" }, "div"), "h2");
  assert.equal(elementFor({ role: "list" }, "div"), "ul");
  assert.equal(elementFor({ role: "listitem" }, "div"), "li");
  assert.equal(elementFor({ accessibilityRole: "summary" }, "div"), "section");
  assert.equal(elementFor({ role: "label" }, "div"), "label");
  assert.equal(elementFor({ role: "none" }, "div"), "div");
  assert.equal(elementFor({}, "span"), "span");
});

test("a button element gets an explicit type and presentation is renamed", () => {
  assert.deepEqual(createDomProps({ accessibilityRole: "button" }, view), {
    element: "button",
    // No `tabIndex`: a `button` element is already a tab stop, and that is
    // exactly what the previous backend left off too.
    props: { role: "button", type: "button" },
  });
  assert.equal(
    createDomProps({ role: "none" }, view).props.role,
    "presentation",
  );
});

test("accessibility props map to their aria attribute", () => {
  const { props } = createDomProps(
    {
      accessibilityLabel: "Close",
      accessibilityLabelledBy: ["a", "b"],
      accessibilityLevel: 2,
      accessibilityLiveRegion: "polite",
      accessibilityValueMax: 10,
      accessibilityValueNow: 4,
    },
    view,
  );
  assert.deepEqual(props, {
    "aria-label": "Close",
    "aria-labelledby": "a b",
    "aria-level": 2,
    "aria-live": "polite",
    "aria-valuemax": 10,
    "aria-valuenow": 4,
  });
  assert.equal(
    createDomProps({ accessibilityLiveRegion: "none" }, view).props[
      "aria-live"
    ],
    "off",
  );
  // A literal `aria-*` wins over the React Native spelling and passes through.
  assert.equal(
    createDomProps({ accessibilityLabel: "rn", "aria-label": "web" }, view)
      .props["aria-label"],
    "web",
  );
});

test("React Native-only accessibility props are dropped, as before", () => {
  const { props } = createDomProps(
    {
      accessibilityElementsHidden: true,
      accessibilityHint: "Opens the menu",
      accessibilityState: { checked: true, disabled: true },
      accessibilityValue: { max: 10, now: 4 },
      accessibilityViewIsModal: true,
      accessible: true,
      collapsable: false,
      hitSlop: 8,
      importantForAccessibility: "no",
      removeClippedSubviews: true,
    },
    view,
  );
  assert.deepEqual(props, {});
});

test("aria-hidden and aria-disabled only appear when they are true", () => {
  assert.deepEqual(createDomProps({ "aria-hidden": false }, view).props, {});
  assert.deepEqual(createDomProps({ "aria-hidden": true }, view).props, {
    "aria-hidden": true,
  });
  assert.deepEqual(createDomProps({ "aria-disabled": false }, view).props, {});
  assert.deepEqual(createDomProps({ "aria-disabled": true }, view).props, {
    "aria-disabled": true,
  });
  // A form element also takes the native attribute.
  assert.deepEqual(
    createDomProps({ accessibilityRole: "button", "aria-disabled": true }, view)
      .props,
    {
      "aria-disabled": true,
      disabled: true,
      role: "button",
      type: "button",
    },
  );
  // `aria-checked={false}` is meaningful, so it stays.
  assert.equal(
    createDomProps({ "aria-checked": false }, view).props["aria-checked"],
    false,
  );
});

test("tabIndex follows the element, the role and focusable", () => {
  const tabIndexOf = (props: Record<string, unknown>) =>
    createDomProps(props, view).props.tabIndex;
  assert.equal(tabIndexOf({ tabIndex: 0 }), 0);
  assert.equal(tabIndexOf({ focusable: false, tabIndex: -1 }), -1);
  // Interactive roles are tab stops by default — but only when the element is
  // not already one, which is why `accessibilityRole="button"` (a `button`
  // element) is left alone and `role="switch"` (a `div`) is not.
  assert.equal(tabIndexOf({ accessibilityRole: "button" }), undefined);
  assert.equal(tabIndexOf({ role: "switch" }), "0");
  assert.equal(tabIndexOf({ role: "checkbox", focusable: false }), "-1");
  // A plain view is not, unless it asks to be.
  assert.equal(tabIndexOf({}), undefined);
  assert.equal(tabIndexOf({ focusable: true }), "0");
  assert.equal(tabIndexOf({ focusable: false }), "-1");
  // Native tab stops opt out instead of opting in.
  assert.equal(
    tabIndexOf({ accessibilityDisabled: true, accessibilityRole: "button" }),
    "-1",
  );
  assert.equal(tabIndexOf({ role: "progressbar" }), undefined);
});

test("ids, test ids, data sets and direction reach the element", () => {
  const { props } = createDomProps(
    {
      dataSet: { columnId: "name", empty: null },
      dir: "ltr",
      lang: "en",
      nativeID: "legacy",
      testID: "cell",
    },
    view,
  );
  assert.deepEqual(props, {
    "data-column-id": "name",
    "data-testid": "cell",
    dir: "ltr",
    id: "legacy",
    lang: "en",
  });
  assert.equal(
    createDomProps({ id: "own", nativeID: "legacy" }, view).props.id,
    "own",
  );
});

test("only the allowlisted handlers are forwarded", () => {
  const handler = () => {};
  const { props } = createDomProps(
    {
      onBlur: handler,
      onClick: handler,
      onContextMenu: handler,
      onFocus: handler,
      onKeyDown: handler,
      onLayout: handler,
      onMouseEnter: handler,
      onPointerDown: handler,
      onPointerEnterCapture: handler,
      onPressIn: handler,
      onResponderGrant: handler,
      onScroll: handler,
      onTouchStart: handler,
      onWheel: handler,
    },
    view,
  );
  assert.deepEqual(Object.keys(props).sort(), [
    "onBlur",
    "onClick",
    "onContextMenu",
    "onFocus",
    "onKeyDown",
    "onMouseEnter",
    "onPointerDown",
    "onScroll",
    "onTouchStart",
    "onWheel",
  ]);
  // `Text` does not forward the scroll handlers.
  assert.deepEqual(
    Object.keys(
      createDomProps(
        { onScroll: handler, onWheel: handler },
        {
          defaultElement: "span",
        },
      ).props,
    ),
    [],
  );
});

test("pointerEvents takes the prop over the style", () => {
  assert.equal(pointerEventsFor({ pointerEvents: "none" }, "auto"), "none");
  assert.equal(pointerEventsFor({}, "box-none"), "box-none");
  assert.equal(pointerEventsFor({}, undefined), undefined);
  // The prop itself never reaches the DOM; `View` turns it into the attribute
  // the child-selector rules in `dom/css.ts` key off.
  assert.deepEqual(createDomProps({ pointerEvents: "none" }, view).props, {});
});

test("an image takes its fit from the prop or the style", () => {
  assert.equal(objectFitFor(undefined, undefined), "cover");
  assert.equal(objectFitFor("contain", undefined), "contain");
  assert.equal(objectFitFor("stretch", undefined), "fill");
  assert.equal(objectFitFor("center", undefined), "none");
  // `react-native-web` read the deprecated style key as a fallback, so it keeps
  // working; the key itself never reaches the emitted CSS.
  assert.equal(objectFitFor(undefined, { resizeMode: "contain" }), "contain");
  assert.equal(
    objectFitFor(undefined, [{ width: 10 }, { resizeMode: "stretch" }]),
    "fill",
  );
  // The prop wins over the style, as it did there.
  assert.equal(objectFitFor("cover", { resizeMode: "contain" }), "cover");
});
