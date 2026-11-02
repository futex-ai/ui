/** Stacked account dialogs for the web modal stack stories and browser tests. */
import { useRef, useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import {
  Body,
  Button,
  Caption,
  Input,
  List,
  ListItem,
  WebModalFrame,
  useAnnouncer,
  useToast,
} from "../index";

/**
 * Which account dialogs are open. The delete confirmation only opens over the
 * settings dialog, so one value covers every reachable pair, and one state
 * update opens or closes both.
 */
type AccountDialogs = "closed" | "confirm" | "settings";

/** The status that the page's refresh action shows and announces. */
const ACCOUNT_UP_TO_DATE = "Account details are up to date.";

/** The kinds of account activity that the sample list repeats. */
const ACTIVITY_TITLES = [
  "Signed in on a new browser",
  "Updated the display name",
  "Downloaded an invoice",
  "Changed the notification settings",
] as const;

/** Sample account activity, long enough that the page scrolls. */
const ACCOUNT_ACTIVITY = Array.from({ length: 24 }, (_, index) => ({
  id: `activity-${index}`,
  title: ACTIVITY_TITLES[index % ACTIVITY_TITLES.length],
  when: index === 0 ? "Today" : index === 1 ? "Yesterday" : `${index} days ago`,
}));

export type ModalStackExampleProps = {
  /**
   * Opens both dialogs in the first render commit, and adds a page action that
   * reopens both with one state update.
   */
  openAtMount?: boolean;
  /**
   * Adds a fixed-width list of recent activity below the page actions, so the
   * page scrolls behind the dialogs.
   */
  scrollablePage?: boolean;
};

/**
 * An account page whose settings dialog renders its delete confirmation inside
 * its own content, the way app code nests a confirm. The confirmation opens on
 * Cancel, the safe action. Its toasts are sticky with a close control, so no
 * timer dismisses them. The page's refresh action announces through the shared
 * announcer, so the announcer's region exists before a dialog opens. Render it
 * inside a `ToastProvider`.
 */
export function ModalStackExample({
  openAtMount = false,
  scrollablePage = false,
}: ModalStackExampleProps) {
  const [dialogs, setDialogs] = useState<AccountDialogs>(
    openAtMount ? "confirm" : "closed",
  );
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const [refreshed, setRefreshed] = useState(false);
  const cancelRef = useRef<View>(null);
  const { announce } = useAnnouncer();
  const { toast } = useToast();

  const refreshAccount = () => {
    setRefreshed(true);
    announce(ACCOUNT_UP_TO_DATE);
  };
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
      <View style={styles.actions}>
        <Button hasPopup="dialog" onPress={() => setDialogs("settings")}>
          Manage account
        </Button>
        <Button onPress={refreshAccount}>Refresh account</Button>
        {openAtMount ? (
          <Button
            hasPopup="dialog"
            onPress={() => setDialogs("confirm")}
            tone="danger"
          >
            Delete my account
          </Button>
        ) : null}
      </View>
      {refreshed ? <Caption>{ACCOUNT_UP_TO_DATE}</Caption> : null}
      {scrollablePage ? (
        <List
          accessibilityLabel="Recent activity"
          itemKey={(entry) => entry.id}
          items={ACCOUNT_ACTIVITY}
          renderItem={(entry) => (
            <ListItem description={entry.when} title={entry.title} />
          )}
          style={styles.activity}
        />
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  activity: { width: 480 },
  dangerAction: { alignSelf: "flex-start" },
  page: { gap: 12 },
});
