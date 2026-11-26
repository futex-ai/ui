/** A settings dialog that opens with focus on its surface, for stories and browser tests. */
import { useRef, useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Body, Button, Input, WebModalFrame } from "../index";

/**
 * Opens a settings dialog with `initialFocus="surface"`. The dialog opens with
 * no focus ring on any control. With `bookTarget`, the book chip is the
 * `initialFocusRef`, so the first Tab moves to it and skips the name field
 * before it. Without it, the first Tab moves to the first caller control.
 * With `bookDisabled`, the chip cannot take focus, so the first Tab also
 * moves to the first caller control.
 */
export function ModalSurfaceFocusExample({
  bookDisabled = false,
  bookTarget,
}: {
  bookDisabled?: boolean;
  bookTarget: boolean;
}) {
  const [visible, setVisible] = useState(true);
  const [name, setName] = useState("Alex Morgan");
  const bookRef = useRef<View>(null);
  return (
    <View style={styles.page}>
      <Button onPress={() => setVisible(true)}>Open settings</Button>
      <WebModalFrame
        footer={
          <View style={styles.rail}>
            <Button onPress={() => undefined} tone="ghost">
              Profile
            </Button>
            <Button onPress={() => undefined} tone="ghost">
              Billing
            </Button>
          </View>
        }
        initialFocus="surface"
        initialFocusRef={bookTarget ? bookRef : undefined}
        onClose={() => setVisible(false)}
        title="Settings"
        visible={visible}
      >
        <Input label="Display name" onChangeText={setName} value={name} />
        <Body>Current book</Body>
        <View style={styles.chipRow}>
          <Button
            buttonRef={bookRef}
            disabled={bookDisabled}
            onPress={() => undefined}
            tone="secondary"
          >
            Northwind Books
          </Button>
        </View>
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { alignItems: "flex-start" },
  page: { alignItems: "flex-start" },
  rail: { flexDirection: "row", gap: 8 },
});
