import assert from "node:assert/strict";
import test from "node:test";

import {
  buttonSemantics,
  buttonSemanticsWarnings,
  buttonSpaceKeyProps,
  type ButtonKeyEvent,
  type ButtonRole,
  type ButtonSemanticsInput,
} from "../../src/button/buttonSemantics";

function input(
  overrides: Partial<ButtonSemanticsInput> = {},
): ButtonSemanticsInput {
  return {
    busy: false,
    disabled: false,
    role: "button",
    web: true,
    ...overrides,
  };
}

test("a plain button announces button semantics with only its own state", () => {
  const { accessibilityRole, accessibilityState, ariaProps } =
    buttonSemantics(input());

  assert.equal(accessibilityRole, "button");
  assert.equal(accessibilityState.busy, false);
  assert.equal(accessibilityState.disabled, false);
  // Nothing invents a role state the caller did not ask for.
  assert.equal(accessibilityState.checked, undefined);
  assert.equal(accessibilityState.expanded, undefined);
  assert.equal(accessibilityState.selected, undefined);
  assert.equal(ariaProps["aria-checked"], undefined);
  assert.equal(ariaProps["aria-pressed"], undefined);
  assert.equal(ariaProps["aria-selected"], undefined);
  // `aria-busy` is emitted only while busy, so a resting button carries no
  // stale attribute.
  assert.equal(ariaProps["aria-busy"], undefined);
});

test("the caller's role is what the button announces", () => {
  const roles: ButtonRole[] = [
    "button",
    "checkbox",
    "menuitem",
    "radio",
    "switch",
    "tab",
  ];
  for (const role of roles) {
    assert.equal(buttonSemantics(input({ role })).accessibilityRole, role);
  }
});

test("role state reaches the DOM through the aria mirror on web", () => {
  // react-native-web honours `accessibilityState` only on
  // `TouchableWithoutFeedback`, so on a Pressable the literal `aria-*` props are
  // the only channel that survives to the DOM.
  const checkbox = buttonSemantics(
    input({ checked: true, expanded: false, role: "checkbox" }),
  );
  assert.equal(checkbox.ariaProps["aria-checked"], true);
  assert.equal(checkbox.ariaProps["aria-expanded"], false);
  assert.equal(checkbox.accessibilityState.checked, true);

  const tab = buttonSemantics(input({ role: "tab", selected: true }));
  assert.equal(tab.ariaProps["aria-selected"], true);
  assert.equal(tab.accessibilityState.selected, true);

  const busy = buttonSemantics(input({ busy: true }));
  assert.equal(busy.ariaProps["aria-busy"], true);
  assert.equal(busy.accessibilityState.busy, true);

  // A tri-state checkbox keeps ARIA's "mixed" value verbatim.
  const mixed = buttonSemantics(input({ checked: "mixed", role: "checkbox" }));
  assert.equal(mixed.ariaProps["aria-checked"], "mixed");
  assert.equal(mixed.accessibilityState.checked, "mixed");
});

test("native carries state on accessibilityState alone", () => {
  const { accessibilityState, ariaProps } = buttonSemantics(
    input({ checked: true, role: "checkbox", web: false }),
  );

  assert.equal(accessibilityState.checked, true);
  // No `aria-*` is emitted off web: React Native reads `accessibilityState`.
  assert.deepEqual(ariaProps, {});
});

test("a toggle button's pressed state maps per platform", () => {
  // `aria-pressed` is the only toggle state ARIA allows on `role="button"`;
  // `aria-selected` there would be invalid, so web must not fall back to it.
  const web = buttonSemantics(input({ pressed: true }));
  assert.equal(web.ariaProps["aria-pressed"], true);
  assert.equal(web.accessibilityState.selected, undefined);

  // React Native models no "pressed" toggle, so native degrades to `selected`,
  // which VoiceOver / TalkBack announce.
  const native = buttonSemantics(input({ pressed: true, web: false }));
  assert.equal(native.accessibilityState.selected, true);

  // An explicit `selected` still wins over the degraded `pressed`.
  const both = buttonSemantics(
    input({ pressed: true, role: "tab", selected: false, web: false }),
  );
  assert.equal(both.accessibilityState.selected, false);
});

