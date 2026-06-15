/** The platform-specific date-field triggers (web text input vs native tap). */
import { CalendarDays, CircleX } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { InputFrame, inputIconSize } from "../input";
import { useSharedUiTheme } from "../theme";

import { DateFieldStyles } from "./dateFieldStyles";
import { DateFieldController } from "./useDateField";

export type TriggerProps = {
  field: DateFieldController;
  invalid: boolean;
  label: string;
  placeholder: string;
  required: boolean;
  /** Control density: scales the box (web) / icons (native) to match the field. */
  size: ControlSize;
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
  size,
  styles,
  clearable,
}: TriggerProps) {
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
  // The shared input box owns the chrome, focus ring, clear button, and aria
  // wiring; the date field only supplies the type-or-pick behaviour. `active`
  // keeps the primary border while the calendar is open even without focus (a
  // mouse click on the icon), matching `field.open || editing`. The calendar
  // suffix icon is mouse-only (no label) since focusing the input already opens
  // the picker.
  return (
    <InputFrame
      accessibilityHint={field.display ? undefined : placeholder}
      accessibilityLabel={label}
      active={field.open || editing}
      clearAccessibilityLabel={`Clear ${label}`}
      clearable={clearable}
      // Track the committed ISO value, not the live typed buffer (`value`), so
      // the clear button mirrors the pre-refactor behaviour: visible while a
      // committed date is being edited to empty, hidden for unparseable partial
      // text in an otherwise-empty field.
      clearVisible={Boolean(field.value)}
      inputRef={inputRef}
      invalid={invalid}
      onBlur={commitFromText}
      // Commit live as the user types so a valid date moves the calendar.
      onChangeText={(next) => {
        setText(next);
        field.commitText(next);
      }}
      onClear={clearValue}
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
      onSuffixIconPress={() => field.setOpen(true)}
      placeholder={placeholder}
      required={required}
      size={size}
      suffixIcon={CalendarDays}
      suffixIconStyle={styles.calendarNudge}
      value={text}
    />
  );
}

export function NativeTrigger({
  field,
  invalid,
  label,
  placeholder,
  required,
  size,
  styles,
  clearable,
}: TriggerProps) {
  const theme = useSharedUiTheme();
  const iconSize = inputIconSize(size);
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
            <CircleX color={theme.colors.muted} size={iconSize} />
          </Pressable>
        ) : null}
        {/* Decorative: the row already opens the picker on tap, so the icon just
            marks the affordance and carries no a11y semantics. */}
        <View style={styles.calendarNudge}>
          <CalendarDays color={theme.colors.muted} size={iconSize} />
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
