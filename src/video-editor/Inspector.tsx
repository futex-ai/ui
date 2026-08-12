/**
 * The property panel.
 *
 * Sections of typed rows over a controlled model: the consumer owns the
 * properties and every change is reported. What a row looks like follows from
 * the property's `type`, so adding a control to a panel is a data change rather
 * than a layout one.
 *
 * Sections collapse from their heading, which is a real button rather than a
 * clickable heading, and publishes its expanded state — the one place a
 * disclosure has to say what it is doing (WCAG 2.1 — 4.1.2, A).
 */
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { InspectorRow } from "./InspectorRow";
import type { InspectorSection, InspectorValue } from "./inspectorModel";
import { createInspectorStyles } from "./inspectorStyles";
import { videoEditorSizing } from "./videoEditorSizing";

export type InspectorProps = {
  sections: readonly InspectorSection[];
  /** Heading above the sections — usually what is selected. */
  title?: string;
  onChange?: (propertyId: string, value: InspectorValue) => void;
  /** Supplying this shows a reset action on every modified property. */
  onReset?: (propertyId: string) => void;
  /** Supplying this shows the keyframe stopwatch on every row. */
  onToggleKeyframe?: (propertyId: string) => void;
  /** Ids of properties currently being keyframed. */
  keyframedIds?: readonly string[];
  /** Supplying this makes section headings collapsible. */
  onToggleSection?: (sectionId: string) => void;
  /** Shown when there are no sections — nothing is selected. */
  emptyLabel?: string;
  /** Caps the scrollable body's height. */
  maxHeight?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  disableFocusRing?: boolean;
  /** Names the panel as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function Inspector({
  accessibilityLabel,
  disableFocusRing = false,
  emptyLabel = "Nothing selected",
  keyframedIds = [],
  maxHeight,
  onChange,
  onReset,
  onToggleKeyframe,
  onToggleSection,
  sections,
  size = "md",
  style,
  testID,
  title,
}: InspectorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const keyframed = useMemo(() => new Set(keyframedIds), [keyframedIds]);

  const body = (
    <View>
      {sections.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        sections.map((section) => (
          <View key={section.id}>
            <SectionHeader
              disableFocusRing={disableFocusRing}
              onToggle={
                onToggleSection ? () => onToggleSection(section.id) : undefined
              }
              section={section}
              testID={testID ? `${testID}-section-${section.id}` : undefined}
            />
            {section.collapsed
              ? null
              : section.properties.map((property) => (
                  <InspectorRow
                    disableFocusRing={disableFocusRing}
                    key={property.id}
                    keyframed={keyframed.has(property.id)}
                    onChange={onChange}
                    onReset={onReset}
                    onToggleKeyframe={onToggleKeyframe}
                    property={property}
                    size={size}
                    testID={`inspector-row-${property.id}`}
                  />
                ))}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, style]}
      testID={testID}
    >
      {title ? (
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : null}
      {maxHeight ? <ScrollView style={{ maxHeight }}>{body}</ScrollView> : body}
    </View>
  );
}

function SectionHeader({
  disableFocusRing,
  onToggle,
  section,
  testID,
}: {
  disableFocusRing: boolean;
  onToggle?: () => void;
  section: InspectorSection;
  testID?: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const focus = useFocusRing({ disabled: disableFocusRing });
  const metrics = videoEditorSizing.md;

  if (!onToggle) {
    return (
      <View style={styles.sectionHeader} testID={testID}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    );
  }

  const expanded = !section.collapsed;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <Pressable
      accessibilityLabel={`${section.title} section`}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onToggle}
      style={[
        styles.sectionHeader,
        focus.webOutlineReset,
        focus.focused && focus.ringEnabled ? styles.sectionHeaderFocused : null,
      ]}
      testID={testID}
      // react-native-web does not emit `aria-expanded` from
      // `accessibilityState`, so the literal prop is spread on web to keep the
      // disclosure's state legible to assistive tech.
      {...(Platform.OS === "web"
        ? ({ "aria-expanded": expanded } as Record<string, unknown>)
        : {})}
    >
      <Chevron color={theme.colors.muted} size={metrics.iconSize - 2} />
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </Pressable>
  );
}
