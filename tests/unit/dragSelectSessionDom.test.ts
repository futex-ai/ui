import assert from "node:assert/strict";
import test from "node:test";

import { startDragSelectableSession } from "../../src/drag-select/dragSelectableSession";
import { dragSelectableSessionDom } from "../../src/drag-select/dragSelectableSessionDom";
import {
  addNode,
  attachListeners,
  getResponderNode,
  removeNode,
} from "../../src/primitives/dom/responder/ResponderSystem";
import type { GestureResponderEvent } from "../../src/primitives/types";

import {
  pointerDown,
  pointerMove,
  pressHandlers,
  withFakeDocument,
} from "./domPressFakes";
import { asElement, FakeElement } from "./dragSelectFakeDom";

/**
 * The browser side of a drag-select session, on a fake document: the
 * document listeners, and the end of the library presses at the start.
 */

/** The document scrolling element of a 1280 by 720 viewport at rest. */
class FakeRootElement extends FakeElement {
  readonly clientHeight = 720;
  readonly clientWidth = 1280;
  readonly ownerDocument = { defaultView: null, documentElement: this };
  readonly scrollLeft = 0;
  readonly scrollTop = 0;
}

class FakeProviderElement extends FakeElement {
  readonly dispatchedMoves: Event[] = [];

  dispatchEvent(event: Event): boolean {
    this.dispatchedMoves.push(event);
    return !event.bubbles || dispatchFrom(this, event);
  }
}

class FakeMouseEvent extends Event {
  constructor(
    type: string,
    readonly init: MouseEventInit,
  ) {
    const { bubbles, cancelable, composed, ...mouse } = init;
    super(type, { bubbles, cancelable, composed });
    Object.assign(this, mouse, { pageX: init.clientX, pageY: init.clientY });
  }
}

const originalMouseEvent = Object.getOwnPropertyDescriptor(
  globalThis,
  "MouseEvent",
);
test.before(() => {
  Object.defineProperty(globalThis, "MouseEvent", {
    configurable: true,
    value: FakeMouseEvent,
  });
});
test.after(() => {
  if (originalMouseEvent) {
    Object.defineProperty(globalThis, "MouseEvent", originalMouseEvent);
  } else {
    Reflect.deleteProperty(globalThis, "MouseEvent");
  }
});

function withDragSession(
  check: (
    provider: FakeProviderElement,
    pressOuts: GestureResponderEvent[],
  ) => void,
) {
  withFakeDocument(() => {
    const provider = new FakeProviderElement();
    const pressOuts: GestureResponderEvent[] = [];
    pressHandlers({
      delayPressIn: 0,
      onPressChange: () => undefined,
      onPressEnd: (event) => pressOuts.push(event),
    }).onPointerDown(pointerDown(1, { x: 100, y: 40 }));
    const env = dragSelectableSessionDom({
      commit: () => undefined,
      container: { element: asElement(new FakeRootElement()), root: true },
      end: () => undefined,
      provider: asElement(provider),
      render: () => undefined,
      targets: () => [],
    });
    const session = startDragSelectableSession(
      {
        autoScroll: false,
        mode: "replace",
        pointerId: 1,
        press: { x: 100, y: 40 },
        preventTextSelection: false,
        threshold: 4,
      },
      env,
    );
    const providerId = 1;
    addNode(providerId, asElement(provider), {
      onMoveShouldSetResponderCapture: env.claimResponder,
    });
    attachListeners();
    try {
      check(provider, pressOuts);
    } finally {
      session.stop();
      removeNode(providerId);
    }
  });
}

function dispatchFrom(target: FakeElement, event: Event): boolean {
  const path: FakeElement[] = [];
  for (let node: FakeElement | null = target; node; node = node.parentElement) {
    path.push(node);
  }
  Object.defineProperty(event, "target", { value: target });
  return document.dispatchEvent(
    Object.assign(event, { composedPath: () => path }),
  );
}

function mouse(
  target: FakeElement,
  type: "mousedown" | "mousemove" | "mouseup",
  pageX: number,
) {
  dispatchFrom(
    target,
    new FakeMouseEvent(type, {
      altKey: false,
      button: 0,
      buttons: type === "mouseup" ? 0 : 1,
      clientX: pageX,
      clientY: 40,
      ctrlKey: false,
    }),
  );
}

