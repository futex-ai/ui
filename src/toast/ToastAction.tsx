/** The optional action button of a toast, such as "Undo" or "Restore". */
import { useState } from "react";
import { Pressable, Text, View } from "../primitives/reactNative";

import { Button } from "../button";
import { hideWebOutlineView, PressableHoverState } from "../focusRing";

import type { ToastStyles } from "./toastStyles";
import type { ToastAction as ToastActionModel } from "./toastModel";

export type ToastActionProps = {
  /** The action to render. */
  action: ToastActionModel;
  /** The colour of the text and focus ring on a filled toast. */
  filledForeground: string;
  /** Whether the toast has a solid fill instead of the card surface. */
  filled: boolean;
  /** Runs after the action handler, to take the toast out of the stack. */
  onDone: () => void;
  /** The theme styles of the toast. */
  styles: ToastStyles;
};

/**
 * The action row. A card toast shows a small ghost {@link Button} on its own
 * row, at the left edge of the card. A filled toast shows bare text in the
 * fill colour under its title, with a wash on hover and a ring on focus.
 * A press runs the handler and then dismisses the toast.
 */
export function ToastAction({
  action,
  filled,
  filledForeground,
  onDone,
  styles,
}: ToastActionProps) {
  const [focused, setFocused] = useState(false);
  const onPress = () => {
    action.onPress();
    onDone();
  };
  if (!filled) {
    return (
      <View style={styles.actions}>
        <Button onPress={onPress} size="sm" tone="ghost">
          {action.label}
        </Button>
      </View>
    );
  }
  return (
    <View style={styles.solidActions}>
      <Pressable
        accessibilityRole="button"
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPress={onPress}
        style={({ hovered }: PressableHoverState) => [
          styles.solidActionButton,
          hovered ? styles.solidActionButtonHover : null,
          focused ? { boxShadow: `0 0 0 2px ${filledForeground}` } : null,
          hideWebOutlineView,
        ]}
      >
        <Text style={[styles.solidActionText, { color: filledForeground }]}>
          {action.label}
        </Text>
      </Pressable>
    </View>
  );
}
