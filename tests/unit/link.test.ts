import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Link } from "../../src/primitives/dom/Link";
import {
  navigatesInApp,
  type LinkClick,
} from "../../src/primitives/linkActivation";

/** A plain primary click: the one click that the app takes over. */
const plain: LinkClick = {
  altKey: false,
  button: 0,
  ctrlKey: false,
  defaultPrevented: false,
  metaKey: false,
  shiftKey: false,
};

const sameTab = { hasAction: true, newTab: false };

test("a link with an action navigates in the app on native and on a plain web click of a same-tab link", () => {
  const cases: [
    string,
    { hasAction: boolean; newTab: boolean },
    LinkClick | undefined,
    boolean,
  ][] = [
    ["plain primary click", sameTab, plain, true],
    ["Ctrl click", sameTab, { ...plain, ctrlKey: true }, false],
    ["Meta click", sameTab, { ...plain, metaKey: true }, false],
    ["Shift click", sameTab, { ...plain, shiftKey: true }, false],
    ["Alt click", sameTab, { ...plain, altKey: true }, false],
    ["middle click", sameTab, { ...plain, button: 1 }, false],
    [
      "click handled inside",
      sameTab,
      { ...plain, defaultPrevented: true },
      false,
    ],
    ["new-tab link", { hasAction: true, newTab: true }, plain, false],
    [
      "link without an action",
      { hasAction: false, newTab: false },
      plain,
      false,
    ],
    ["native activation", sameTab, undefined, true],
    [
      "native new-tab activation",
      { hasAction: true, newTab: true },
      undefined,
      true,
    ],
    [
      "native link without an action",
      { hasAction: false, newTab: false },
      undefined,
      false,
    ],
  ];
  for (const [name, link, click, expected] of cases) {
    assert.equal(navigatesInApp(link, click), expected, name);
  }
});

test("a web link is an anchor with its address and focus marker in static markup", () => {
  const markup = renderToStaticMarkup(
    createElement(
      Link,
      { dataSet: { firnaFocusRing: "self" }, href: "/projects/files" },
      "Files",
    ),
  );

  assert.match(markup, /^<a [^>]*href="\/projects\/files"[^>]*>Files<\/a>$/);
  assert.match(markup, /data-firna-focus-ring="self"/);
  // The anchor is a link and a tab stop already: no role, no tab index, and
  // no new-tab or current-page attributes unless the caller asks.
  assert.doesNotMatch(markup, /role=|tabindex=|target=|rel=|aria-current=/);
});

test("a current new-tab web link marks the page and protects the opener", () => {
  const markup = renderToStaticMarkup(
    createElement(
      Link,
      {
        accessibilityLabel: "Help center (opens in a new tab)",
        current: true,
        href: "https://help.example.com",
        newTab: true,
      },
      "Help center",
    ),
  );

  assert.match(markup, /^<a /);
  assert.match(markup, /href="https:\/\/help\.example\.com"/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /aria-label="Help center \(opens in a new tab\)"/);
});
