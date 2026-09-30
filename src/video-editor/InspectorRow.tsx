/**
 * One property row: a label, the control the property's type calls for, and the
 * two actions that belong to every property — reset, and the keyframe
 * stopwatch.
 *
 * Each control carries the property's own label as its accessible name, so the
 * visible text and the spoken name agree (WCAG 2.1 — 2.5.3 Label in Name, A).
 * Both actions name what they will do and what they act on, rather than being
 * an anonymous glyph in a row of identical glyphs.
 */
import { Clock, RotateCcw } from "../primitives/icons";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Pressable, Text, TextInput, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { DropdownMenu, type DropdownListEntry } from "../dropdown";
import { type FocusIndicator, useFocusRing } from "../focusRing";
import { Switch } from "../switch";
import { useSharedUiTheme } from "../theme";

import { NumberScrubber } from "./NumberScrubber";
import {
  isPropertyModified,
  type InspectorProperty,
  type InspectorValue,
} from "./inspectorModel";
import { createInspectorStyles } from "./inspectorStyles";
import { videoEditorSizing } from "./videoEditorSizing";

export type InspectorRowProps = {
  property: InspectorProperty;
  onChange?: (propertyId: string, value: InspectorValue) => void;
  onReset?: (propertyId: string) => void;
  /** Supplying this shows the keyframe stopwatch. */
  onToggleKeyframe?: (propertyId: string) => void;
  /** Whether this property is currently keyframed. */
  keyframed?: boolean;
  size?: ControlSize;
  focusIndicator?: FocusIndicator;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function InspectorRow({
  focusIndicator,
  keyframed = false,
  onChange,
  onReset,
  onToggleKeyframe,
  property,
  size = "md",
  testID,
}: InspectorRowProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];

  return (
    <View style={styles.row} testID={testID}>
      <Text
        numberOfLines={1}
        style={[styles.rowLabel, { fontSize: metrics.fontSize }]}
      >
        {property.label}
      </Text>
      <View style={styles.rowControl}>
        <PropertyControl
          focusIndicator={focusIndicator}
          onChange={onChange}
          property={property}
          size={size}
        />
      </View>
      <View style={styles.rowActions}>
        {onReset && isPropertyModified(property) ? (
          <RowAction
            Icon={RotateCcw}
            focusIndicator={focusIndicator}
            label={`Reset ${property.label}`}
            onPress={() => onReset(property.id)}
            testID={testID ? `${testID}-reset` : undefined}
          />
        ) : null}
        {onToggleKeyframe ? (
          <RowAction
            Icon={Clock}
            active={keyframed}
            focusIndicator={focusIndicator}
            label={`${keyframed ? "Stop" : "Start"} keyframing ${property.label}`}
            onPress={() => onToggleKeyframe(property.id)}
            testID={testID ? `${testID}-keyframe` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

function PropertyControl({
  focusIndicator,
  onChange,
  property,
  size,
}: {
  focusIndicator: FocusIndicator | undefined;
  onChange?: (propertyId: string, value: InspectorValue) => void;
  property: InspectorProperty;
  size: ControlSize;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];

  switch (property.type) {
    case "number":
      return (
        <NumberScrubber
          focusIndicator={focusIndicator}
          disabled={property.disabled}
          label={property.label}
          max={property.max}
          min={property.min}
          onValueChange={
            onChange ? (value) => onChange(property.id, value) : undefined
          }
          precision={property.precision}
          size={size}
          step={property.step}
          testID={`inspector-${property.id}`}
          unit={property.unit}
          value={property.value}
        />
      );
    case "toggle":
      return (
        <Switch
          accessibilityLabel={property.label}
          focusIndicator={focusIndicator}
          disabled={property.disabled}
          onValueChange={
            onChange ? (value) => onChange(property.id, value) : undefined
          }
          size={size}
          testID={`inspector-${property.id}`}
          value={property.value}
        />
      );
    case "select": {
      const entries: DropdownListEntry[] = property.options.map((option) => ({
        id: option.value,
        label: option.label,
        onPress: () => onChange?.(property.id, option.value),
        type: "item",
      }));
      const current = property.options.find(
        (option) => option.value === property.value,
      );
      return (
        <DropdownMenu entries={entries} minWidth={160}>
          <View
            accessibilityLabel={`${property.label}, ${current?.label ?? property.value}`}
            accessibilityRole="button"
            style={[styles.selectTrigger, { height: metrics.rowHeight }]}
            testID={`inspector-${property.id}`}
          >
            <Text
              numberOfLines={1}
              style={[styles.selectText, { fontSize: metrics.fontSize }]}
            >
              {current?.label ?? property.value}
            </Text>
          </View>
        </DropdownMenu>
      );
    }
    case "color":
      return (
        <View style={styles.swatchRow}>
          {property.swatches.map((swatch) => (
            <ColorSwatch
              color={swatch}
              focusIndicator={focusIndicator}
              key={swatch}
              label={`${property.label}, ${swatch}`}
              onPress={() => onChange?.(property.id, swatch)}
              selected={swatch === property.value}
            />
          ))}
        </View>
      );
    default:
      return (
        <View style={[styles.field, { height: metrics.rowHeight }]}>
          <TextInput
            accessibilityLabel={property.label}
            editable={!property.disabled && Boolean(onChange)}
            onChangeText={(text) => onChange?.(property.id, text)}
            placeholder={property.placeholder}
            placeholderTextColor={theme.colors.placeholder}
            style={[
              styles.fieldInput,
              { color: theme.colors.ink, fontSize: metrics.fontSize },
            ]}
            value={property.value}
          />
        </View>
      );
  }
}

function ColorSwatch({
  color,
  focusIndicator,
  label,
  onPress,
  selected,
}: {
  color: string;
  focusIndicator: FocusIndicator | undefined;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const focus = useFocusRing({ indicator: focusIndicator });
  return (
    <Pressable
      accessibilityLabel={selected ? `${label}, selected` : label}
      accessibilityRole="button"
      {...focus.focusRingProps}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.swatch,
        { backgroundColor: color },
        selected ? styles.swatchSelected : null,
        focus.focusRingVariables,
      ]}
    />
  );
}

function RowAction({
  Icon,
  active = false,
  focusIndicator,
  label,
  onPress,
  testID,
}: {
  Icon: ComponentType<{ color?: string; size?: number }>;
  active?: boolean;
  focusIndicator: FocusIndicator | undefined;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const focus = useFocusRing({ indicator: focusIndicator });
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      {...focus.focusRingProps}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.iconButton,
        active ? styles.iconButtonOn : null,
        focus.focusRingVariables,
      ]}
      testID={testID}
    >
      <Icon
        color={active ? theme.colors.primaryDeep : theme.colors.muted}
        size={13}
      />
    </Pressable>
  );
}
