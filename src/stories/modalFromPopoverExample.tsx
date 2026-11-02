/** A dialog opened from a popover action, for the web modal stack tests. */
import { useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Body, Button, Input, Popover, WebModalFrame } from "../index";

/**
 * A book's options popover whose action closes the popover and opens a dialog
 * in one update, the way an app menu opens a form. The popover returns focus
 * to its trigger as it closes, so the dialog returns focus there when it
 * closes in turn.
 */
export function ModalFromPopoverExample() {
  const [bookName, setBookName] = useState("Greenhouse Studio");
  const [draftName, setDraftName] = useState(bookName);
  const [renaming, setRenaming] = useState(false);

  const saveName = () => {
    setBookName(draftName);
    setRenaming(false);
  };

  return (
    <View>
      <Popover
        label="Book options"
        minWidth={240}
        trigger={({ open, triggerProps }) => (
          <Button
            expanded={open}
            hasPopup="dialog"
            onPress={triggerProps.onPress}
          >
            Book options
          </Button>
        )}
      >
        {({ close }) => (
          <View style={styles.options}>
            <Body>{bookName}</Body>
            <Button
              onPress={() => {
                close();
                setDraftName(bookName);
                setRenaming(true);
              }}
            >
              Rename book
            </Button>
          </View>
        )}
      </Popover>
      <WebModalFrame
        footer={
          <Button onPress={saveName} tone="primary">
            Save
          </Button>
        }
        onClose={() => setRenaming(false)}
        size="sm"
        title="Rename book"
        visible={renaming}
      >
        <Input
          label="Book name"
          onChangeText={setDraftName}
          value={draftName}
        />
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8, padding: 12 },
});
