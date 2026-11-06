import assert from "node:assert/strict";
import test from "node:test";

import { startDragSelectableSession } from "../../src/drag-select/dragSelectableSession";
import { dragSelectableSessionDom } from "../../src/drag-select/dragSelectableSessionDom";
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

test("a drag that starts on a pressed control ends the press with the move that started it", () => {
  withFakeDocument(() => {
    const pressOuts: GestureResponderEvent[] = [];
    pressHandlers({
      delayPressIn: 0,
      onPressChange: () => undefined,
      onPressEnd: (event) => pressOuts.push(event),
    }).onPointerDown(pointerDown(1, { x: 100, y: 40 }));
    const session = startDragSelectableSession(
      {
        autoScroll: false,
        mode: "replace",
        pointerId: 1,
        press: { x: 100, y: 40 },
        preventTextSelection: false,
        threshold: 4,
      },
      dragSelectableSessionDom({
        commit: () => undefined,
        container: { element: asElement(new FakeRootElement()), root: true },
        end: () => undefined,
        render: () => undefined,
        targets: () => [],
      }),
    );

    document.dispatchEvent(pointerMove(1, { x: 102, y: 40 }));
    assert.equal(
      pressOuts.length,
      0,
      "a move below the threshold ends nothing",
    );
    const start = pointerMove(1, { x: 112, y: 40 });
    document.dispatchEvent(start);
    session.stop();

    assert.equal(pressOuts.length, 1);
    assert.equal(pressOuts[0].nativeEvent, start);
  });
});
