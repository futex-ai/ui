import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bell,
  Check,
  ChevronDown,
  Download,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, darkSharedUiTheme } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Button/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => undefined;

const row = (node: React.ReactNode) => (
  <StorySurface>
    <View style={styles.row}>{node}</View>
  </StorySurface>
);

export const Tones: Story = {
  name: "Tones",
  render: () =>
    row(
      <>
        <Button onPress={noop} tone="primary">
          Primary
        </Button>
        <Button onPress={noop}>Secondary</Button>
        <Button onPress={noop} tone="ghost">
          Ghost
        </Button>
        <Button onPress={noop} tone="plain">
          Plain
        </Button>
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </>,
    ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.row}>
        <Button onPress={noop} tone="primary">
          Primary
        </Button>
        <Button onPress={noop}>Secondary</Button>
        <Button onPress={noop} tone="ghost">
          Ghost
        </Button>
        <Button onPress={noop} tone="plain">
          Plain
        </Button>
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () =>
    row(
      <>
        <Button onPress={noop} size="sm" tone="primary">
          Small
        </Button>
        <Button onPress={noop} size="md" tone="primary">
          Medium
        </Button>
        <Button onPress={noop} size="lg" tone="primary">
          Large
        </Button>
      </>,
    ),
};

export const Inline: Story = {
  name: "Inline (in text)",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {/* The `inline` chip flows in a text row and collapses to the row's line
            height: the pill's fill/border overflow the text line above and below
            without making the row any taller (the "Moved to Trash — Restore"
            pattern). */}
        <View style={styles.inlineRow}>
          <Text style={styles.inlineText}>Moved to Trash</Text>
          <Button inline onPress={noop}>
            Restore
          </Button>
        </View>
        {/* Tones compose with `inline`: `secondary` (default) is a bordered chip,
            `ghost` and `plain` are borderless; a leading icon still works. */}
        <View style={styles.inlineRow}>
          <Text style={styles.inlineText}>Draft saved.</Text>
          <Button inline onPress={noop} tone="ghost">
            Undo
          </Button>
          <Button icon={RotateCcw} inline onPress={noop} tone="plain">
            Restore
          </Button>
        </View>
        {/* Each size collapses to its own text line height, so the row tracks the
            text beside it rather than the button. */}
        <View style={styles.inlineRow}>
          <Button inline onPress={noop} size="sm">
            Small
          </Button>
          <Button inline onPress={noop} size="md">
            Medium
          </Button>
          <Button inline onPress={noop} size="lg">
            Large
          </Button>
        </View>
      </View>
    </StorySurface>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  render: () =>
    row(
      <>
        <Button icon={Plus} onPress={noop} tone="primary">
          Add account
        </Button>
        <Button icon={Trash2} onPress={noop} tone="danger">
          Delete
        </Button>
      </>,
    ),
};

export const IconOnly: Story = {
  name: "Icon only",
  render: () =>
    row(
      <>
        {/* An icon-only button has no visible text, so `accessibilityLabel` is
            required (and type-enforced) to give it an accessible name
            (WCAG 2.1 — 1.1.1 / 4.1.2). */}
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          onPress={noop}
          tone="ghost"
        />
        <Button accessibilityLabel="Edit" icon={Pencil} onPress={noop} />
        <Button
          accessibilityLabel="Delete"
          icon={Trash2}
          onPress={noop}
          tone="danger"
        />
      </>,
    ),
};

export const IconShapes: Story = {
  name: "Icon-only shapes",
  render: () =>
    row(
      <>
        {/* Square + circle 1:1 tap targets, floored at a 40px touch target. The
            borderless `plain` tone is the flush header / composer icon button. */}
        <Button
          accessibilityLabel="Add"
          icon={Plus}
          minTouchTarget={40}
          onPress={noop}
          shape="square"
          tone="secondary"
        />
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
        <Button
          accessibilityLabel="Notifications"
          icon={Bell}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="ghost"
        />
        <Button
          accessibilityLabel="More"
          icon={MoreHorizontal}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
      </>,
    ),
};

