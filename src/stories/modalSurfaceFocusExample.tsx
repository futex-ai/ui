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
 * moves to the first caller control. "Remove book" opens a confirmation
 * over the dialog. Confirming removes the book, the chip, and the button
 * that opened the confirmation. With `nameHidden`, the name field sits in a
 * hidden container, so the first caller control that can take focus is the
 * chip.
 */
export function ModalSurfaceFocusExample({
  bookDisabled = false,
  bookTarget,
  nameHidden = false,
}: {
  bookDisabled?: boolean;
  bookTarget: boolean;
  nameHidden?: boolean;
}) {
  const [visible, setVisible] = useState(true);
  const [name, setName] = useState("Alex Morgan");
  const [hasBook, setHasBook] = useState(true);
  const [confirming, setConfirming] = useState(false);
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
        <View style={nameHidden ? styles.hidden : null}>
          <Input label="Display name" onChangeText={setName} value={name} />
        </View>
        <Body>Current book</Body>
        {hasBook ? (
          <View style={styles.chipRow}>
            <Button
              buttonRef={bookRef}
              disabled={bookDisabled}
              onPress={() => undefined}
              tone="secondary"
            >
              Northwind Books
            </Button>
            <Button onPress={() => setConfirming(true)} tone="ghost">
              Remove book
            </Button>
          </View>
        ) : (
          <Body>No book</Body>
        )}
        <WebModalFrame
          footer={
            <>
              <Button onPress={() => setConfirming(false)}>Cancel</Button>
              <Button
                onPress={() => {
                  setHasBook(false);
                  setConfirming(false);
                }}
                tone="danger"
              >
                Remove
              </Button>
            </>
          }
          onClose={() => setConfirming(false)}
          size="sm"
          title="Remove Northwind Books?"
          visible={confirming}
        >
          <Body>The book stays in your account.</Body>
        </WebModalFrame>
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  hidden: { display: "none" },
  page: { alignItems: "flex-start" },
  rail: { flexDirection: "row", gap: 8 },
});
