/**
 * A dialog with a header action: an expand toggle beside Close, drawn with
 * `WebModalHeaderButton`. The modal stories and the header-actions browser
 * spec use it.
 */
import { useState } from "react";
import { Maximize2 } from "../primitives/icons";
import { StyleSheet, View } from "../primitives/reactNative";

import Svg, { Path } from "../primitives/svg";

import {
  Body,
  Button,
  Input,
  WebModalFrame,
  WebModalHeaderButton,
} from "../index";
import type { FocusIndicator, IconComponentProps } from "../index";

/**
 * A collapse glyph of the caller's own, the Lucide `Minimize2` shape. The
 * toggle shows it while the dialog is expanded, so the button shows its state.
 */
function Collapse({ color, size }: IconComponentProps) {
  return (
    <Svg
      aria-hidden
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d="m14 10 7-7" />
      <Path d="M20 10h-6V4" />
      <Path d="m3 21 7-7" />
      <Path d="M4 14h6v6" />
    </Svg>
  );
}

export function ModalHeaderActionsExample({
  focusIndicator,
}: {
  focusIndicator?: FocusIndicator;
}) {
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
        focusIndicator={focusIndicator}
        footer={<Button onPress={() => setVisible(false)}>Done</Button>}
        headerActions={
          <WebModalHeaderButton
            accessibilityLabel="Full screen"
            icon={expanded ? Collapse : Maximize2}
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