test("the starting move ends the DOM press and claims the responder until release", () => {
  withDragSession((provider, pressOuts) => {
    mouse(provider, "mousedown", 100);
    dispatchFrom(provider, pointerMove(1, { x: 102, y: 40 }));
    mouse(provider, "mousemove", 102);
    assert.equal(
      pressOuts.length,
      0,
      "a move below the threshold ends nothing",
    );
    assert.equal(getResponderNode(), null);

    const start = pointerMove(1, { x: 112, y: 40 });
    dispatchFrom(provider, start);
    mouse(provider, "mousemove", 112);
    assert.equal(getResponderNode(), provider);
    assert.equal(pressOuts.length, 1);
    assert.equal(pressOuts[0].nativeEvent, start);

    mouse(provider, "mouseup", 112);
    assert.equal(getResponderNode(), null);
    assert.equal(pressOuts.length, 1);
  });
});

function withHeldResponder(
  check: (
    provider: FakeProviderElement,
    holder: FakeElement,
    holderEvents: string[],
  ) => void,
) {
  withDragSession((provider) => {
    const holder = provider.append(new FakeElement());
    const holderId = 2;
    const holderEvents: string[] = [];
    addNode(holderId, asElement(holder), {
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: ({ nativeEvent }) => {
        holderEvents.push(
          `request ${nativeEvent.type} at ${nativeEvent.pageX}`,
        );
        return true;
      },
      onResponderTerminate: ({ nativeEvent }) => {
        holderEvents.push(
          `terminate ${nativeEvent.type} at ${nativeEvent.pageX}`,
        );
      },
      onResponderRelease: ({ nativeEvent }) => {
        holderEvents.push(
          `release ${nativeEvent.type} at ${nativeEvent.pageX}`,
        );
      },
    });

    try {
      mouse(holder, "mousedown", 100);
      assert.equal(getResponderNode(), holder);
      check(provider, holder, holderEvents);
    } finally {
      removeNode(holderId);
    }
  });
}

test("the starting move takes the DOM responder from an active child gesture", () => {
  withHeldResponder((provider, holder, holderEvents) => {
    dispatchFrom(holder, pointerMove(1, { x: 102, y: 40 }));
    mouse(holder, "mousemove", 102);
    assert.equal(getResponderNode(), holder);

    dispatchFrom(holder, pointerMove(1, { x: 112, y: 40 }));
    mouse(holder, "mousemove", 112);
    assert.equal(
      getResponderNode(),
      provider,
      "the provider takes the responder at the start",
    );

    mouse(holder, "mouseup", 112);
    assert.equal(getResponderNode(), null);
    assert.deepEqual(holderEvents, [
      "request mousemove at 112",
      "terminate mousemove at 112",
    ]);
    assert.deepEqual(provider.dispatchedMoves, []);
  });
});

test("a starting move outside the provider takes the DOM responder on that move", () => {
  withHeldResponder((provider, _holder, holderEvents) => {
    const outside = new FakeElement();
    const start = {
      altKey: true,
      bubbles: true,
      button: 0,
      buttons: 3,
      cancelable: true,
      clientX: 112,
      clientY: 40,
      ctrlKey: false,
      metaKey: true,
      screenX: 520,
      screenY: 300,
      shiftKey: true,
    };
    dispatchFrom(outside, pointerMove(1, { x: 112, y: 40 }));
    dispatchFrom(outside, new FakeMouseEvent("mousemove", start));
    assert.equal(
      getResponderNode(),
      provider,
      "the provider takes the responder on the starting move outside",
    );
    assert.deepEqual(holderEvents, [
      "request mousemove at 112",
      "terminate mousemove at 112",
    ]);

    dispatchFrom(outside, pointerMove(1, { x: 120, y: 40 }));
    mouse(outside, "mousemove", 120);
    mouse(outside, "mouseup", 120);
    assert.equal(getResponderNode(), null);
    assert.equal(holderEvents.length, 2);
    assert.equal(provider.dispatchedMoves.length, 1);
    const [copy] = provider.dispatchedMoves;
    assert.ok(copy instanceof FakeMouseEvent);
    assert.equal(copy.type, "mousemove");
    assert.partialDeepStrictEqual(copy.init, start);
  });
});
