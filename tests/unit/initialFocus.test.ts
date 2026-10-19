import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  INITIAL_FOCUS_ATTRIBUTE,
  INITIAL_FOCUS_SKIP_SELECTOR,
  initialFocusLanding,
  skipInitialFocusDomProps,
  skipInitialFocusProps,
  skipsInitialFocus,
  type InitialFocusHost,
} from "../../src/initialFocus";
import { Pressable } from "../../src/primitives/dom/Pressable";
import { View } from "../../src/primitives/dom/View";

/**
 * A stand-in for a DOM element: `closest` answers the skip selector from the
 * `marked` flag of the element or any ancestor, which is all the landing
 * helpers read. No DOM is needed to pin the inheritance rule.
 */
function host(name: string, marked = false, parent?: FakeHost): FakeHost {
  return { marked, name, parent };
}

type FakeHost = { marked: boolean; name: string; parent?: FakeHost };

function asInitialFocusHost(element: FakeHost): InitialFocusHost & FakeHost {
  return {
    ...element,
    closest(selector: string) {
      assert.equal(selector, INITIAL_FOCUS_SKIP_SELECTOR);
      let current: FakeHost | undefined = element;
      while (current) {
        if (current.marked) return current;
        current = current.parent;
      }
      return null;
    },
  };
}

test("the skip marker has one attribute spelled two ways", () => {
  assert.equal(INITIAL_FOCUS_ATTRIBUTE, "data-firna-initial-focus");
  assert.equal(
    INITIAL_FOCUS_SKIP_SELECTOR,
    '[data-firna-initial-focus="skip"]',
  );
  assert.deepEqual(skipInitialFocusProps, {
    dataSet: { firnaInitialFocus: "skip" },
  });
  assert.deepEqual(skipInitialFocusDomProps, {
    "data-firna-initial-focus": "skip",
  });
  // Both spellings are shared constants, so neither may be mutated by a caller.
  assert.equal(Object.isFrozen(skipInitialFocusProps), true);
  assert.equal(Object.isFrozen(skipInitialFocusProps.dataSet), true);
  assert.equal(Object.isFrozen(skipInitialFocusDomProps), true);
});

test("a primitive writes the dataSet spelling out as the DOM attribute", () => {
  const markup = renderToStaticMarkup(
    createElement(
      View,
      skipInitialFocusProps,
      createElement(Pressable, {
        accessibilityRole: "button",
        ...skipInitialFocusProps,
      }),
    ),
  );

  assert.equal(
    markup.match(/data-firna-initial-focus="skip"/g)?.length,
    2,
    markup,
  );
});

test("an element skips initial focus when it or an ancestor is marked", () => {
  const container = host("container", true);
  const plain = host("plain");

  assert.equal(
    skipsInitialFocus(asInitialFocusHost(host("marked", true))),
    true,
  );
  assert.equal(skipsInitialFocus(asInitialFocusHost(plain)), false);
  assert.equal(
    skipsInitialFocus(asInitialFocusHost(host("child", false, container))),
    true,
  );
  assert.equal(
    skipsInitialFocus(
      asInitialFocusHost(
        host("grandchild", false, host("row", false, container)),
      ),
    ),
    true,
  );
});

test("the landing is the first candidate that does not skip, else null", () => {
  const help = asInitialFocusHost(host("help", true));
  const field = asInitialFocusHost(host("field"));
  const action = asInitialFocusHost(host("action"));

  assert.equal(initialFocusLanding([help, field, action])?.name, "field");
  assert.equal(initialFocusLanding([field, help, action])?.name, "field");
  assert.equal(initialFocusLanding([help, action])?.name, "action");
  // Every candidate marked: the caller falls through to its own fallback
  // rather than landing on a control that asked not to be the landing spot.
  assert.equal(initialFocusLanding([help]), null);
  assert.equal(initialFocusLanding([]), null);
});

test("the modal lands on the first unmarked caller control and traps every control", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");

  assert.match(
    source,
    /import \{ initialFocusLanding \} from "\.\.\/initialFocus"/,
  );
  // The landing picker filters the close button out and then defers to the
  // marker-aware helper, so a marked ⓘ or chip-remove button never wins.
  assert.match(
    source,
    /initialFocusLanding\(\s*webModalFocusableElements\(surface\)\.filter\(\s*\(element\) => element !== closeButton,?\s*\),?\s*\)/,
  );
  // The Tab trap keeps every focusable element, marked or not: the marker
  // moves the landing spot, never the tab order.
  assert.match(
    source,
    /function trapWebModalFocus[\s\S]*?const focusable = webModalFocusableElements\(surface\);/,
  );
  assert.doesNotMatch(
    source,
    /function trapWebModalFocus[\s\S]*?initialFocusLanding/,
  );
});

test("secondary field controls carry the skip marker", () => {
  const labelInfo = readSource("../../src/input/LabelInfo.tsx");
  const inputFrame = readSource("../../src/input/InputFrame.tsx");
  const multiSelect = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  // The ⓘ button keeps its focus-ring markers and gains the skip marker in the
  // same `dataSet`: a second spread would have replaced the ring markers.
  assert.match(
    labelInfo,
    /\.\.\.dataSetProps\(focus\.focusRingProps, skipInitialFocusProps\)/,
  );
  // The clear button and the labelled suffix button carry no other marker.
  assert.match(
    inputFrame,
    /accessibilityLabel=\{clearLabel\}[\s\S]*?\{\.\.\.skipInitialFocusProps\}/,
  );
  assert.match(
    inputFrame,
    /accessibilityLabel=\{label\}[\s\S]*?\{\.\.\.skipInitialFocusProps\}/,
  );
  // Chip-remove buttons precede the multi-select's own input in DOM order.
  assert.match(
    multiSelect,
    /accessibilityLabel=\{`Remove \$\{option\.label\}`\}[\s\S]*?\{\.\.\.skipInitialFocusProps\}/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
