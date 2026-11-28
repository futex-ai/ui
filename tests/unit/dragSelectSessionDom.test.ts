import assert from "node:assert/strict";
import test from "node:test";

import { startDragSelectableSession } from "../../src/drag-select/dragSelectableSession";
import { dragSelectableSessionDom } from "../../src/drag-select/dragSelectableSessionDom";
import type { ResponderEvent } from "../../src/primitives/dom/responder/createResponderEvent";
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

class FakeSessionDocument {
  readonly capture = new EventTarget();
  readonly bubble = new EventTarget();

  addEventListener(
    ...[type, listener, options]: Parameters<EventTarget["addEventListener"]>
  ) {
    const phase = options === true ? this.capture : this.bubble;
    phase.addEventListener(type, listener);
  }

  removeEventListener(
    ...[type, listener, options]: Parameters<EventTarget["removeEventListener"]>
  ) {
    const phase = options === true ? this.capture : this.bubble;
    phase.removeEventListener(type, listener);
  }
}

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
    Object.defineProperty(globalThis, "document", {
      value: new FakeSessionDocument(),
    });
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

function dispatchFrom(
  target: FakeElement,
  event: Event,
  stopAtTarget = false,
): boolean {
  const path: FakeElement[] = [];
  for (let node: FakeElement | null = target; node; node = node.parentElement) {
    path.push(node);
  }
  Object.defineProperty(event, "target", { value: target });
  Object.assign(event, { composedPath: () => path });
  assert.ok(document instanceof FakeSessionDocument);
  document.capture.dispatchEvent(event);
  if (stopAtTarget) {
    event.stopPropagation();
  }
  return event.cancelBubble
    ? !event.defaultPrevented
    : document.bubble.dispatchEvent(event);
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
      bubbles: true,
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
    const record = (action: string, { nativeEvent }: ResponderEvent) => {
      holderEvents.push(
        `${action} ${nativeEvent.type} at ${nativeEvent.pageX}`,
      );
    };
    addNode(holderId, asElement(holder), {
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: (event) => {
        record("request", event);
        return true;
      },
      onResponderTerminate: (event) => record("terminate", event),
      onResponderRelease: (event) => record("release", event),
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

for (const { name, outside, stopAtTarget } of [
  {
    name: "the starting move takes the DOM responder from an active child gesture",
  },
  {
    name: "the provider takes the DOM responder when a child stops the starting mousemove",
    stopAtTarget: true,
  },
  {
    name: "a starting move outside the provider takes the DOM responder on that move",
    outside: true,
  },
]) {
  test(name, () => {
    withHeldResponder((provider, holder, holderEvents) => {
      dispatchFrom(holder, pointerMove(1, { x: 102, y: 40 }));
      mouse(holder, "mousemove", 102);
      assert.equal(getResponderNode(), holder);
      assert.equal(provider.dispatchedMoves.length, 0);

      const target = outside ? new FakeElement() : holder;
      const start = new FakeMouseEvent("mousemove", {
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
      });
      dispatchFrom(target, pointerMove(1, { x: 112, y: 40 }));
      dispatchFrom(target, start, stopAtTarget);
      assert.equal(
        getResponderNode(),
        provider,
        "the provider takes the responder at the start",
      );
      assert.deepEqual(holderEvents, [
        "request mousemove at 112",
        "terminate mousemove at 112",
      ]);

      dispatchFrom(target, pointerMove(1, { x: 120, y: 40 }));
      mouse(target, "mousemove", 120);
      mouse(target, "mouseup", 120);
      assert.equal(getResponderNode(), null);
      assert.equal(holderEvents.length, 2);
      assert.equal(provider.dispatchedMoves.length, 1);
      const [copy] = provider.dispatchedMoves;
      assert.ok(copy instanceof FakeMouseEvent);
      assert.equal(copy.type, "mousemove");
      assert.partialDeepStrictEqual(copy.init, start.init);
    });
  });
}