test("sound role/state pairings raise no warnings", () => {
  assert.deepEqual(buttonSemanticsWarnings(input()), []);
  assert.deepEqual(
    buttonSemanticsWarnings(input({ checked: false, role: "checkbox" })),
    [],
  );
  assert.deepEqual(
    buttonSemanticsWarnings(input({ checked: true, role: "radio" })),
    [],
  );
  assert.deepEqual(
    buttonSemanticsWarnings(input({ checked: true, role: "switch" })),
    [],
  );
  assert.deepEqual(
    buttonSemanticsWarnings(input({ role: "tab", selected: true })),
    [],
  );
  assert.deepEqual(buttonSemanticsWarnings(input({ pressed: true })), []);
  assert.deepEqual(
    buttonSemanticsWarnings(input({ expanded: true, role: "menuitem" })),
    [],
  );
});

test("state ARIA does not allow on the role is reported", () => {
  // `checked` belongs to checkbox / radio / switch.
  assert.match(
    buttonSemanticsWarnings(input({ checked: true }))[0] ?? "",
    /`checked` is only announced by a "checkbox", "radio", or "switch" role/,
  );
  // `selected` belongs to a tab.
  assert.match(
    buttonSemanticsWarnings(input({ role: "menuitem", selected: true }))[0] ??
      "",
    /`selected` is only announced by a "tab" role/,
  );
  // `pressed` (aria-pressed) belongs to a button.
  assert.match(
    buttonSemanticsWarnings(
      input({ pressed: true, role: "tab", selected: true }),
    )[0] ?? "",
    /`pressed` is only announced by a "button" role/,
  );
  // `aria-expanded` is not allowed on a radio or a switch.
  assert.match(
    buttonSemanticsWarnings(
      input({ checked: true, expanded: true, role: "radio" }),
    )[0] ?? "",
    /`expanded` is not allowed on a "radio" role/,
  );
});

test("a role left without the state it requires is reported", () => {
  // Without `aria-checked` a checkbox / radio / switch is indistinguishable
  // from a plain button, and axe flags it as a missing required attribute.
  for (const role of ["checkbox", "radio", "switch"] as const) {
    assert.match(
      buttonSemanticsWarnings(input({ role }))[0] ?? "",
      new RegExp(`a "${role}" must report a \`checked\` state`),
    );
  }
  assert.match(
    buttonSemanticsWarnings(input({ role: "tab" }))[0] ?? "",
    /a "tab" must report a `selected` state/,
  );
});

test("every mismatch in one pairing is reported, not just the first", () => {
  const warnings = buttonSemanticsWarnings(
    input({ checked: true, pressed: true, role: "tab" }),
  );

  assert.equal(warnings.length, 3);
  assert.ok(warnings.some((warning) => warning.includes("`checked` is only")));
  assert.ok(warnings.some((warning) => warning.includes("`pressed` is only")));
  assert.ok(warnings.some((warning) => warning.includes("must report a")));
});

test("Spacebar is bound only where react-native-web leaves it unbound", () => {
  const activate = () => undefined;

  // react-native-web's press responder already binds Space on `button`.
  assert.equal(
    buttonSpaceKeyProps({ activate, enabled: true, role: "button", web: true }),
    null,
  );
  // Native has its own activation gestures; the web keydown shim is web-only.
  assert.equal(
    buttonSpaceKeyProps({ activate, enabled: true, role: "tab", web: false }),
    null,
  );
  for (const role of [
    "checkbox",
    "menuitem",
    "radio",
    "switch",
    "tab",
  ] as const) {
    assert.notEqual(
      buttonSpaceKeyProps({ activate, enabled: true, role, web: true }),
      null,
    );
  }
});

