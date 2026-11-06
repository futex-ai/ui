/**
 * Fakes for the tests of a press that a pointer takeover ends: a document and
 * a window that are plain `EventTarget`s, so the document listeners of a
 * press and of a drag-select session run in Node, a probe that renders
 * `usePress` once to get its handlers, and the pointer events of a gesture.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { PressEvent } from "../../src/primitives/dom/pressMachine";
import {
  usePress,
  type PressConfig,
  type PressHandlers,
} from "../../src/primitives/dom/usePress";

/** A point in viewport coordinates, which are page coordinates here. */
export type FakePoint = { x: number; y: number };

const fakeGlobals = ["document", "window"] as const;

/**
 * Runs `run` while `document` and `window` are new, empty event targets. The
 * previous globals come back afterwards, also when `run` throws.
 */
export function withFakeDocument(run: () => void): void {
  const previous = fakeGlobals.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  for (const name of fakeGlobals) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: new EventTarget(),
      writable: true,
    });
  }
  try {
    run();
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
}

/** The handlers that `usePress` returns for `config`. */
export function pressHandlers(config: PressConfig): PressHandlers {
  const rendered: { handlers: PressHandlers | null } = { handlers: null };
  function Probe() {
    rendered.handlers = usePress(config);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  if (!rendered.handlers) {
    throw new Error("the press probe did not render");
  }
  return rendered.handlers;
}

/** The `pointerdown` of a primary mouse button, as `onPointerDown` gets it. */
export function pointerDown(pointerId: number, point: FakePoint): PressEvent {
  return {
    currentTarget: null,
    nativeEvent: {
      altKey: false,
      button: 0,
      buttons: 1,
      ctrlKey: false,
      pageX: point.x,
      pageY: point.y,
      pointerId,
      pointerType: "mouse",
    },
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
    target: null,
  };
}

/** A DOM `pointermove` of `pointerId` at `point`. */
export function pointerMove(pointerId: number, point: FakePoint) {
  return Object.assign(new Event("pointermove"), {
    clientX: point.x,
    clientY: point.y,
    pageX: point.x,
    pageY: point.y,
    pointerId,
  });
}
