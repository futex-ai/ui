/**
 * A dialog with a header action: an expand toggle beside Close, drawn with
 * `WebModalHeaderButton`. The modal stories and the header-actions browser
 * spec use it.
 */
import { useState } from "react";
import { Maximize2 } from "../primitives/icons";
import { StyleSheet, View } from "../primitives/reactNative";

import {
  Body,
  Button,
  Input,
  WebModalFrame,
  WebModalHeaderButton,
} from "../index";

export function ModalHeaderActionsExample() {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [bookName, setBookName] = useState("Household");
  return (
    <View>
      <Button hasPopup="dialog" onPress={() => setVisible(true)}>
        Open settings
      </Button>
      <WebModalFrame
        closeLabel="Close settings"
        footer={<Button onPress={() => setVisible(false)}>Done</Button>}
        headerActions={
          <WebModalHeaderButton
            accessibilityLabel="Full screen"
            icon={Maximize2}
            onPress={() => setExpanded((value) => !value)}
            pressed={expanded}
          />
        }
        onClose={() => setVisible(false)}
        size="lg"
        surfaceStyle={expanded ? styles.fullScreen : null}
        title="Settings"
        visible={visible}
      >
        <Input label="Book name" onChangeText={setBookName} value={bookName} />
        <Body>
          {expanded
            ? "The dialog fills the window."
            : "Press Full screen to fill the window."}
        </Body>
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { height: "100%", maxHeight: "100%", maxWidth: "100%" },
});
