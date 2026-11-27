import assert from "node:assert/strict";
import test from "node:test";

import { act, createElement, Fragment, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import type { FocusIndicator } from "../../src/focusRingHost";
import { domBackendCss } from "../../src/primitives/domBackendCss.web";
import { DOM_BACKEND_STYLE_ID } from "../../src/primitives/webStylesheet";

import { resolveWebFirst } from "./webResolution";

// Load the hook as the web build resolves it: its stylesheet module and the
// seam's `Platform` then come from their `.web` files.
resolveWebFirst();
const { useFocusRing } = await import("../../src/focusRing");

// Tells React that `act` runs this test's renders.
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

/** An element of the fake document: a tag name, an id, text, and children. */
class FakeElement extends EventTarget {
  readonly childNodes: FakeElement[] = [];
  id = "";
  readonly nodeType = 1;
  textContent = "";

  constructor(
    readonly tagName: string,
    readonly ownerDocument: FakeDocument,
  ) {
    super();
  }

  get firstChild(): FakeElement | null {
    return this.childNodes[0] ?? null;
  }

  insertBefore(node: FakeElement, before: FakeElement | null): FakeElement {
    const index = before == null ? -1 : this.childNodes.indexOf(before);
    this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, node);
    return node;
  }
}

/**
 * The parts of a document that React DOM's client renderer and the stylesheet
 * injection read, while a component renders no host element of its own.
 */
class FakeDocument extends EventTarget {
  readonly activeElement = null;
  readonly body = null;
  readonly defaultView = { HTMLIFrameElement: class {}, event: undefined };
  readonly head = new FakeElement("HEAD", this);
  readonly nodeType = 9;

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName.toUpperCase(), this);
  }

  getElementById(id: string): FakeElement | null {
    return this.head.childNodes.find((node) => node.id === id) ?? null;
  }
}

const fakeGlobals = ["document", "window"] as const;

/**
 * Renders `children` on the client into a fresh fake document whose `<head>`
 * already holds one stylesheet of the app, and returns that `<head>`. `act`
 * runs all the work that the render schedules before the globals come back.
 */
async function renderInFakeDocument(children: ReactNode): Promise<FakeElement> {
  const document = new FakeDocument();
  const appStyle = document.createElement("style");
  appStyle.id = "app-styles";
  document.head.insertBefore(appStyle, null);
  const values = { document, window: document.defaultView };
  const previous = fakeGlobals.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  for (const name of fakeGlobals) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: values[name],
      writable: true,
    });
  }
  try {
    const container = document.createElement("div");
    const root = createRoot(container as unknown as HTMLElement);
    await act(async () => root.render(children));
    await act(async () => root.unmount());
  } finally {
    fakeGlobals.forEach((name, index) => {
      const descriptor = previous[index];
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    });
  }
  return document.head;
}

/** A focus host that renders no element, so only the hook touches the page. */
function FocusHost({ indicator }: { indicator: FocusIndicator }) {
  useFocusRing({ indicator });
  return null;
}

test("useFocusRing injects the library stylesheet once, first in the head, for every indicator", async () => {
  // On the react-native-web route no primitive injects the stylesheet, so the
  // hook must, also for `outline` and `none`, whose rules live there too.
  for (const indicator of ["ring", "outline", "none"] as const) {
    const head = await renderInFakeDocument(
      createElement(
        Fragment,
        null,
        createElement(FocusHost, { indicator }),
        createElement(FocusHost, { indicator }),
      ),
    );
    assert.deepEqual(
      head.childNodes.map((node) => [node.tagName, node.id]),
      [
        ["STYLE", DOM_BACKEND_STYLE_ID],
        ["STYLE", "app-styles"],
      ],
      `${indicator}: one library stylesheet before the app's own`,
    );
    assert.equal(head.childNodes[0].textContent, domBackendCss, indicator);
  }
});
