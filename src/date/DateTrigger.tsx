/** The platform-specific date-field triggers (web text input vs native tap). */
import { CalendarDays, CircleX } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { hideWebOutline, hideWebOutlineView } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { DateFieldStyles } from "./dateFieldStyles";
import { DateFieldController } from "./useDateField";

export type TriggerProps = {
  field: DateFieldController;
  invalid: boolean;
  label: string;
  placeholder: string;
  required: boolean;
  styles: DateFieldStyles;
  /** Whether the clear (✕) button is shown once a value is set. */
  clearable: boolean;
};

export function WebTrigger({
  field,
  invalid,
  label,
  placeholder,
  required,
  styles,
  clearable,
}: TriggerProps) {
  const theme = useSharedUiTheme();
  const [text, setText] = useState(field.display);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Set when `clear` refocuses the input so the focus does not also re-open the
  // calendar — clearing should leave the field empty and closed, not pop a picker.
  const suppressOpenRef = useRef(false);
  useEffect(() => {
    if (!editing) {
      setText(field.display);
    }
  }, [editing, field.display]);
  // Commit typed text, then let the `editing` toggle + effect normalize the input
  // to the canonical `D Mon YYYY` (or revert to the last value when unparseable).
  const commitFromText = () => {
    setEditing(false);
    if (!field.commitText(text)) {
      setText(field.display);
    }
  };
  // Clear the value and return focus to the (now empty) input without re-opening
  // the calendar, so keyboard users keep their place and the field stays closed.
  const clearValue = () => {
    field.clear();
    setText("");
    suppressOpenRef.current = true;
    inputRef.current?.focus();
  };
  // `editing` doubles as the focus state, so the focus ring shows on the whole
  // field box (primary border) rather than the browser's default ring on the
  // inner input.
  return (
    <View
      style={[
        styles.trigger,
        triggerBorder(styles, invalid, field.open || editing),
      ]}
    >
      <TextInput
        accessibilityHint={field.display ? undefined : placeholder}
        accessibilityLabel={label}
        aria-invalid={invalid}
        aria-required={required}
        // Commit live as the user types so a valid date moves the calendar.
        onBlur={commitFromText}
        onChangeText={(next) => {
          setText(next);
          field.commitText(next);
        }}
        // Focusing the input opens the calendar, unless a clear just refocused it.
        onFocus={() => {
          setEditing(true);
          if (suppressOpenRef.current) {
            suppressOpenRef.current = false;
            return;
          }
          field.setOpen(true);
        }}
        onSubmitEditing={commitFromText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.faint}
        ref={inputRef}
        style={[styles.triggerInput, hideWebOutline]}
        value={text}
      />
      {/* Unlike the calendar icon, clear is a distinct action with no keyboard
          equivalent, so it stays an accessible button (in the tab order and a11y
          tree). Opt-in, and only shown once there is a value to remove. */}
      {clearable && field.value ? (
        <Pressable
          accessibilityLabel={`Clear ${label}`}
          accessibilityRole="button"
          onPress={clearValue}
          style={[styles.triggerIcon, hideWebOutlineView]}
        >
          <CircleX color={theme.colors.muted} size={16} />
        </Pressable>
      ) : null}
      {/* The input opens the calendar on focus, so the icon is a mouse-only
          affordance: keep it out of the tab order (`tabIndex={-1}`; RNW's
          Pressable ignores `focusable`) and the a11y tree, matching the mockup's
          aria-hidden icon. The outline is hidden so a mouse click leaves no ring. */}
      <Pressable
        aria-hidden
        onPress={() => field.setOpen(true)}
        style={[styles.triggerIcon, styles.calendarNudge, hideWebOutlineView]}
        tabIndex={-1}
      >
        <CalendarDays color={theme.colors.muted} size={16} />
      </Pressable>
    </View>
  );
}

export function NativeTrigger({
  field,
  invalid,
  label,
  placeholder,
  required,
  styles,
  clearable,
}: TriggerProps) {
  const theme = useSharedUiTheme();
  // The row is a non-accessible Pressable (a full-row tap target to open) so its
  // two accessible children — the labelled open button and the clear button —
  // stay independently focusable. If the row were itself an accessibility element
  // (role + label), VoiceOver/TalkBack would merge the children into one node and
  // swallow the clear action, leaving no way to unset the field on native.
  return (
    <Pressable
      accessible={false}
      onPress={() => field.setOpen(true)}
      style={[styles.trigger, triggerBorder(styles, invalid, false)]}
    >
      <Pressable
        accessibilityLabel={`${label}: ${field.display || placeholder}`}
        accessibilityRole="button"
        aria-invalid={invalid}
        aria-required={required}
        onPress={() => field.setOpen(true)}
        style={styles.triggerOpen}
      >
        <Text
          style={
            field.display ? styles.triggerValue : styles.triggerPlaceholder
          }
        >
          {field.display || placeholder}
        </Text>
      </Pressable>
      <View style={styles.triggerIcons}>
        {/* Nested Pressable: on native it captures the touch (responder system),
            so clearing does not also open the picker the row press would. */}
        {clearable && field.value ? (
          <Pressable
            accessibilityLabel={`Clear ${label}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={field.clear}
          >
            <CircleX color={theme.colors.muted} size={16} />
          </Pressable>
        ) : null}
        {/* Decorative: the row already opens the picker on tap, so the icon just
            marks the affordance and carries no a11y semantics. */}
        <View style={styles.calendarNudge}>
          <CalendarDays color={theme.colors.muted} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

/** Border style for a trigger: rose when invalid, primary when open, else default. */
export function triggerBorder(
  styles: DateFieldStyles,
  invalid: boolean,
  open: boolean,
) {
  if (invalid) {
    return styles.triggerInvalid;
  }
  return open ? styles.triggerActive : null;
}
