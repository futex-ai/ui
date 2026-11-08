/**
 * Stateful examples for the Button stories: roles, busy, presses, and menus.
 */
import { Check, Mic, MoreHorizontal, X } from "../primitives/icons";
import { useState } from "react";
import { Text, View } from "../primitives/reactNative";

import { Button } from "../index";
import { noop, styles } from "./buttonStoryParts";
import { StorySurface } from "./sharedExamples";

const SECTIONS = ["General", "Apps", "Secrets"];
const ACCENTS = ["Sage", "Slate", "Clay"];

/**
 * `role` re-points the button at another single-activation role, paired with
 * the state that role must carry. Every one keeps the tones, sizes, focus glow,
 * and disabled/busy handling, so a rail row, tab, checkbox, radio, switch, or
 * menu item no longer has to be a hand-rolled `Pressable`.
 *
 * The `tablist` / `radiogroup` / `menu` containers are the caller's: `Button` is
 * a single control and does not own group navigation.
 */
export function RolesAndStatesExample() {
  const [section, setSection] = useState(SECTIONS[0]);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [notify, setNotify] = useState(false);
  const [compact, setCompact] = useState(true);
  const [pinned, setPinned] = useState(false);
  return (
    <View style={styles.stack}>
      {/* role="tab" + `selected` — the settings-rail pattern. */}
      <View
        accessibilityLabel="Settings sections"
        accessibilityRole="tablist"
        style={styles.row}
      >
        {SECTIONS.map((label) => (
          <Button
            key={label}
            onPress={() => setSection(label)}
            role="tab"
            selected={section === label}
            tone={section === label ? "primary" : "plain"}
          >
            {label}
          </Button>
        ))}
      </View>

      {/* role="checkbox" + `checked`. */}
      <Button
        checked={notify}
        onPress={() => setNotify(!notify)}
        role="checkbox"
        tone={notify ? "primary" : "secondary"}
      >
        Email notifications
      </Button>

      {/* role="switch" + `checked`. */}
      <Button
        checked={compact}
        onPress={() => setCompact(!compact)}
        role="switch"
        tone={compact ? "primary" : "secondary"}
      >
        Compact rows
      </Button>

      {/* role="radio" + `checked`, inside the caller's radiogroup. */}
      <View
        accessibilityLabel="Accent"
        accessibilityRole="radiogroup"
        style={styles.row}
      >
        {ACCENTS.map((label) => (
          <Button
            checked={accent === label}
            key={label}
            onPress={() => setAccent(label)}
            role="radio"
            tone={accent === label ? "primary" : "secondary"}
          >
            {label}
          </Button>
        ))}
      </View>

      {/* role="button" + `pressed` — a toggle button. `aria-pressed` is the only
          toggle state ARIA allows on a button, so `selected` would be invalid
          here; on native it degrades to the announced "selected" state. */}
      <Button
        onPress={() => setPinned(!pinned)}
        pressed={pinned}
        tone={pinned ? "primary" : "secondary"}
      >
        {pinned ? "Pinned" : "Pin"}
      </Button>

      {/* role="menuitem", inside the caller's menu. */}
      <View
        accessibilityLabel="Row actions"
        accessibilityRole="menu"
        style={styles.row}
      >
        <Button onPress={noop} role="menuitem" tone="plain">
          Duplicate
        </Button>
        <Button onPress={noop} role="menuitem" tone="plain">
          Archive
        </Button>
      </View>
    </View>
  );
}

export function InteractiveExample() {
  const [saved, setSaved] = useState(false);
  return (
    <View style={styles.stack}>
      <Button
        icon={saved ? Check : undefined}
        onPress={() => setSaved(true)}
        tone="primary"
      >
        {saved ? "Saved" : "Save"}
      </Button>
      <Button disabled onPress={() => setSaved(true)}>
        Unavailable
      </Button>
    </View>
  );
}

export function BusyExample() {
  const [busy, setBusy] = useState(false);
  return (
    <StorySurface>
      <View style={styles.stack}>
        {/* While busy the button keeps its label and focus, announces
            `aria-busy`, swaps the leading icon for a spinner, and ignores
            presses (WCAG 2.1 — 4.1.2 Name, Role, Value). */}
        <Button
          busy={busy}
          icon={Check}
          onPress={() => setBusy(true)}
          tone="primary"
        >
          {busy ? "Saving" : "Save"}
        </Button>
        <Button busy onPress={noop}>
          Loading
        </Button>
      </View>
    </StorySurface>
  );
}

export function PressLifecycleExample() {
  const [state, setState] = useState("idle");
  return (
    <StorySurface>
      <View style={styles.stack}>
        {/* Push-to-talk needs the press to start and end, not just fire. The
            whole lifecycle is gated by `busy` together, so a control cannot
            start on press-in and then never be released. */}
        <Button
          delayLongPress={400}
          icon={Mic}
          onLongPress={() => setState("held")}
          onPress={noop}
          onPressIn={() => setState("recording")}
          onPressOut={() => setState("idle")}
          tone="primary"
        >
          Hold to talk
        </Button>
        <Text style={styles.inlineText}>{state}</Text>
      </View>
    </StorySurface>
  );
}

export function TapTargetExample() {
  const [presses, setPresses] = useState(0);
  return (
    <StorySurface>
      <View style={styles.row}>
        {/* `boxSize` sets the visible 1:1 box outright — including below the
            smallest size's 26px track — while `hitSlop` keeps the tap area
            comfortable without the control growing with it. */}
        <Button
          accessibilityLabel="Remove tag"
          boxSize={16}
          hitSlop={14}
          icon={X}
          onPress={() => setPresses((count) => count + 1)}
          shape="circle"
          tone="plain"
        />
        <Text style={styles.inlineText}>{`presses: ${presses}`}</Text>
      </View>
    </StorySurface>
  );
}

export function MenuTriggerExample() {
  const [open, setOpen] = useState(false);
  return (
    <StorySurface>
      <View style={styles.stack}>
        {/* `hasPopup` tells a screen reader what Enter will open before the
            user commits; `expanded` says whether it is open yet. */}
        <Button
          expanded={open}
          hasPopup="menu"
          icon={MoreHorizontal}
          onPress={() => setOpen((wasOpen) => !wasOpen)}
        >
          Actions
        </Button>
        {open ? <Text style={styles.inlineText}>Menu open</Text> : null}
      </View>
    </StorySurface>
  );
}