export const CustomIconNode: Story = {
  name: "Custom icon node",
  render: () =>
    row(
      <>
        {/* `iconNode` renders any node as-is (not wrapped in `<Text>`, not
            tinted) — here a caller-coloured glyph and an emoji stand in for a
            non-lucide `@expo/vector-icons` glyph. The explicit `tabIndex`
            models a consumer-supplied SVG that would otherwise take click
            focus; the decorative wrapper keeps focus on the button. */}
        <Button
          accessibilityLabel="Add"
          iconNode={<Plus color="#2f5945" size={18} tabIndex={-1} />}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
        <Button
          iconNode={<Text style={styles.emoji}>✨</Text>}
          onPress={noop}
          tone="primary"
        >
          Enhance
        </Button>
      </>,
    ),
};

export const Busy: Story = {
  name: "Busy",
  render: () => <BusyExample />,
};

export const BlockAndDisabled: Story = {
  name: "Block and disabled",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Button block onPress={noop} tone="primary">
          Block primary
        </Button>
        <Button block disabled onPress={noop}>
          Disabled
        </Button>
      </View>
    </StorySurface>
  ),
};

export const RolesAndStates: Story = {
  name: "Roles and states",
  render: () => (
    <StorySurface>
      <RolesAndStatesExample />
    </StorySurface>
  ),
};

export const Interactive: Story = {
  name: "Interactive",
  render: () => (
    <StorySurface>
      <InteractiveExample />
    </StorySurface>
  ),
};

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
function RolesAndStatesExample() {
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

function InteractiveExample() {
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

function BusyExample() {
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

export const OnMedia: Story = {
  name: "On media",
  render: () => (
    <StorySurface>
      {/* A control over photography has no theme surface to sit on: the
          translucent white veil is what separates it from the picture, and it
          stays white in every scheme because imagery is dark in every scheme. */}
      <View style={styles.media}>
        <Button
          accessibilityLabel="Close preview"
          icon={X}
          onPress={noop}
          shape="circle"
          tone="onMedia"
        />
        <Button icon={Download} onPress={noop} tone="onMedia">
          Download
        </Button>
      </View>
    </StorySurface>
  ),
};

export const PressLifecycle: Story = {
  name: "Press lifecycle",
  render: () => <PressLifecycleExample />,
};

function PressLifecycleExample() {
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

export const TapTarget: Story = {
  name: "Tap target",
  render: () => <TapTargetExample />,
};

function TapTargetExample() {
  const [presses, setPresses] = useState(0);
  return (
    <StorySurface>
      <View style={styles.row}>
        {/* `boxSize` sets the visible 1:1 box outright — including below the
            smallest size's 30px track — while `hitSlop` keeps the tap area
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

export const LabelAndSlots: Story = {
  name: "Label and slots",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {/* A trailing slot plus a flexed, truncating label: the shape a
            workspace selector needs. `numberOfLines` has to be set here because
            React Native ignores it on a nested <Text>. */}
        <Button
          block
          labelStyle={styles.flexLabel}
          numberOfLines={1}
          onPress={noop}
          trailing={<ChevronDown color="#1c1f1d" size={16} />}
        >
          A workspace name long enough to need truncating
        </Button>
        {/* `content` hands the whole row back to the caller, for a pressable
            card that still announces as a button. */}
        <Button
          accessibilityLabel="Open quarterly report"
          content={
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quarterly report</Text>
              <Text style={styles.inlineText}>Updated 2 hours ago</Text>
            </View>
          }
          onPress={noop}
          style={styles.cardButton}
        />
      </View>
    </StorySurface>
  ),
};

export const MenuTrigger: Story = {
  name: "Menu trigger",
  render: () => <MenuTriggerExample />,
};

function MenuTriggerExample() {
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

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    gap: 2,
  },
  cardButton: {
    alignItems: "flex-start",
    height: "auto",
    paddingVertical: 12,
  },
  cardTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  flexLabel: {
    flex: 1,
    textAlign: "left",
  },
  inlineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minWidth: 320,
    // A little vertical headroom so the chip (and its focus ring), which overflow
    // the text line, are never clipped — required under an `overflow: "hidden"`
    // ancestor on web and by default on native Android.
    paddingVertical: 8,
  },
  inlineText: {
    color: "#1c1f1d",
    fontSize: 14,
    lineHeight: 20,
  },
  media: {
    alignItems: "center",
    backgroundColor: "#241f2c",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minWidth: 320,
    padding: 24,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    minWidth: 320,
  },
  stack: {
    gap: 12,
    minWidth: 320,
  },
});