test("Space activates a re-roled button and never scrolls the page", () => {
  let activated = 0;
  const keyProps = buttonSpaceKeyProps({
    activate: () => {
      activated += 1;
    },
    enabled: true,
    role: "checkbox",
    web: true,
  });
  assert.ok(keyProps);

  const event = keyEvent(" ");
  keyProps.onKeyDown(event.event);
  assert.equal(activated, 1);
  // The default (scrolling the page) is suppressed, and the key does not bubble
  // on to an ancestor handler.
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);

  // Legacy browsers report the spacebar as "Spacebar".
  keyProps.onKeyDown(keyEvent("Spacebar").event);
  assert.equal(activated, 2);

  // Enter is left to the press responder, which presses on every role — binding
  // it here too would activate twice.
  const enter = keyEvent("Enter");
  keyProps.onKeyDown(enter.event);
  assert.equal(activated, 2);
  assert.equal(enter.prevented, 0);
});

test("Space reads the key off the native event when react-native-web nests it", () => {
  let activated = 0;
  const keyProps = buttonSpaceKeyProps({
    activate: () => {
      activated += 1;
    },
    enabled: true,
    role: "radio",
    web: true,
  });
  assert.ok(keyProps);

  keyProps.onKeyDown({ nativeEvent: { key: " " } });
  assert.equal(activated, 1);
});

test("a disabled or busy button swallows Space without activating", () => {
  let activated = 0;
  const keyProps = buttonSpaceKeyProps({
    activate: () => {
      activated += 1;
    },
    enabled: false,
    role: "switch",
    web: true,
  });
  assert.ok(keyProps);

  const event = keyEvent(" ");
  keyProps.onKeyDown(event.event);

  assert.equal(activated, 0);
  // Still swallowed: a blocked control must not scroll the page instead.
  assert.equal(event.prevented, 1);
});

function keyEvent(key: string) {
  const state = { prevented: 0, stopped: 0, event: {} as ButtonKeyEvent };
  state.event = {
    key,
    preventDefault: () => {
      state.prevented += 1;
    },
    stopPropagation: () => {
      state.stopped += 1;
    },
  };
  return state;
}

test("a trigger announces the overlay it opens, on web only", () => {
  const menu = buttonSemantics(input({ expanded: false, hasPopup: "menu" }));
  assert.equal(menu.ariaProps["aria-haspopup"], "menu");
  // Paired with the disclosure state, so a reader hears both what opens and
  // whether it is open.
  assert.equal(menu.ariaProps["aria-expanded"], false);

  // `true` is ARIA's synonym for a menu, and the named surfaces pass through.
  assert.equal(
    buttonSemantics(input({ hasPopup: true })).ariaProps["aria-haspopup"],
    true,
  );
  assert.equal(
    buttonSemantics(input({ hasPopup: "dialog" })).ariaProps["aria-haspopup"],
    "dialog",
  );

  // There is no React Native equivalent, so native emits nothing rather than
  // inventing a state the platform cannot announce.
  const native = buttonSemantics(input({ hasPopup: "menu", web: false }));
  assert.deepEqual(native.ariaProps, {});
  assert.equal("hasPopup" in native.accessibilityState, false);

  // Absent by default: an ordinary button must not claim to open anything.
  assert.equal(buttonSemantics(input()).ariaProps["aria-haspopup"], undefined);
});

test("hasPopup is refused on the roles ARIA does not support it on", () => {
  // A checkbox / radio / switch is a value control, not a trigger.
  for (const role of ["checkbox", "radio", "switch"] as ButtonRole[]) {
    const warnings = buttonSemanticsWarnings(
      input({ checked: false, hasPopup: "menu", role }),
    );
    assert.equal(
      warnings.some((warning) => warning.includes("`hasPopup` is not allowed")),
      true,
      role,
    );
  }
  // Button, menuitem, and tab are the roles ARIA does support it on.
  assert.deepEqual(buttonSemanticsWarnings(input({ hasPopup: "menu" })), []);
  assert.deepEqual(
    buttonSemanticsWarnings(input({ hasPopup: "menu", role: "menuitem" })),
    [],
  );
  assert.deepEqual(
    buttonSemanticsWarnings(
      input({ hasPopup: "listbox", role: "tab", selected: true }),
    ),
    [],
  );
});
