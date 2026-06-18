import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Button, ToastProvider, toastController, useToast } from "../index";
import type { ToastPlacement } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Toast/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, minWidth: 320 },
});

/** Toasts in the stories are sticky so reviewers can inspect them; pass a
 *  `duration` in product code to auto-dismiss. */
function ToneTriggers() {
  const { toast } = useToast();
  return (
    <View style={styles.row}>
      <Button
        onPress={() =>
          toast({
            description: "We'll keep you posted.",
            duration: null,
            title: "Heads up",
          })
        }
      >
        Show info
      </Button>
      <Button
        onPress={() =>
          toast({
            description: "Your changes were saved.",
            duration: null,
            title: "Saved",
            tone: "success",
          })
        }
        tone="primary"
      >
        Show success
      </Button>
      <Button
        onPress={() =>
          toast({
            description: "Check your connection.",
            duration: null,
            title: "Slow network",
            tone: "warning",
          })
        }
      >
        Show warning
      </Button>
      <Button
        onPress={() =>
          toast({
            description: "Could not save your invoice.",
            duration: null,
            title: "Save failed",
            tone: "error",
          })
        }
        tone="danger"
      >
        Show error
      </Button>
    </View>
  );
}

function ActionTrigger() {
  const { toast } = useToast();
  return (
    <Button
      onPress={() =>
        toast({
          action: { label: "Undo", onPress: () => undefined },
          description: "The invoice was moved to trash.",
          duration: null,
          title: "Invoice deleted",
          tone: "info",
        })
      }
      tone="primary"
    >
      Delete invoice
    </Button>
  );
}

function AutoDismissTrigger() {
  const { toast } = useToast();
  return (
    <Button
      onPress={() =>
        toast({
          description: "This toast disappears on its own.",
          duration: 2000,
          title: "Copied to clipboard",
          tone: "success",
        })
      }
      tone="primary"
    >
      Copy link
    </Button>
  );
}

function QueueControls() {
  const { toast, dismissAll } = useToast();
  return (
    <View style={styles.row}>
      <Button
        onPress={() =>
          toast({
            description: "Stays until you dismiss it from the API.",
            dismissible: false,
            duration: null,
            title: "Uploading…",
          })
        }
        tone="primary"
      >
        Start upload
      </Button>
      <Button onPress={() => dismissAll()} tone="danger">
        Dismiss all
      </Button>
    </View>
  );
}

function SolidVariantTriggers() {
  return (
    <View style={styles.row}>
      <Button
        onPress={() =>
          toastController.toast({
            dismissible: false,
            duration: null,
            title: "Couldn't move this transaction. Try again.",
            tone: "error",
            variant: "solid",
          })
        }
        tone="danger"
      >
        Show solid error
      </Button>
      <Button
        onPress={() =>
          toastController.toast({
            description: "Check the category and try again.",
            dismissible: false,
            duration: null,
            title: "Transaction not moved",
            tone: "error",
            variant: "solid",
          })
        }
        tone="danger"
      >
        Show description
      </Button>
      <Button
        onPress={() =>
          toastController.toast({
            action: { label: "Retry", onPress: () => undefined },
            dismissible: false,
            duration: null,
            title: "Move failed",
            tone: "error",
            variant: "solid",
          })
        }
        tone="danger"
      >
        Show action
      </Button>
      <Button
        onPress={() =>
          toastController.toast({
            duration: null,
            title: "Saved as draft",
            tone: "success",
            variant: "solid",
          })
        }
        tone="primary"
      >
        Show close
      </Button>
    </View>
  );
}

function LoadingVariantTrigger() {
  return (
    <Button
      onPress={() =>
        toastController.toast({
          dismissible: false,
          duration: null,
          title: "Saving payslips to your device • 3 of 5",
          variant: "loading",
        })
      }
      tone="primary"
    >
      Show loading
    </Button>
  );
}

function ControllerOnMountTrigger() {
  useEffect(() => {
    const id = toastController.toast({
      dismissible: false,
      duration: null,
      title: "Mounted through controller",
      variant: "loading",
    });
    return () => toastController.dismiss(id);
  }, []);

  return null;
}

const playground = (placement: ToastPlacement, children: React.ReactNode) => (
  <StorySurface>
    <ToastProvider placement={placement}>{children}</ToastProvider>
  </StorySurface>
);

export const Tones: Story = {
  name: "Tones",
  render: () => playground("bottom-right", <ToneTriggers />),
};

export const WithAction: Story = {
  name: "With action",
  render: () => playground("bottom-right", <ActionTrigger />),
};

export const TopCenter: Story = {
  name: "Top-center placement",
  render: () => playground("top-center", <ToneTriggers />),
};

export const AutoDismiss: Story = {
  name: "Auto dismiss",
  render: () => playground("bottom-right", <AutoDismissTrigger />),
};

export const QueueAndDismissAll: Story = {
  name: "Non-dismissible and dismiss all",
  render: () => playground("bottom-right", <QueueControls />),
};

export const SolidBottomCenter: Story = {
  name: "Solid bottom-center",
  render: () => playground("bottom-center", <SolidVariantTriggers />),
};

export const LoadingBottomCenter: Story = {
  name: "Loading bottom-center",
  render: () => playground("bottom-center", <LoadingVariantTrigger />),
};

export const ControllerOnMount: Story = {
  name: "Controller on mount",
  render: () => playground("bottom-center", <ControllerOnMountTrigger />),
};
