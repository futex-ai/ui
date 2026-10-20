/**
 * The bottom-sheet presentation of `ComboboxMultiSelect`
 * (`presentation="sheet"`): a trigger in the field, and a sheet with the
 * chips and search input at the top, the option list below, and a Done
 * action that closes it.
 */
import { useMemo } from "react";
import type { ComponentProps, RefObject } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { type FocusIndicator, useFocusRing } from "../focusRing";
import { Sheet } from "../sheet";
import { useSharedUiTheme } from "../theme";

import { ComboboxChips } from "./ComboboxOptionParts";
import { DropdownList } from "./DropdownList";
import { comboboxInputA11y } from "./comboboxModel";
import {
  MULTI_SELECT_SIZES,
  createComboboxMultiSelectStyles,
} from "./comboboxMultiSelectStyles";
import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type { useComboboxNavigation } from "./useComboboxNavigation";

type ChipProps = ComponentProps<typeof ComboboxChips>;

export type ComboboxSheetProps = {
  /** `aria-activedescendant` target for the search input. */
  activeDescendant?: string;
  /** Selected-value chips; the sheet always wraps them. */
  chips: Omit<ChipProps, "iconSize" | "singleLine" | "styles">;
  /** The field's `focusIndicator`, applied to the sheet's search box. */
  focusIndicator?: FocusIndicator;
  /** Name, description, and state of the search input. */
  inputA11y: object;
  /** Key handling shared with the field's navigation hook. */
  inputKeyProps: ReturnType<typeof useComboboxNavigation>["keyProps"];
  /** The search input; focused when the sheet opens. */
  inputRef: RefObject<TextInput | null>;
  /** Name of the sheet. */
  label: string;
  /** The option list, without the parts the sheet supplies. */
  list: Omit<ComponentProps<typeof DropdownList>, "maxHeight" | "search">;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  open: boolean;
  placeholder: string;
  query: string;
  size: ControlSize;
};

/**
 * Selections apply as they are made, so the sheet's dismiss control is a Done
 * action rather than a Cancel: the native header shows "Done", and on web the
 * modal's close button is named "Done".
 */
export function ComboboxSheet({
  activeDescendant,
  chips,
  focusIndicator,
  inputA11y,
  inputKeyProps,
  inputRef,
  label,
  list,
  onClose,
  onQueryChange,
  open,
  placeholder,
  query,
  size,
}: ComboboxSheetProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createComboboxMultiSelectStyles(theme, undefined, size, false),
    [theme, size],
  );
  const focus = useFocusRing({
    indicator: focusIndicator,
    target: "descendant",
  });
  return (
    <Sheet
      dismissLabel="Done"
      initialFocusRef={inputRef}
      label={label}
      onClose={onClose}
      open={open}
    >
      {({ maxHeight }) => (
        <DropdownList
          {...list}
          maxHeight={maxHeight}
          search={
            <View
              {...focus.focusRingProps}
              style={[
                styles.control,
                focus.focused && focus.indicator !== "none"
                  ? styles.controlActive
                  : null,
                focus.focusRingVariables,
              ]}
            >
              <ComboboxChips
                {...chips}
                iconSize={MULTI_SELECT_SIZES[size].chipIconSize}
                singleLine={false}
                styles={styles}
              />
              <TextInput
                {...focus.focusTargetProps}
                {...inputA11y}
                onBlur={focus.onBlur}
                onChangeText={onQueryChange}
                onFocus={focus.onFocus}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.placeholder}
                ref={inputRef}
                style={styles.input}
                value={query}
                {...comboboxInputA11y({
                  activeDescendant,
                  controls: list.listId ?? "",
                  open,
                })}
                {...inputKeyProps}
              />
            </View>
          }
        />
      )}
    </Sheet>
  );
}

/**
 * The field's button for `presentation="sheet"`. It takes the search input's
 * place and shows the placeholder; pressing it opens the sheet.
 */
export function ComboboxSheetTrigger({
  accessibilityLabel,
  description,
  focus,
  invalid,
  onPress,
  open,
  placeholder,
  styles,
  triggerRef,
}: {
  accessibilityLabel: string;
  /** The field's error and hint, as the button's description. */
  description: object;
  focus: ReturnType<typeof useFocusRing>;
  invalid: boolean;
  onPress: () => void;
  open: boolean;
  placeholder: string;
  styles: ComboboxMultiSelectStyles;
  triggerRef: RefObject<View | null>;
}) {
  // The button opens a dialog. RNW's bundled types omit `aria-haspopup`, so
  // the web attributes travel in a cast object; native reads the state.
  const popupA11y =
    Platform.OS === "web"
      ? ({ "aria-expanded": open, "aria-haspopup": "dialog" } as object)
      : { accessibilityState: { expanded: open } };
  return (
    <Pressable
      {...focus.focusTargetProps}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      aria-invalid={invalid}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      ref={triggerRef}
      style={styles.sheetTrigger}
      {...popupA11y}
      {...description}
    >
      <Text numberOfLines={1} style={styles.sheetTriggerText}>
        {placeholder}
      </Text>
    </Pressable>
  );
}
