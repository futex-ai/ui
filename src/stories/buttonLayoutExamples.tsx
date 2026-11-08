/**
 * Layout examples for the Button stories: inline, icon-only, media, and slots.
 */
import {
  Bell,
  ChevronDown,
  Download,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  X,
} from "../primitives/icons";
import { Text, View } from "../primitives/reactNative";

import { Button } from "../index";
import { noop, row, styles } from "./buttonStoryParts";
import { StorySurface } from "./sharedExamples";

export function InlineExample() {
  return (
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
  );
}

export function IconShapesExample() {
  return row(
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
  );
}

export function CustomIconNodeExample() {
  return row(
    <>
      {/* `iconNode` renders any node as-is (not wrapped in `<Text>`, not
          tinted) — here two caller-coloured glyphs stand in for a non-lucide
          `@expo/vector-icons` glyph. The explicit `tabIndex` models a
          consumer-supplied SVG that would otherwise take click focus; the
          decorative wrapper keeps focus on the button. */}
      <Button
        accessibilityLabel="Add"
        iconNode={<Plus color="#2f5945" size={18} tabIndex={-1} />}
        minTouchTarget={40}
        onPress={noop}
        shape="circle"
        tone="plain"
      />
      <Button
        iconNode={<Sparkles color="#f2c14e" size={16} tabIndex={-1} />}
        onPress={noop}
        tone="primary"
      >
        Enhance
      </Button>
    </>,
  );
}

export function OnMediaExample() {
  return (
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
  );
}

export function LabelAndSlotsExample() {
  return (
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
  );
}
