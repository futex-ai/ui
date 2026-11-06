import assert from "node:assert/strict";
import test from "node:test";

import { endPointerPresses } from "../../src/primitives/dom/usePress";
import type { GestureResponderEvent } from "../../src/primitives/types";

import {
  pointerDown,
  pointerMove,
  pressHandlers,
  withFakeDocument,
} from "./domPressFakes";

/**
 * A gesture that takes over a pointer, such as a drag-select drag, ends the
 * presses of that pointer with the pointer event that took it over. A normal
 * release gives `onPressOut` its own DOM event, and so does a takeover.
 */

/** A press that activates on its `pointerdown` and records what it gets. */
function recordedPress() {
  const pressed: boolean[] = [];
  const pressOuts: GestureResponderEvent[] = [];
  const handlers = pressHandlers({
    delayPressIn: 0,
    onPressChange: (value) => pressed.push(value),
    onPressEnd: (event) => pressOuts.push(event),
  });
  return { handlers, pressed, pressOuts };
}

test("a takeover ends the presses of its pointer with the takeover event", () => {
  withFakeDocument(() => {
    const taken = recordedPress();
    const other = recordedPress();
    taken.handlers.onPointerDown(pointerDown(1, { x: 100, y: 40 }));
    other.handlers.onPointerDown(pointerDown(2, { x: 300, y: 40 }));

    const takeover = pointerMove(1, { x: 112, y: 46 });
    endPointerPresses(takeover);

    assert.deepEqual(taken.pressed, [true, false]);
    assert.equal(taken.pressOuts.length, 1);
    assert.equal(taken.pressOuts[0].nativeEvent, takeover);
    assert.deepEqual(
      {
        pageX: taken.pressOuts[0].nativeEvent.pageX,
        pageY: taken.pressOuts[0].nativeEvent.pageY,
      },
      { pageX: 112, pageY: 46 },
    );
    assert.deepEqual(other.pressed, [true]);
    assert.deepEqual(other.pressOuts, []);

    endPointerPresses(pointerMove(2, { x: 300, y: 60 }));
  });
});
