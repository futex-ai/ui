/** A modal form that shows a toast while the modal stays open. */
import { useState } from "react";
import { Text, View } from "../primitives/reactNative";

import {
  Button,
  ToastProvider,
  WebModalFrame,
  useSharedUiTheme,
  useToast,
} from "../index";

/**
 * A modal whose Save shows a toast and keeps the modal open. The toast live
 * region exists before the modal opens, so the story covers a status message
 * that an open modal must not hide from screen readers.
 */
export function ModalToastExample() {
  return (
    <ToastProvider placement="bottom-center">
      <ModalWithToast />
    </ToastProvider>
  );
}

function ModalWithToast() {
  const { toast } = useToast();
  const theme = useSharedUiTheme();
  const [visible, setVisible] = useState(true);
  return (
    <View>
      <Button onPress={() => setVisible(true)}>Edit transaction</Button>
      <WebModalFrame
        footer={
          <Button
            onPress={() =>
              toast({
                description: "Your changes were saved.",
                duration: null,
                title: "Saved",
              })
            }
            tone="primary"
          >
            Save
          </Button>
        }
        onClose={() => setVisible(false)}
        title="Edit transaction"
        visible={visible}
      >
        <Text style={{ color: theme.colors.ink2 }}>
          Save keeps this form open and shows a toast.
        </Text>
      </WebModalFrame>
    </View>
  );
}
