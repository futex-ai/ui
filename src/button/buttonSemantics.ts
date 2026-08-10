/**
 * The accessibility semantics of the shared {@link Button}: the role it
 * announces, the state that role must carry, and the web-only `aria-*` mirror
 * of that state.
 *
 * Kept pure — no React, no `Platform` — so the role/state contract is unit
 * tested directly rather than through a rendered tree; the component passes
 * `web` in.
 *
 * Two channels, because the renderers disagree. React Native reads
 * `accessibilityState`. React Native Web honours it only on
 * `TouchableWithoutFeedback` — `View` / `Pressable` drop it entirely — so on web
 * the literal `aria-*` props are the only thing that reaches the DOM. Emitting
 * both keeps one contract across both renderers, and matches the pairing
 * `SegmentedControl` already uses for its radios.
 */
import type { AccessibilityState } from "react-native";

/**
 * The roles a `Button` may announce. Every member is a single-activation
 * control — one Enter or Space press is the whole interaction — so the button's
 * press handling, focus glow, and disabled treatment stay correct under all of
 * them.
 *
 * `link` is deliberately absent. A re-roled button has no `href`, so it cannot
 * be opened in a new tab, middle-clicked, copied as a URL, or reported to the
 * browser as a navigation target; a real link should be an anchor instead.
 */
export type ButtonRole =
  | "button"
  | "checkbox"
  | "menuitem"
  | "radio"
  | "switch"
  | "tab";

/**
 * The state a role carries, beyond the `busy` / `disabled` state the button
 * owns itself. Each field belongs to a specific set of roles (ARIA rejects the
 * rest); {@link buttonSemanticsWarnings} reports a mismatch in development.
 */
export type ButtonRoleState = {
  /** Checked state of a `checkbox`, `radio`, or `switch`. */
  checked?: boolean | "mixed";
  /** Disclosure state of a control that reveals a menu, panel, or section. */
  expanded?: boolean;
  /** Pressed state of a toggle `button`. */
  pressed?: boolean;
  /** Selected state of a `tab`. */
  selected?: boolean;
};

export type ButtonSemanticsInput = ButtonRoleState & {
  /** The button is performing an in-progress action. */
  busy: boolean;
  /** The resolved disabled state (an explicit `disabled`, or no `onPress`). */
  disabled: boolean;
  /** The announced role. */
  role: ButtonRole;
  /** True when rendering through React Native Web. */
  web: boolean;
};

/** The literal ARIA attributes emitted on web. */
export type ButtonAriaProps = {
  "aria-busy"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-expanded"?: boolean;
  "aria-pressed"?: boolean;
  "aria-selected"?: boolean;
};

export type ButtonSemantics = {
  accessibilityRole: ButtonRole;
  accessibilityState: AccessibilityState;
  ariaProps: ButtonAriaProps;
};

/** Roles whose ARIA contract requires a `checked` state. */
const CHECKED_ROLES: ReadonlySet<ButtonRole> = new Set<ButtonRole>([
  "checkbox",
  "radio",
  "switch",
]);

/** The {@link ButtonRole}s ARIA allows `aria-expanded` on. */
const EXPANDED_ROLES: ReadonlySet<ButtonRole> = new Set<ButtonRole>([
  "button",
  "checkbox",
  "menuitem",
  "tab",
]);

/**
 * Resolves the role and state a `Button` announces.
 *
 * `pressed` is the one state without a React Native equivalent: RN models no
 * "pressed" toggle, and `aria-pressed` is web-only. On web it stays
 * `aria-pressed` (the only toggle state ARIA allows on `role="button"` —
 * `aria-selected` there would be invalid); on native it degrades to
 * `accessibilityState.selected`, which VoiceOver and TalkBack announce as
 * "selected". Either way the toggle state is announced (WCAG 2.1 — 4.1.2 Name,
 * Role, Value, A).
 */
export function buttonSemantics({
  busy,
  checked,
  disabled,
  expanded,
  pressed,
  role,
  selected,
  web,
}: ButtonSemanticsInput): ButtonSemantics {
  return {
    accessibilityRole: role,
    accessibilityState: {
      busy,
      checked,
      disabled,
      expanded,
      selected: selected ?? (web ? undefined : pressed),
    },
    ariaProps: web
      ? {
          "aria-busy": busy || undefined,
          "aria-checked": checked,
          "aria-expanded": expanded,
          "aria-pressed": pressed,
          "aria-selected": selected,
        }
      : {},
  };
}

