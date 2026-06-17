import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import {
  closeDropdownMenuEntries,
  dropdownMenuTriggerProps,
  mergeDropdownMenuTriggerProps,
  mergeDropdownSurfaceHoverProps,
  resolveDropdownMenuOpen,
  resolveDropdownMenuTriggerProps,
} from "../../src/dropdown/dropdownMenuModel";

test("dropdown menu open state follows internal state when uncontrolled", () => {
  assert.deepEqual(resolveDropdownMenuOpen(undefined, false), {
    controlled: false,
    open: false,
  });
  assert.deepEqual(resolveDropdownMenuOpen(undefined, true), {
    controlled: false,
    open: true,
  });
});

test("dropdown menu open state follows the controlled prop", () => {
  assert.deepEqual(resolveDropdownMenuOpen(true, false), {
    controlled: true,
    open: true,
  });
  assert.deepEqual(resolveDropdownMenuOpen(false, true), {
    controlled: true,
    open: false,
  });
});

test("dropdown menu trigger props expose expanded state and toggle handler", () => {
  const toggle = () => undefined;
  const closed = dropdownMenuTriggerProps(false, toggle);

  assert.deepEqual(closed, {
    "aria-expanded": false,
    "aria-haspopup": "menu",
    onPress: toggle,
  });
  assert.equal(closed.onPress, toggle);
  assert.equal(dropdownMenuTriggerProps(true, toggle)["aria-expanded"], true);
  assert.equal(closed["aria-haspopup"], "menu");
});

test("resolve trigger props press matches the base press handler", () => {
  const toggle = () => undefined;
  assert.deepEqual(
    resolveDropdownMenuTriggerProps(false, toggle, "press"),
    dropdownMenuTriggerProps(false, toggle),
  );
  const open = resolveDropdownMenuTriggerProps(true, toggle, "press");
  assert.equal(open["aria-expanded"], true);
  assert.equal(open.onPress, toggle);
});

test("resolve trigger props hover wires hover handlers and keeps a press fallback", () => {
  const toggle = () => undefined;
  const onHoverIn = () => undefined;
  const onHoverOut = () => undefined;
  const props = resolveDropdownMenuTriggerProps(false, toggle, "hover", {
    hoverProps: { onHoverIn, onHoverOut },
  });

  assert.equal(props.onPress, toggle);
  assert.equal(props.onHoverIn, onHoverIn);
  assert.equal(props.onHoverOut, onHoverOut);
  assert.equal(props.onLongPress, undefined);
  assert.equal(props.onContextMenu, undefined);

  const bare = resolveDropdownMenuTriggerProps(false, toggle, "hover");
  assert.equal(bare.onPress, toggle);
  assert.equal(bare.onHoverIn, undefined);
  assert.equal(bare.onHoverOut, undefined);
});

test("resolve trigger props longPress wires onLongPress and leaves a tap free", () => {
  const toggle = () => undefined;
  const props = resolveDropdownMenuTriggerProps(false, toggle, "longPress");

  assert.equal(props.onLongPress, toggle);
  assert.equal(props.onPress, undefined);
  assert.equal(props.onHoverIn, undefined);
  assert.equal(props.onContextMenu, undefined);
  assert.equal(props["aria-haspopup"], "menu");
});

