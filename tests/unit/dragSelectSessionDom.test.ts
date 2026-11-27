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

test("the starting move ends the DOM press and claims the responder until release", () => {
  withFakeDocument(() => {
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
    const provider = asElement(new FakeElement());
    const providerId = 1;
    addNode(providerId, provider, {
      onMoveShouldSetResponderCapture: env.claimResponder,
    });
    attachListeners();
    const mouse = (
      type: "mousedown" | "mousemove" | "mouseup",
      pageX: number,
    ) =>
      document.dispatchEvent(
        Object.assign(new Event(type), {
          altKey: false,
          button: 0,
          buttons: type === "mouseup" ? 0 : 1,
          composedPath: () => [provider],
          ctrlKey: false,
          pageX,
          pageY: 40,
        }),
      );

    try {
      mouse("mousedown", 100);
      document.dispatchEvent(pointerMove(1, { x: 102, y: 40 }));
      mouse("mousemove", 102);
      assert.equal(
        pressOuts.length,
        0,
        "a move below the threshold ends nothing",
      );
      assert.equal(getResponderNode(), null);

      const start = pointerMove(1, { x: 112, y: 40 });
      document.dispatchEvent(start);
      mouse("mousemove", 112);
      assert.equal(getResponderNode(), provider);
      assert.equal(pressOuts.length, 1);
      assert.equal(pressOuts[0].nativeEvent, start);

      mouse("mouseup", 112);
      assert.equal(getResponderNode(), null);
      assert.equal(pressOuts.length, 1);
    } finally {
      session.stop();
      removeNode(providerId);
    }
  });
});