/** A keydown event as react-native-web hands it to a `Pressable` on web. */
export type ButtonKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type ButtonKeyProps = { onKeyDown: (event: ButtonKeyEvent) => void };

export type ButtonSpaceKeyOptions = {
  /** Fires the button's press handler. */
  activate: () => void;
  /** False while the button is disabled or busy — Space is then swallowed only. */
  enabled: boolean;
  /** The announced role. */
  role: ButtonRole;
  /** True when rendering through React Native Web. */
  web: boolean;
};

/**
 * Whether the library must bind Spacebar itself for this role.
 *
 * React Native Web's press responder activates Enter on every role but binds
 * Spacebar to `button` roles only. On any other role Space is therefore neither
 * an activation nor swallowed — it scrolls the page, leaving the control
 * unusable from the keyboard (WCAG 2.1 — 2.1.1 Keyboard, A).
 */
function needsSpaceActivation(role: ButtonRole): boolean {
  return role !== "button";
}

/**
 * The web keydown wiring that closes that gap, or null when the platform and
 * role need none. Enter is deliberately left to the press responder — it
 * presses on every role, so claiming it here too would fire `onPress` twice.
 * `SegmentedControl` patches the identical gap on its radios.
 *
 * Space is swallowed even while the button is disabled or busy, so a blocked
 * control never scrolls the page instead of doing nothing.
 */
export function buttonSpaceKeyProps({
  activate,
  enabled,
  role,
  web,
}: ButtonSpaceKeyOptions): ButtonKeyProps | null {
  if (!web || !needsSpaceActivation(role)) {
    return null;
  }
  return {
    onKeyDown: (event: ButtonKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (key !== " " && key !== "Spacebar") {
        return;
      }
      event.preventDefault?.(); // and do not scroll the page
      event.stopPropagation?.();
      if (enabled) {
        activate();
      }
    },
  };
}

/**
 * Development-only complaints about a role/state pairing ARIA does not allow,
 * or a role left without the state it requires. Returns one message per problem
 * and an empty array when the pairing is sound.
 */
export function buttonSemanticsWarnings({
  checked,
  expanded,
  pressed,
  role,
  selected,
}: ButtonSemanticsInput): string[] {
  const warnings: string[] = [];
  const requiresChecked = CHECKED_ROLES.has(role);

  if (checked !== undefined && !requiresChecked) {
    warnings.push(
      `Button: \`checked\` is only announced by a "checkbox", "radio", or ` +
        `"switch" role, not by a "${role}". Use \`selected\` for a tab or ` +
        "`pressed` for a toggle button.",
    );
  }
  if (checked === undefined && requiresChecked) {
    warnings.push(
      `Button: a "${role}" must report a \`checked\` state — without it ` +
        "assistive technology cannot tell the control apart from a plain " +
        "button (WCAG 2.1 — 4.1.2 Name, Role, Value, A).",
    );
  }
  if (selected !== undefined && role !== "tab") {
    warnings.push(
      `Button: \`selected\` is only announced by a "tab" role, not by a ` +
        `"${role}". Use \`checked\` for a checkbox / radio / switch or ` +
        "`pressed` for a toggle button.",
    );
  }
  if (selected === undefined && role === "tab") {
    warnings.push(
      'Button: a "tab" must report a `selected` state, or nothing tells ' +
        "assistive technology which tab is the open one (WCAG 2.1 — 4.1.2 " +
        "Name, Role, Value, A).",
    );
  }
  if (pressed !== undefined && role !== "button") {
    warnings.push(
      `Button: \`pressed\` is only announced by a "button" role, not by a ` +
        `"${role}". Use \`checked\` for a checkbox / radio / switch or ` +
        "`selected` for a tab.",
    );
  }
  if (expanded !== undefined && !EXPANDED_ROLES.has(role)) {
    warnings.push(
      `Button: \`expanded\` is not allowed on a "${role}" role; ARIA accepts ` +
        "it on a button, checkbox, menuitem, or tab.",
    );
  }
  return warnings;
}