test("resolve trigger props contextMenu opens on right-click and suppresses the browser menu on web", () => {
  let toggled = 0;
  const toggle = () => {
    toggled += 1;
  };
  const props = resolveDropdownMenuTriggerProps(false, toggle, "contextMenu", {
    isWeb: true,
  });

  assert.equal(props.onPress, undefined);
  assert.equal(props.onLongPress, undefined);

  let prevented = 0;
  props.onContextMenu?.({
    preventDefault: () => {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
  assert.equal(toggled, 1);
});

test("resolve trigger props contextMenu aliases long-press on native", () => {
  const toggle = () => undefined;
  const props = resolveDropdownMenuTriggerProps(false, toggle, "contextMenu", {
    isWeb: false,
  });

  assert.equal(props.onContextMenu, undefined);
  assert.equal(props.onLongPress, toggle);
  assert.equal(props.onPress, undefined);
});

test("merge trigger props composes injected handlers with the child's own", () => {
  const events: string[] = [];
  const childProps = {
    onHoverIn: () => events.push("child-hover-in"),
    onPress: () => events.push("child-press"),
  };
  const triggerProps = resolveDropdownMenuTriggerProps(
    true,
    () => events.push("toggle"),
    "hover",
    {
      hoverProps: {
        onHoverIn: () => events.push("open-hover-in"),
        onHoverOut: () => events.push("open-hover-out"),
      },
    },
  );

  const merged = mergeDropdownMenuTriggerProps(childProps, triggerProps);
  assert.equal(merged["aria-expanded"], true);
  merged.onPress?.(undefined);
  merged.onHoverIn?.(undefined);
  merged.onHoverOut?.(undefined);

  assert.deepEqual(events, [
    "child-press",
    "toggle",
    "child-hover-in",
    "open-hover-in",
    "open-hover-out",
  ]);
});

test("merge trigger props leaves the child's tap intact for longPress", () => {
  const events: string[] = [];
  const childProps = { onPress: () => events.push("child-press") };
  const triggerProps = resolveDropdownMenuTriggerProps(
    false,
    () => events.push("toggle"),
    "longPress",
  );

  const merged = mergeDropdownMenuTriggerProps(childProps, triggerProps);
  merged.onPress?.(undefined);
  merged.onLongPress?.(undefined);
  assert.deepEqual(events, ["child-press", "toggle"]);
  // longPress leaves the child's own tap handler untouched (no toggle injected).
  assert.equal(merged.onPress, childProps.onPress);
});

test("merge surface hover props fires consumer then internal, or passes through", () => {
  const order: string[] = [];
  const consumer = {
    onHoverIn: () => order.push("c-in"),
    onHoverOut: () => order.push("c-out"),
  };
  const internal = {
    onHoverIn: () => order.push("i-in"),
    onHoverOut: () => order.push("i-out"),
  };

  const merged = mergeDropdownSurfaceHoverProps(consumer, internal);
  merged?.onHoverIn();
  merged?.onHoverOut();
  assert.deepEqual(order, ["c-in", "i-in", "c-out", "i-out"]);

  assert.equal(mergeDropdownSurfaceHoverProps(undefined, internal), internal);
  assert.equal(mergeDropdownSurfaceHoverProps(consumer, undefined), consumer);
  assert.equal(mergeDropdownSurfaceHoverProps(undefined, undefined), undefined);
});

test("dropdown menu entries close after selectable row presses", () => {
  const events: string[] = [];
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      onPress: () => events.push("settings"),
      type: "item",
    },
    { id: "divider", label: "divider", type: "divider" },
    {
      id: "create",
      label: "Create",
      onPress: () => events.push("create"),
      type: "footer",
    },
  ];

  const wrapped = closeDropdownMenuEntries(
    entries,
    () => events.push("close"),
    true,
  );
  const first = wrapped[0];
  const divider = wrapped[1];
  const footer = wrapped[2];

  assert.notEqual(first, entries[0]);
  assert.equal(divider, entries[1]);
  assert.notEqual(footer, entries[2]);
  if ("onPress" in first) first.onPress?.();
  if ("onPress" in footer) footer.onPress?.();
  assert.deepEqual(events, ["settings", "close", "create", "close"]);
});

test("dropdown menu entry wrapping preserves disabled rows and opt-out arrays", () => {
  const entries: DropdownListEntry[] = [
    {
      disabled: true,
      id: "disabled",
      label: "Disabled",
      onPress: () => undefined,
      type: "item",
    },
  ];

  assert.equal(
    closeDropdownMenuEntries(entries, () => undefined, false),
    entries,
  );
  assert.equal(
    closeDropdownMenuEntries(entries, () => undefined, true)[0],
    entries[0],
  );
});

test("dropdown menu composes the shared portal and list primitives", () => {
  const source = readSource("../../src/dropdown/DropdownMenu.tsx");
  const entrypoint = readSource("../../src/dropdown/index.ts");

  assert.match(source, /resolveDropdownMenuOpen/);
  assert.match(source, /closeDropdownMenuEntries/);
  assert.match(source, /children: DropdownMenuTrigger/);
  assert.match(source, /cloneElement/);
  assert.match(source, /<DropdownPortal/);
  assert.match(source, /<DropdownList/);
  assert.match(
    source,
    /dropdownMenuTriggerNode\(children, menuState, triggerProps\)/,
  );
  assert.match(entrypoint, /DropdownMenu/);
  assert.match(entrypoint, /dropdownMenuModel/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
