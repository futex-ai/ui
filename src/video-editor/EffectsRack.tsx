/**
 * The stack of effects applied to a clip.
 *
 * Order matters in an effect chain, so reordering runs through the library's
 * own {@link SortableList} — which brings pointer *and* keyboard dragging, drop
 * previews, and drag announcements with it, rather than this panel inventing a
 * second, worse version of all three.
 *
 * Each effect's parameters are an {@link Inspector} nested inside its card, so
 * a rack row and the clip's own property panel are built from the same rows and
 * behave identically.
 */
import { Plus, Trash2 } from "lucide-react-native";
import { useMemo } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { DropdownMenu, type DropdownListEntry } from "../dropdown";
import { useFocusRing } from "../focusRing";
import { SortableList, type SortableMove } from "../sortable-list";
import { Switch } from "../switch";
import { useSharedUiTheme } from "../theme";

import { Inspector } from "./Inspector";
import type { InspectorProperty, InspectorValue } from "./inspectorModel";
import { createEffectsStyles } from "./effectsStyles";
import { videoEditorSizing } from "./videoEditorSizing";

/** One effect in a clip's chain. */
export type EffectEntry = {
  id: string;
  name: string;
  /** Whether the effect contributes to the output. */
  enabled: boolean;
  /** The effect's own parameters, rendered as an inspector section. */
  properties?: readonly InspectorProperty[];
  /** Collapsed effects show their header row only. */
  collapsed?: boolean;
};

/** An effect a consumer can add, offered in the add menu. */
export type EffectOption = { id: string; label: string };

export type EffectsRackProps = {
  effects: readonly EffectEntry[];
  /** Supplying this enables reordering. Apply it with `applySortableMove`. */
  onReorder?: (move: SortableMove) => void;
  onToggleEnabled?: (effectId: string) => void;
  onRemove?: (effectId: string) => void;
  onToggleCollapsed?: (effectId: string) => void;
  onPropertyChange?: (
    effectId: string,
    propertyId: string,
    value: InspectorValue,
  ) => void;
  /** Supplying both shows the add button. */
  addOptions?: readonly EffectOption[];
  onAdd?: (optionId: string) => void;
  /** Panel heading. */
  title?: string;
  /** Shown when the chain is empty. */
  emptyLabel?: string;
  size?: ControlSize;
  disableFocusRing?: boolean;
  /** Names the rack as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function EffectsRack({
  accessibilityLabel,
  addOptions,
  disableFocusRing = false,
  effects,
  emptyLabel = "No effects",
  onAdd,
  onPropertyChange,
  onRemove,
  onReorder,
  onToggleCollapsed,
  onToggleEnabled,
  size = "md",
  style,
  testID,
  title,
}: EffectsRackProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createEffectsStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];

  const addEntries: DropdownListEntry[] = useMemo(
    () =>
      (addOptions ?? []).map((option) => ({
        id: option.id,
        label: option.label,
        onPress: () => onAdd?.(option.id),
        type: "item",
      })),
    [addOptions, onAdd],
  );

  return (
    <View
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, style]}
      testID={testID}
    >
      {title || (addOptions && onAdd) ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {addOptions && onAdd ? (
            <DropdownMenu entries={addEntries} minWidth={180}>
              <View
                accessibilityLabel="Add an effect"
                accessibilityRole="button"
                style={styles.addButton}
                testID={testID ? `${testID}-add` : undefined}
              >
                <Plus
                  color={theme.colors.primaryDeep}
                  size={metrics.iconSize}
                />
              </View>
            </DropdownMenu>
          ) : null}
        </View>
      ) : null}

      {effects.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <SortableList
          accessibilityLabel={title ?? "Effects"}
          disableFocusRing={disableFocusRing}
          handle="custom"
          itemKey={(effect: EffectEntry) => effect.id}
          itemLabel={(effect: EffectEntry) => effect.name}
          items={[...effects]}
          onReorder={onReorder}
          renderItem={(effect: EffectEntry, _index: number, handle) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {handle}
                <Pressable
                  accessibilityLabel={`${effect.name} parameters`}
                  accessibilityRole="button"
                  disabled={!onToggleCollapsed}
                  onPress={() => onToggleCollapsed?.(effect.id)}
                  style={styles.cardName}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.nameText, { fontSize: metrics.fontSize }]}
                  >
                    {effect.name}
                  </Text>
                </Pressable>
                {onToggleEnabled ? (
                  <Switch
                    accessibilityLabel={`${effect.enabled ? "Disable" : "Enable"} ${effect.name}`}
                    disableFocusRing={disableFocusRing}
                    onValueChange={() => onToggleEnabled(effect.id)}
                    size="sm"
                    testID={`effect-enabled-${effect.id}`}
                    value={effect.enabled}
                  />
                ) : null}
                {onRemove ? (
                  <RemoveButton
                    disableFocusRing={disableFocusRing}
                    label={`Remove ${effect.name}`}
                    onPress={() => onRemove(effect.id)}
                    testID={`effect-remove-${effect.id}`}
                  />
                ) : null}
              </View>
              {effect.collapsed || !effect.properties?.length ? null : (
                <Inspector
                  onChange={
                    onPropertyChange
                      ? (propertyId, value) =>
                          onPropertyChange(effect.id, propertyId, value)
                      : undefined
                  }
                  sections={[
                    {
                      id: `${effect.id}-params`,
                      properties: effect.properties,
                      title: "",
                    },
                  ]}
                  size={size}
                  style={styles.params}
                />
              )}
            </View>
          )}
          size={size}
        />
      )}
    </View>
  );
}

function RemoveButton({
  disableFocusRing,
  label,
  onPress,
  testID,
}: {
  disableFocusRing: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createEffectsStyles(theme), [theme]);
  const focus = useFocusRing({ disabled: disableFocusRing });
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.iconButton,
        focus.webOutlineReset,
        focus.focused && focus.ringEnabled ? styles.iconButtonFocused : null,
      ]}
      testID={testID}
    >
      <Trash2 color={theme.colors.rose} size={14} />
    </Pressable>
  );
}
