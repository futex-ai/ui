/** Shared wheel-picker bottom sheet used by the web and native overlays. */
import { useMemo, useState } from "react";
import { Pressable, Text } from "react-native";

import { WebModalFrame } from "../modal";
import { useSharedUiTheme } from "../theme";

import { DateWheel } from "./DateWheel";
import type { DatePickerOverlayProps } from "./types";
import { createWheelPickerStyles } from "./wheelPickerStyles";

type DateWheelSheetProps = Pick<
  DatePickerOverlayProps,
  | "label"
  | "max"
  | "min"
  | "onClose"
  | "onSelect"
  | "testID"
  | "today"
  | "value"
>;

/** Stage a wheel selection and commit it from the shared sheet footer. */
export function DateWheelSheet({
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  label,
  testID,
}: DateWheelSheetProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createWheelPickerStyles(theme), [theme]);
  const [draft, setDraft] = useState(value || today);

  return (
    <WebModalFrame
      footer={
        <>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.footerButton, styles.footerCancel]}
          >
            <Text style={styles.footerCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect(draft)}
            style={[styles.footerButton, styles.footerDone]}
          >
            <Text style={styles.footerDoneText}>Done</Text>
          </Pressable>
        </>
      }
      onClose={onClose}
      placement="bottom-sheet"
      scroll={false}
      testID={testID}
      title={label ?? "Select date"}
    >
      <DateWheel
        max={max}
        min={min}
        onChange={setDraft}
        today={today}
        value={draft}
      />
    </WebModalFrame>
  );
}
