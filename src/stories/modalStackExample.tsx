/** Stacked account dialogs for the web modal stack stories and browser tests. */
import { useRef, useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Body, Button, Input, WebModalFrame, useToast } from "../index";

/**
 * Which account dialogs are open. The delete confirmation only opens over the
 * settings dialog, so one value covers every reachable pair, and one state
 * update opens or closes both.
 */
type AccountDialogs = "closed" | "confirm" | "settings";

export type ModalStackExampleProps = {
  /**
   * Opens both dialogs in the first render commit, and adds a page action that
   * reopens both with one state update.
   */
  openAtMount?: boolean;
};

/**
 * An account page whose settings dialog renders its delete confirmation inside
 * its own content, the way app code nests a confirm. The confirmation opens on
 * Cancel, the safe action. Its toasts are sticky with a close control, so no
 * timer dismisses them. Render it inside a `ToastProvider`.
 */
export function ModalStackExample({
  openAtMount = false,
}: ModalStackExampleProps) {
  const [dialogs, setDialogs] = useState<AccountDialogs>(
    openAtMount ? "confirm" : "closed",
  );
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const cancelRef = useRef<View>(null);
  const { toast } = useToast();

  const saveChanges = () => {
    toast({
      description: "Your display name is updated.",
      duration: null,
      title: "Changes saved",
      tone: "success",
    });
  };
  const deleteAccount = () => {
    setDialogs("closed");
    toast({ duration: null, title: "Account deleted" });
  };

  return (
    <View style={styles.page}>
      <Button hasPopup="dialog" onPress={() => setDialogs("settings")}>
        Manage account
      </Button>
      {openAtMount ? (
        <Button
          hasPopup="dialog"
          onPress={() => setDialogs("confirm")}
          tone="danger"
        >
          Delete my account
        </Button>
      ) : null}
      <WebModalFrame
        footer={
          <Button onPress={saveChanges} tone="primary">
            Save changes
          </Button>
        }
        onClose={() => setDialogs("closed")}
        title="Account settings"
        visible={dialogs !== "closed"}
      >
        <Input
          label="Display name"
          onChangeText={setDisplayName}
          value={displayName}
        />
        <Button
          hasPopup="dialog"
          onPress={() => setDialogs("confirm")}
          style={styles.dangerAction}
          tone="danger"
        >
          Delete account
        </Button>
        <WebModalFrame
          footer={
            <>
              <Button
                buttonRef={cancelRef}
                onPress={() => setDialogs("settings")}
              >
                Cancel
              </Button>
              <Button onPress={deleteAccount} tone="danger">
                Delete
              </Button>
            </>
          }
          initialFocusRef={cancelRef}
          onClose={() => setDialogs("settings")}
          size="sm"
          title="Delete your account?"
          visible={dialogs === "confirm"}
        >
          <Body>
            This removes your account and its data. You can't undo this.
          </Body>
        </WebModalFrame>
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  dangerAction: { alignSelf: "flex-start" },
  page: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
