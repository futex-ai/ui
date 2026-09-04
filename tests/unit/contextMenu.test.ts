/**
 * The context menu's gesture plumbing. `contextMenuModel.ts` is deliberately
 * free of JSX and of any `react-native` runtime import so it can be exercised
 * here directly rather than only through the browser suite.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contextMenuPoint,
  contextMenuTriggerProps,
} from "../../src/popover/contextMenuModel";

test("the point is read from top-level client coordinates", () => {
  assert.deepEqual(contextMenuPoint({ clientX: 120, clientY: 40 }), {
    x: 120,
    y: 40,
  });
});

test("the point falls back to nativeEvent client coordinates", () => {
  // react-native-web does not always lift the DOM fields to the top level.
  assert.deepEqual(
    contextMenuPoint({ nativeEvent: { clientX: 7, clientY: 9 } }),
    { x: 7, y: 9 },
  );
});

test("the point falls back to nativeEvent page coordinates", () => {
  // The shape a native long-press reports.
  assert.deepEqual(contextMenuPoint({ nativeEvent: { pageX: 3, pageY: 4 } }), {
    x: 3,
    y: 4,
  });
});

test("top-level coordinates win over nativeEvent", () => {
  assert.deepEqual(
    contextMenuPoint({
      clientX: 1,
      clientY: 2,
      nativeEvent: { clientX: 30, clientY: 40 },
    }),
    { x: 1, y: 2 },
  );
});

test("a coordinate-less event yields no point", () => {
  assert.equal(contextMenuPoint({}), null);
  assert.equal(contextMenuPoint({ nativeEvent: {} }), null);
  assert.equal(contextMenuPoint({ clientX: 5 }), null);
  assert.equal(contextMenuPoint(undefined), null);
});

test("web triggers on contextmenu, suppressing the browser menu", () => {
  const seen: (unknown | null)[] = [];
  const props = contextMenuTriggerProps({
    isWeb: true,
    onOpen: (point) => seen.push(point),
  });
  assert.equal(typeof props.onContextMenu, "function");
  assert.equal(props.onLongPress, undefined);
  // A plain tap is never hijacked — the host keeps its own press behaviour.
  assert.equal(props.onPress, undefined);

  let prevented = false;
  (props.onContextMenu as (event: unknown) => void)({
    clientX: 11,
    clientY: 22,
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.deepEqual(seen, [{ x: 11, y: 22 }]);
});

test("native triggers on long press", () => {
  const seen: (unknown | null)[] = [];
  const props = contextMenuTriggerProps({
    isWeb: false,
    onOpen: (point) => seen.push(point),
  });
  assert.equal(typeof props.onLongPress, "function");
  assert.equal(props.onContextMenu, undefined);
  assert.equal(props.onPress, undefined);

  (props.onLongPress as (event: unknown) => void)({
    nativeEvent: { pageX: 60, pageY: 70 },
  });
  assert.deepEqual(seen, [{ x: 60, y: 70 }]);
});

test("a web trigger tolerates an event with no preventDefault", () => {
  const props = contextMenuTriggerProps({ isWeb: true, onOpen: () => {} });
  assert.doesNotThrow(() =>
    (props.onContextMenu as (event: unknown) => void)({
      clientX: 0,
      clientY: 0,
    }),
  );
});
